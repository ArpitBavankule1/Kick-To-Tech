-- ==============================================================================
-- RecallLoop AI v2: Complete Supabase Database Setup & Auth Trigger Migration
--
-- This script sets up all tables, foreign keys, constraints, RLS policies,
-- the automated auth.users signup trigger, and foundational seed data.
--
-- HOW TO RUN:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/psfsbobotsacfmjwfmpo
-- 2. Go to the "SQL Editor" in the left navigation sidebar.
-- 3. Click "New Query".
-- 4. Paste this entire script and click "Run".
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. CLEANUP (Idempotent execution)
-- ==============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.submit_attempt(TEXT, INTEGER, UUID) CASCADE;
DROP VIEW IF EXISTS public.student_questions CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.attempts CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.teacher_subjects CASCADE;
DROP TABLE IF EXISTS public.topics CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==============================================================================
-- 2. PROFILES TABLE (Linked directly to auth.users)
-- ==============================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'suspended')) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. AUTOMATIC AUTH TRIGGER (Creates profile immediately on Email/Password Signup)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_status TEXT;
    v_full_name TEXT;
BEGIN
    -- Extract role from metadata passed during supabase.auth.signUp
    v_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
    IF v_role NOT IN ('student', 'teacher', 'admin') THEN
        v_role := 'student';
    END IF;

    -- Extract full name
    v_full_name := COALESCE(
        new.raw_user_meta_data->>'full_name',
        split_part(new.email, '@', 1)
    );

    -- Teachers default to pending for admin approval; students default to active
    IF v_role = 'teacher' THEN
        v_status := 'pending';
    ELSE
        v_status := 'active';
    END IF;

    -- Upsert profile row
    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (new.id, new.email, v_full_name, v_role, v_status)
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

-- Bind trigger to auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. SUBJECTS TABLE
-- ==============================================================================
CREATE TABLE public.subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. TOPICS TABLE
-- ==============================================================================
CREATE TABLE public.topics (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(subject_id, slug)
);

-- ==============================================================================
-- 6. TEACHER_SUBJECTS TABLE
-- ==============================================================================
CREATE TABLE public.teacher_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(teacher_id, subject_id)
);

-- ==============================================================================
-- 7. ENROLLMENTS TABLE
-- ==============================================================================
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, subject_id)
);

-- ==============================================================================
-- 8. ASSIGNMENTS TABLE (Rule 7: One assigned topic per subject per day)
-- ==============================================================================
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_date DATE NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_assigned_topic_per_subject_per_day UNIQUE(subject_id, assigned_date)
);

-- ==============================================================================
-- 9. QUESTIONS TABLE
-- ==============================================================================
CREATE TABLE public.questions (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    concept TEXT NOT NULL,
    question TEXT NOT NULL,
    code_snippet TEXT,
    options JSONB NOT NULL,
    correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
    wrong_reasons JSONB NOT NULL,
    explanation TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_four_options CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 4)
);

-- ==============================================================================
-- 10. SANITIZED STUDENT QUESTIONS VIEW (Shields correct_index from inspection)
-- ==============================================================================
CREATE OR REPLACE VIEW public.student_questions AS
SELECT
    q.id,
    q.subject_id,
    q.topic_id,
    q.concept,
    q.question,
    q.code_snippet,
    q.options,
    q.difficulty,
    q.created_at
FROM public.questions q
WHERE q.status = 'published';

-- ==============================================================================
-- 11. ATTEMPTS TABLE (Stores student responses)
-- ==============================================================================
CREATE TABLE public.attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
    selected_answer INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 12. CONTACT_MESSAGES TABLE
