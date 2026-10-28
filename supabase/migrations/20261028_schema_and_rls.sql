-- ==============================================================================
-- RecallLoop AI v2: Comprehensive Multi-Role Schema with Strict RLS
-- ==============================================================================

-- Drop existing tables/views if recreating cleanly
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
-- 1. PROFILES TABLE
-- Constraints: role (student | teacher | admin), status (pending | active | suspended)
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
-- 2. SUBJECTS TABLE
-- Constraints: code is UNIQUE
-- ==============================================================================
CREATE TABLE public.subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. TOPICS TABLE
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
-- 4. TEACHER_SUBJECTS TABLE
-- Links teachers to subjects they manage
-- ==============================================================================
CREATE TABLE public.teacher_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(teacher_id, subject_id)
);

-- ==============================================================================
-- 5. ENROLLMENTS TABLE
-- Links students to subjects they are enrolled in
-- ==============================================================================
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, subject_id)
);

-- ==============================================================================
-- 6. ASSIGNMENTS TABLE
-- Constraints: UNIQUE(subject_id, assigned_date); status draft | published
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
-- 7. QUESTIONS TABLE
-- Constraints:
-- - options jsonb with exactly 4 entries
-- - correct_index integer 0-3
-- - wrong_reasons jsonb
-- ==============================================================================
CREATE TABLE public.questions (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    concept TEXT NOT NULL,
    question TEXT NOT NULL,
    code_snippet TEXT,
    options JSONB NOT NULL CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 4),
    correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
    wrong_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    explanation TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. ATTEMPTS TABLE
-- References student, question, topic, subject
-- ==============================================================================
CREATE TABLE public.attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
    selected_answer INTEGER NOT NULL CHECK (selected_answer >= 0 AND selected_answer <= 3),
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. CONTACT_MESSAGES TABLE
-- Anyone can insert; only admin can read
-- ==============================================================================
CREATE TABLE public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- SECURITY HELPER FUNCTIONS (Prevent RLS recursion & enforce clean RBAC)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

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

-- ==============================================================================
-- SECURE ANSWER SHIELDING FOR STUDENTS
-- Approach:
-- 1. The base `questions` table is NOT directly readable by students.
-- 2. Students query the sanitized view `public.student_questions` which strips
--    `correct_index`, `wrong_reasons`, and `explanation`.
-- 3. Answers are validated SERVER-SIDE via `public.submit_attempt(...)`.
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
WHERE q.status = 'published'
  AND (
    public.is_admin()
    OR public.is_teacher_of_subject(q.subject_id)
    OR public.is_enrolled_in_subject(q.subject_id)
  );

-- Grant select on the sanitized view
GRANT SELECT ON public.student_questions TO authenticated;

-- Server-side answer submission and attempt recording
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

    -- Verify student is enrolled in this subject (unless admin)
    IF NOT public.is_admin() AND NOT public.is_enrolled_in_subject(v_question.subject_id) THEN
        RAISE EXCEPTION 'Student is not enrolled in this subject.';
    END IF;

    -- Validate answer bounds
    IF p_selected_answer < 0 OR p_selected_answer > 3 THEN
        RAISE EXCEPTION 'Selected answer must be between 0 and 3.';
    END IF;

    -- Check correctness server-side
    v_is_correct := (p_selected_answer = v_question.correct_index);

    -- Extract wrong reason if incorrect
    IF NOT v_is_correct AND jsonb_array_length(v_question.wrong_reasons) > p_selected_answer THEN
        v_wrong_reason := v_question.wrong_reasons->>p_selected_answer;
    END IF;

    -- Insert attempt into attempts table
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

    -- Return full result securely AFTER answering
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
-- ROW-LEVEL SECURITY POLICIES (Rule 6: Every table has RLS)
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

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- Admin: full access
-- Student / Teacher: read/update own profile
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins have full access to profiles"
ON public.profiles FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can read their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- SUBJECTS POLICIES
-- Admin: full access
-- Teacher: read subjects they are assigned to
-- Student: read subjects they are enrolled in
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins have full access to subjects"
ON public.subjects FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Teachers can read their assigned subjects"
ON public.subjects FOR SELECT TO authenticated
USING (public.is_teacher_of_subject(id));

