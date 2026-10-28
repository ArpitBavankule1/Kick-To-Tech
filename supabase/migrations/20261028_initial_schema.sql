-- ==============================================================================
-- RecallLoop AI v2: Initial Schema with Row-Level Security (RLS)
-- ==============================================================================

-- 1. Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')) DEFAULT 'student',
    is_approved BOOLEAN NOT NULL DEFAULT false, -- Teachers need admin approval
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Topics
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(subject_id, slug)
);

-- 4. Daily Assignments (Rule 7: One assigned topic per subject per day)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_date DATE NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_assigned_topic_per_subject_per_day UNIQUE(subject_id, assigned_date)
);

-- 5. Questions (Rule 8: Gemini output is untrusted; teacher must publish)
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    concept TEXT NOT NULL,
    question TEXT NOT NULL,
    code_snippet TEXT,
    options JSONB NOT NULL, -- Array of 4 string options
    correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
    explanation TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Student Attempts (Rule 2: Mastery, status, trends are DERIVED, never stored)
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
    selected_answer INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW-LEVEL SECURITY POLICIES (Rule 6: Every table has RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are readable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Subjects & Topics (Public readable, Admin/Approved Teacher manageable)
CREATE POLICY "Anyone can view subjects and topics"
ON public.subjects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view topics"
ON public.topics FOR SELECT TO authenticated USING (true);

-- Assignments Policies
CREATE POLICY "Students and teachers can view assignments"
ON public.assignments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Approved teachers and admins can create assignments"
ON public.assignments FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND (role = 'admin' OR (role = 'teacher' AND is_approved = true))
    )
);

-- Questions Policies
CREATE POLICY "Students can only read published questions"
ON public.questions FOR SELECT TO authenticated
USING (
    status = 'published'
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND (role = 'admin' OR (role = 'teacher' AND is_approved = true))
    )
);

-- Attempts Policies (Rule 6: Students can only read and insert their own attempts)
CREATE POLICY "Students can view only their own attempts"
ON public.attempts FOR SELECT TO authenticated
USING (
    student_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND (role = 'admin' OR (role = 'teacher' AND is_approved = true))
    )
);

CREATE POLICY "Students can insert their own attempts"
ON public.attempts FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());