-- ==============================================================================
CREATE TABLE public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 13. SECURE RPC: SUBMIT ATTEMPT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.submit_attempt(
    p_question_id TEXT,
    p_selected_answer INTEGER,
    p_assignment_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_question public.questions%ROWTYPE;
    v_student_id UUID;
    v_is_correct BOOLEAN;
    v_wrong_reason TEXT := NULL;
    v_attempt_id UUID;
BEGIN
    v_student_id := auth.uid();
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Fetch question securely from base table
    SELECT * INTO v_question
    FROM public.questions
    WHERE id = p_question_id AND status = 'published';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Question not found or not published.';
    END IF;

    -- Validate bounds
    IF p_selected_answer < 0 OR p_selected_answer > 3 THEN
        RAISE EXCEPTION 'Selected answer must be between 0 and 3.';
    END IF;

    v_is_correct := (p_selected_answer = v_question.correct_index);

    IF NOT v_is_correct AND jsonb_array_length(v_question.wrong_reasons) > p_selected_answer THEN
        v_wrong_reason := v_question.wrong_reasons->>p_selected_answer;
    END IF;

    INSERT INTO public.attempts (
        student_id,
        subject_id,
        topic_id,
        question_id,
        assignment_id,
        selected_answer,
        is_correct
    ) VALUES (
        v_student_id,
        v_question.subject_id,
        v_question.topic_id,
        v_question.id,
        p_assignment_id,
        p_selected_answer,
        v_is_correct
    )
    RETURNING id INTO v_attempt_id;

    RETURN jsonb_build_object(
        'attempt_id', v_attempt_id,
        'is_correct', v_is_correct,
        'correct_index', v_question.correct_index,
        'explanation', v_question.explanation,
        'wrong_reason', v_wrong_reason
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_attempt TO authenticated;

-- ==============================================================================
-- 14. HELPER SECURITY FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_active_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'teacher' AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_subject(p_subject_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.teacher_subjects
        WHERE teacher_id = auth.uid() AND subject_id = p_subject_id
    ) AND public.is_active_teacher();
$$;

CREATE OR REPLACE FUNCTION public.is_enrolled_in_subject(p_subject_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.enrollments
        WHERE student_id = auth.uid() AND subject_id = p_subject_id
    );
$$;

-- ==============================================================================
-- 15. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- PROFILES:
CREATE POLICY "Admins full access to profiles"
ON public.profiles FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- SUBJECTS:
-- Anyone can view subjects to allow registration code validation and catalog browsing
CREATE POLICY "Anyone can view subjects"
ON public.subjects FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Admins manage subjects"
ON public.subjects FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- TOPICS:
CREATE POLICY "Anyone can view topics"
ON public.topics FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Admins manage topics"
ON public.topics FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- TEACHER_SUBJECTS:
CREATE POLICY "Admins manage teacher_subjects"
ON public.teacher_subjects FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Teachers can view their assigned subjects"
ON public.teacher_subjects FOR SELECT TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can self-map subject on registration"
ON public.teacher_subjects FOR INSERT TO authenticated
WITH CHECK (teacher_id = auth.uid());

-- ENROLLMENTS:
CREATE POLICY "Admins manage enrollments"
ON public.enrollments FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Teachers view enrollments for their subjects"
ON public.enrollments FOR SELECT TO authenticated
USING (public.is_teacher_of_subject(subject_id));

CREATE POLICY "Students view their own enrollments"
ON public.enrollments FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students can self-enroll"
ON public.enrollments FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

-- ASSIGNMENTS:
CREATE POLICY "Admins manage assignments"
ON public.assignments FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Teachers manage assignments for their subjects"
ON public.assignments FOR ALL TO authenticated
USING (public.is_teacher_of_subject(subject_id))
WITH CHECK (public.is_teacher_of_subject(subject_id));

CREATE POLICY "Students view published assignments"
ON public.assignments FOR SELECT TO authenticated
USING (status = 'published');

-- QUESTIONS:
CREATE POLICY "Admins manage questions"
ON public.questions FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Teachers manage questions for their subjects"
ON public.questions FOR ALL TO authenticated
USING (public.is_teacher_of_subject(subject_id))
WITH CHECK (public.is_teacher_of_subject(subject_id));

-- ATTEMPTS:
CREATE POLICY "Admins manage attempts"
ON public.attempts FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Teachers view attempts in their subjects"
ON public.attempts FOR SELECT TO authenticated
USING (public.is_teacher_of_subject(subject_id));

CREATE POLICY "Students view their own attempts"
ON public.attempts FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students insert their own attempts"
ON public.attempts FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

-- CONTACT_MESSAGES:
CREATE POLICY "Anyone can submit contact message"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins view contact messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 16. SEED DATA (Introductory Subjects, Topics, Assignment, & Sample Questions)
-- ==============================================================================

-- Subjects
INSERT INTO public.subjects (id, name, code, description) VALUES
('subj-cs101', 'Programming in C', 'CS101', 'Core introductory computer science covering memory management, control structures, and fundamental algorithms.'),
('subj-data200', 'Data Structures & Algorithms', 'DATA200', 'Advanced data models, pointer manipulation, balanced search trees, and asymptotic analysis.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

-- Topics for CS101
INSERT INTO public.topics (id, subject_id, name, slug, description, order_index) VALUES
('topic-arrays', 'subj-cs101', 'Arrays', 'arrays', 'Contiguous memory buffers, 0-based indexing arithmetic, element shifting costs, and dynamic resizing.', 1),
('topic-loops', 'subj-cs101', 'Loops', 'loops', 'Iteration bounds, off-by-one errors, while loop conditions, nested loop time complexity O(N^2), and termination invariants.', 2),
('topic-pointers', 'subj-cs101', 'Pointers', 'pointers', 'Memory address operators (&), dereferencing (*), pointer arithmetic scale factors, and dangling stack pointers.', 3),
('topic-data-structures', 'subj-cs101', 'Data Structures', 'data-structures', 'Singly and doubly linked lists, node pointers, sentinel heads, and pointer reconnection invariants.', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- Seed Published Questions for Pointers Topic
INSERT INTO public.questions (
    id, subject_id, topic_id, teacher_id, concept, question, code_snippet,
    options, correct_index, wrong_reasons, explanation, difficulty, status
) VALUES
(
    'q-ptr-01',
    'subj-cs101',
    'topic-pointers',
    NULL,
    'Pointer Dereference',
    'What are the values of `a` and `*ptr` after running this code?',
    'int a = 10;' || E'\n' || 'int *ptr = &a;' || E'\n' || '*ptr = 99;',
    '["a = 10, *ptr = 10", "a = 99, *ptr = 99", "a = 10, *ptr = 99", "Compilation Error"]'::jsonb,
    1,
    '["Dereferencing *ptr and assigning to it mutates the value of a directly.", "Correct answer.", "Pointer and variable share the exact same memory address.", "Valid C syntax."]'::jsonb,
    '`ptr` stores the memory address of `a`. Dereferencing `*ptr = 99` writes directly into the address of `a`, mutating both `a` and `*ptr` to 99.',
    'easy',
    'published'
),
(
    'q-ptr-02',
    'subj-cs101',
    'topic-pointers',
    NULL,
    'Pointer Arithmetic',
    'If `int *ptr = 1000` on a 64-bit architecture where `sizeof(int) == 4`, what address is stored in `ptr + 2`?',
    NULL,
    '["1002", "1004", "1008", "1016"]'::jsonb,
    2,
    '["Pointer arithmetic scales by sizeof(type), not raw bytes.", "Incrementing by 2 integers adds 2 * 4 = 8 bytes, not 4 bytes.", "Correct answer: 1000 + (2 * 4) = 1008.", "16 would correspond to 4 integers."]'::jsonb,
    'In C, adding an integer `k` to a pointer advances the memory address by `k * sizeof(*ptr)`. Here, `2 * 4 = 8` bytes, resulting in address `1008`.',
    'medium',
    'published'
),
(
    'q-ptr-03',
    'subj-cs101',
    'topic-pointers',
    NULL,
    'Address-of vs Value',
    'Which operator is used to obtain the physical memory address of an existing variable?',
    NULL,
    '["*", "&", "->", "%"]'::jsonb,
    1,
    '["* is the dereference operator used to read/write the value at an address.", "Correct: & is the unary address-of operator.", "-> is used to access structure members through a pointer.", "% is the modulo remainder operator."]'::jsonb,
    'The ampersand `&` is the address-of operator in C. It returns a pointer pointing to the operand variable.',
    'easy',
    'published'
),
(
    'q-ptr-04',
    'subj-cs101',
    'topic-pointers',
    NULL,
    'Dangling Pointers',
    'What dangerous bug does the following function contain?',
    'int* get_val() {' || E'\n' || '    int x = 42;' || E'\n' || '    return &x;' || E'\n' || '}',
    '["Memory leak", "Returning pointer to stack memory (Dangling pointer)", "Buffer overflow", "Syntax error"]'::jsonb,
    1,
    '["Memory leaks occur with un-freed heap memory (malloc).", "Correct: local variable x is deallocated when get_val() returns.", "No buffer is written out of bounds.", "The function is syntactically valid C."]'::jsonb,
    'Variable `x` is allocated on the function stack frame. When `get_val()` returns, its stack frame is reclaimed, leaving the caller with a dangling pointer that points to invalidated memory.',
    'medium',
    'published'
),
(
    'q-ptr-05',
    'subj-cs101',
    'topic-pointers',
    NULL,
    'Double Pointers',
    'Given `int x = 5; int *p = &x; int **pp = &p;`, what does `**pp` evaluate to?',
    NULL,
    '["Address of x", "Address of p", "5", "Undefined behavior"]'::jsonb,
    2,
    '["Single dereference *pp gives the address of x.", "pp holds the address of p.", "Correct: double dereference **pp accesses the integer value 5.", "All pointers are properly initialized."]'::jsonb,
    '`pp` points to `p`, and `p` points to `x`. Dereferencing once (`*pp`) yields `p` (the address of `x`). Dereferencing twice (`**pp`) yields the actual value of `x`, which is `5`.',
    'hard',
    'published'
)
ON CONFLICT (id) DO UPDATE SET
    question = EXCLUDED.question,
    options = EXCLUDED.options,
    correct_index = EXCLUDED.correct_index,
    wrong_reasons = EXCLUDED.wrong_reasons,
    status = 'published';

-- ==============================================================================
-- 17. REFRESH SCHEMA CACHE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
