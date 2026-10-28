-- ==============================================================================
-- RecallLoop AI v2: RLS Security & Invariant Automated SQL Tests
-- ==============================================================================
-- How to run: Execute within Supabase SQL Editor or via psql.
-- The script wraps in a transaction and issues ROLLBACK at the end so it leaves
-- zero test artifacts behind.

BEGIN;

-- Helper notice function
CREATE OR REPLACE PROCEDURE test_assert(p_condition BOOLEAN, p_test_name TEXT)
LANGUAGE plpgsql AS $$
BEGIN
    IF p_condition THEN
        RAISE NOTICE '✅ PASS: %', p_test_name;
    ELSE
        RAISE EXCEPTION '❌ FAIL: %', p_test_name;
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 1. SETUP TEST FIXTURES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_admin_id UUID := '11111111-1111-1111-1111-111111111111';
    v_teacher_c_id UUID := '22222222-2222-2222-2222-222222222222';
    v_teacher_py_id UUID := '33333333-3333-3333-3333-333333333333';
    v_alice_id UUID := '44444444-4444-4444-4444-444444444444';
    v_bob_id UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
    -- Insert test profiles
    INSERT INTO public.profiles (id, email, full_name, role, status) VALUES
    (v_admin_id, 'admin_test@test.com', 'Admin Test', 'admin', 'active'),
    (v_teacher_c_id, 'teacher_c@test.com', 'Prof. C', 'teacher', 'active'),
    (v_teacher_py_id, 'teacher_py@test.com', 'Prof. Python', 'teacher', 'active'),
    (v_alice_id, 'alice@test.com', 'Alice Student', 'student', 'active'),
    (v_bob_id, 'bob@test.com', 'Bob Student', 'student', 'active');

    -- Insert test subjects
    INSERT INTO public.subjects (id, name, code, description) VALUES
    ('subj-test-c', 'C Programming', 'TEST_CS101', 'Test C course'),
    ('subj-test-py', 'Python Programming', 'TEST_PY101', 'Test Python course');

    -- Teacher subject mapping: Prof C -> C course; Prof Python -> Python course
    INSERT INTO public.teacher_subjects (teacher_id, subject_id) VALUES
    (v_teacher_c_id, 'subj-test-c'),
    (v_teacher_py_id, 'subj-test-py');

    -- Enrollments: Alice -> C course only; Bob -> Python course only
    INSERT INTO public.enrollments (student_id, subject_id) VALUES
    (v_alice_id, 'subj-test-c'),
    (v_bob_id, 'subj-test-py');

    -- Topics
    INSERT INTO public.topics (id, subject_id, name, slug, order_index) VALUES
    ('topic-test-c-ptr', 'subj-test-c', 'Pointers', 'pointers', 1),
    ('topic-test-py-lists', 'subj-test-py', 'Lists', 'lists', 1);

    -- Questions
    INSERT INTO public.questions (
        id, subject_id, topic_id, teacher_id, concept, question, options, correct_index, wrong_reasons, explanation, status
    ) VALUES (
        'q-test-c-1', 'subj-test-c', 'topic-test-c-ptr', v_teacher_c_id, 'Dereference',
        'What does *ptr return?', jsonb_build_array('Val', 'Addr', 'Null', 'Size'),
        0, jsonb_build_array('', 'Reason 1', 'Reason 2', 'Reason 3'), 'Explanation 1', 'published'
    ), (
        'q-test-py-1', 'subj-test-py', 'topic-test-py-lists', v_teacher_py_id, 'Append',
        'How to append in Python?', jsonb_build_array('append()', 'push()', 'add()', 'put()'),
        0, jsonb_build_array('', 'Reason 1', 'Reason 2', 'Reason 3'), 'Explanation 2', 'published'
    );

    -- Attempts
    INSERT INTO public.attempts (
        student_id, subject_id, topic_id, question_id, selected_answer, is_correct
    ) VALUES (
        v_alice_id, 'subj-test-c', 'topic-test-c-ptr', 'q-test-c-1', 0, true
    ), (
        v_bob_id, 'subj-test-py', 'topic-test-py-lists', 'q-test-py-1', 1, false
    );

    -- Contact messages
    INSERT INTO public.contact_messages (name, email, subject, message)
    VALUES ('Visitor', 'visitor@test.com', 'Help', 'General inquiry');
END $$;

-- ------------------------------------------------------------------------------
-- 2. RUN RLS SECURITY ASSERTIONS
-- ------------------------------------------------------------------------------

-- TEST A: Student Alice can read her own attempts, but CANNOT read Bob's attempts
DO $$
DECLARE
    v_alice_count INTEGER;
    v_bob_attempts_visible INTEGER;