CREATE POLICY "Students can read their enrolled subjects"
ON public.subjects FOR SELECT TO authenticated
USING (public.is_enrolled_in_subject(id));

-- ------------------------------------------------------------------------------
-- TOPICS POLICIES
-- Admin: full access
-- Teacher: read topics for their assigned subjects
-- Student: read topics for their enrolled subjects
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins have full access to topics"
ON public.topics FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Teachers can view topics for their assigned subjects"
ON public.topics FOR SELECT TO authenticated
USING (public.is_teacher_of_subject(subject_id));

CREATE POLICY "Students can view topics for their enrolled subjects"
ON public.topics FOR SELECT TO authenticated
USING (public.is_enrolled_in_subject(subject_id));

-- ------------------------------------------------------------------------------
-- TEACHER_SUBJECTS POLICIES
-- Admin: full access
-- Teacher: view their own subject assignments
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins have full access to teacher_subjects"
ON public.teacher_subjects FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Teachers can view their own subject assignments"
ON public.teacher_subjects FOR SELECT TO authenticated
USING (teacher_id = auth.uid());

-- ------------------------------------------------------------------------------
-- ENROLLMENTS POLICIES
-- Admin: full access
-- Teacher: view enrollments for their assigned subjects
-- Student: view their own enrollments
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins have full access to enrollments"
ON public.enrollments FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Teachers can view enrollments in their subjects"
ON public.enrollments FOR SELECT TO authenticated
USING (public.is_teacher_of_subject(subject_id));

CREATE POLICY "Students can view their own enrollments"
ON public.enrollments FOR SELECT TO authenticated
USING (student_id = auth.uid());

-- ------------------------------------------------------------------------------
-- ASSIGNMENTS POLICIES
-- Admin: full access
-- Active Teacher: read/write assignments for their assigned subjects
-- Student: read published assignments for subjects they are enrolled in
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins have full access to assignments"
ON public.assignments FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Active teachers can manage assignments for their subjects"
ON public.assignments FOR ALL TO authenticated
USING (public.is_teacher_of_subject(subject_id))
WITH CHECK (public.is_teacher_of_subject(subject_id));

CREATE POLICY "Students can view published assignments for enrolled subjects"
ON public.assignments FOR SELECT TO authenticated
USING (
    status = 'published'
    AND public.is_enrolled_in_subject(subject_id)
);

-- ------------------------------------------------------------------------------
-- QUESTIONS POLICIES
-- Admin: full access
-- Active Teacher: read/write questions for their assigned subjects
-- Students: BLOCKED from direct SELECT on base table (use student_questions view)
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins have full access to questions"
ON public.questions FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Active teachers can manage questions for their subjects"
ON public.questions FOR ALL TO authenticated
USING (public.is_teacher_of_subject(subject_id))
WITH CHECK (public.is_teacher_of_subject(subject_id));

-- Note: Students have NO select policy on public.questions directly,
-- which prevents peeking at correct_index. They access sanitized questions
-- via the view `public.student_questions`.

-- ------------------------------------------------------------------------------
-- ATTEMPTS POLICIES
-- Admin: full access
-- Active Teacher: read attempts for their assigned subjects
-- Student: read/insert only their own attempts
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins have full access to attempts"
ON public.attempts FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Active teachers can read attempts for their subjects"
ON public.attempts FOR SELECT TO authenticated
USING (public.is_teacher_of_subject(subject_id));

CREATE POLICY "Students can read only their own attempts"
ON public.attempts FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students can insert only their own attempts"
ON public.attempts FOR INSERT TO authenticated
WITH CHECK (
    student_id = auth.uid()
    AND public.is_enrolled_in_subject(subject_id)
);

-- ------------------------------------------------------------------------------
-- CONTACT_MESSAGES POLICIES
-- Anyone (authenticated or anon) can insert
-- Only admin can read/manage
-- ------------------------------------------------------------------------------
CREATE POLICY "Anyone can submit a contact message"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Only admins can view contact messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Only admins can update/delete contact messages"
ON public.contact_messages FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