BEGIN
    -- Simulate authentication as Alice
    PERFORM set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);

    SELECT COUNT(*) INTO v_alice_count FROM public.attempts WHERE student_id = '44444444-4444-4444-4444-444444444444';
    CALL test_assert(v_alice_count = 1, 'Alice can read her own attempt');

    -- Try to select Bob's attempts
    SELECT COUNT(*) INTO v_bob_attempts_visible FROM public.attempts WHERE student_id = '55555555-5555-5555-5555-555555555555';
    CALL test_assert(v_bob_attempts_visible = 0, 'Alice CANNOT read Bob attempts (RLS blocks rows)');
END $$;

-- TEST B: Student Alice cannot read subjects she is not enrolled in
DO $$
DECLARE
    v_py_subject_count INTEGER;
    v_c_subject_count INTEGER;
BEGIN
    PERFORM set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);

    -- Should see C Programming
    SELECT COUNT(*) INTO v_c_subject_count FROM public.subjects WHERE id = 'subj-test-c';
    CALL test_assert(v_c_subject_count = 1, 'Alice CAN read enrolled subject (subj-test-c)');

    -- Should NOT see Python Programming
    SELECT COUNT(*) INTO v_py_subject_count FROM public.subjects WHERE id = 'subj-test-py';
    CALL test_assert(v_py_subject_count = 0, 'Alice CANNOT read unenrolled subject (subj-test-py)');
END $$;

-- TEST C: Student Alice cannot read correct_index from base questions table
DO $$
DECLARE
    v_questions_visible INTEGER;
BEGIN
    PERFORM set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);

    -- Base table questions has NO select policy for student role
    SELECT COUNT(*) INTO v_questions_visible FROM public.questions;
    CALL test_assert(v_questions_visible = 0, 'Alice CANNOT read base questions table directly (Shields correct_index)');
END $$;

-- TEST D: Student Alice can read sanitized questions view (which omits correct_index)
DO $$
DECLARE
    v_sanitized_count INTEGER;
BEGIN
    PERFORM set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);

    SELECT COUNT(*) INTO v_sanitized_count FROM public.student_questions WHERE subject_id = 'subj-test-c';
    CALL test_assert(v_sanitized_count = 1, 'Alice CAN read sanitized question view for enrolled subject');
END $$;

-- TEST E: Active Teacher can only view/manage assignments for their assigned subject
DO $$
DECLARE
    v_teacher_c_assigned_count INTEGER;
    v_teacher_c_unassigned_count INTEGER;
BEGIN
    PERFORM set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

    -- Prof C manages C subject
    SELECT COUNT(*) INTO v_teacher_c_assigned_count FROM public.subjects WHERE id = 'subj-test-c';
    CALL test_assert(v_teacher_c_assigned_count = 1, 'Prof C can read assigned subject');

    -- Prof C does NOT manage Python subject
    SELECT COUNT(*) INTO v_teacher_c_unassigned_count FROM public.subjects WHERE id = 'subj-test-py';
    CALL test_assert(v_teacher_c_unassigned_count = 0, 'Prof C CANNOT read unassigned subject (subj-test-py)');
END $$;

-- TEST F: Only Admins can read contact_messages
DO $$
DECLARE
    v_alice_messages_visible INTEGER;
    v_admin_messages_visible INTEGER;
BEGIN
    -- Alice (Student)
    PERFORM set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
    SELECT COUNT(*) INTO v_alice_messages_visible FROM public.contact_messages;
    CALL test_assert(v_alice_messages_visible = 0, 'Student CANNOT read contact messages');

    -- Admin
    PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
    SELECT COUNT(*) INTO v_admin_messages_visible FROM public.contact_messages;
    CALL test_assert(v_admin_messages_visible >= 1, 'Admin CAN read contact messages');
END $$;

-- TEST G: Constraint UNIQUE(subject_id, assigned_date) rejects duplicates on the same day
DO $$
DECLARE
    v_error_thrown BOOLEAN := false;
BEGIN
    PERFORM set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

    -- Insert first assignment for 2026-10-28
    INSERT INTO public.assignments (subject_id, topic_id, teacher_id, assigned_date, title, status)
    VALUES ('subj-test-c', 'topic-test-c-ptr', '22222222-2222-2222-2222-222222222222', '2026-10-28', 'Day 1 Topic', 'published');

    -- Try inserting a SECOND topic for the same subject on the same day
    BEGIN
        INSERT INTO public.assignments (subject_id, topic_id, teacher_id, assigned_date, title, status)
        VALUES ('subj-test-c', 'topic-test-c-ptr', '22222222-2222-2222-2222-222222222222', '2026-10-28', 'Day 1 Conflicting Topic', 'published');
    EXCEPTION WHEN unique_violation THEN
        v_error_thrown := true;
    END;

    CALL test_assert(v_error_thrown = true, 'Rule 7 Enforced: UNIQUE(subject_id, assigned_date) rejected duplicate daily topic');
END $$;

ROLLBACK;
