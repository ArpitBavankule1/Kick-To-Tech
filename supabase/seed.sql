-- ==============================================================================
-- RecallLoop AI v2: Seed Data Migration
-- ==============================================================================

-- 1. SEED ADMIN USER
-- Insert admin into auth.users (if not already present)
DO $$
DECLARE
    v_admin_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Insert into auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_admin_id) THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
        ) VALUES (
            v_admin_id,
            '00000000-0000-0000-0000-000000000000',
            'admin@recallloop.dev',
            crypt('AdminSecretPass123!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Seeded Root Administrator"}',
            false,
            'authenticated'
        );
    END IF;

    -- Insert into public.profiles
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        status,
        created_at
    ) VALUES (
        v_admin_id,
        'admin@recallloop.dev',
        'Seeded Root Administrator',
        'admin',
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        status = 'active';
END $$;

-- 2. SEED SUBJECT: "Programming in C" (Code: CS101)
INSERT INTO public.subjects (id, name, code, description)
VALUES (
    'subj-cs101',
    'Programming in C',
    'CS101',
    'Core introductory computer science sequence covering memory management, control structures, and fundamental algorithms.'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    description = EXCLUDED.description;

-- 3. SEED TOPICS: Arrays, Loops, Pointers, Data Structures
INSERT INTO public.topics (id, subject_id, name, slug, description, order_index)
VALUES
(
    'topic-arrays',
    'subj-cs101',
    'Arrays',
    'arrays',
    'Contiguous memory buffers, 0-based indexing arithmetic, element shifting costs, and dynamic resizing.',
    1
),
(
    'topic-loops',
    'subj-cs101',
    'Loops',
    'loops',
    'Iteration bounds, off-by-one errors, while loop conditions, nested loop time complexity O(N^2), and termination invariants.',
    2
),
(
    'topic-pointers',
    'subj-cs101',
    'Pointers',
    'pointers',
    'Memory address operators (&), dereferencing (*), pointer arithmetic scale factors, and dangling stack pointers.',
    3
),
(
    'topic-data-structures',
    'subj-cs101',
    'Data Structures',
    'data-structures',
    'Stack LIFO principles, Queue FIFO scheduling, Singly Linked Lists O(1) head insertion vs array shifts.',
    4
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    order_index = EXCLUDED.order_index;

-- 4. SEED VERIFIED QUESTIONS FOR CS101
-- Constraints: exactly 4 options, correct_index 0-3, wrong_reasons jsonb, published status
INSERT INTO public.questions (
    id,
    subject_id,
    topic_id,
    concept,
    question,
    code_snippet,
    options,
    correct_index,
    wrong_reasons,
    explanation,
    difficulty,
    status
) VALUES
-- Question 1: Arrays
(
    'q-cs101-arr-1',
    'subj-cs101',
    'topic-arrays',
    'Contiguous Memory & Random Access',
    'Why does an array provide O(1) constant time random access for any element A[i]?',
    NULL,
    jsonb_build_array(
        'Elements are stored in contiguous memory blocks, allowing direct address arithmetic base + i * size.',
        'The CPU stores all array values in physical registers simultaneously.',
        'Arrays use internal hash tables to avoid collisions and find keys in O(1).',
        'A secondary pointer index table is traversed using binary search in log(n) time.'
    ),
    0,
    jsonb_build_array(
        '',
        'Incorrect: CPU registers have limited capacity (typically 16-32) and cannot hold arbitrary sized arrays.',
        'Incorrect: Standard primitive arrays do not use hash tables or collision buckets.',
        'Incorrect: Traversal with binary search would take O(log N), not constant O(1).'
    ),
    'Because array elements are stored in contiguous memory blocks of uniform size, element address is computed in a single step: Address = BaseAddress + (index * sizeof(Type)). No traversal or search is needed.',
    'easy',
    'published'
),
-- Question 2: Loops
(
    'q-cs101-loop-1',
    'subj-cs101',
    'topic-loops',
    'Off-By-One Boundary Trap',
    'What is the final value of count after the following loop finishes executing?',
    'int count = 0;
for (int i = 0; i <= 5; i++) {
    count++;
}',
    jsonb_build_array(
        '4',
        '5',
        '6',
        'Infinite loop due to loop variable overflow'
    ),
    2,
    jsonb_build_array(
        'Incorrect: The loop does not stop prematurely at 4.',
        'Incorrect: Confusing "< 5" (5 iterations) with "<= 5" (6 iterations).',
        '',
        'Incorrect: The loop condition i <= 5 terminates cleanly when i reaches 6.'
    ),
    'The condition i <= 5 evaluates to true for values 0, 1, 2, 3, 4, and 5 (a total of 6 iterations). Thus, count increments to 6. A classic off-by-one trap is confusing strictly less than (<) with less than or equal (<=).',
    'easy',
    'published'
),
-- Question 3: Pointers
(
    'q-cs101-ptr-1',
    'subj-cs101',
    'topic-pointers',
    'Dereferencing vs Address Operator',
    'What are the final values of variable a and *ptr after executing this code?',
    'int a = 42;
int *ptr = &a;
*ptr = 99;',
    jsonb_build_array(
        'a = 42, *ptr = 99',
        'a = 99, *ptr = 99',
        'a = 42, *ptr = address of a',
        'a = 99, *ptr = null'
    ),
    1,
    jsonb_build_array(
        'Incorrect: Dereferencing *ptr = 99 directly mutates the memory location of variable a.',
        '',
        'Incorrect: *ptr dereferences the memory cell, producing the stored integer value 99, not an address.',
        'Incorrect: ptr was initialized to &a and was never assigned NULL.'
    ),
    'ptr holds the memory address of a. The dereference assignment *ptr = 99 writes directly into the memory allocated for a. Therefore, both a and *ptr evaluate to 99.',
    'easy',
    'published'
),
-- Question 4: Data Structures
(
    'q-cs101-ds-1',
    'subj-cs101',
    'topic-data-structures',
    'Stack LIFO vs Queue FIFO',
    'You push elements 10, 20, 30 onto a Stack, and enqueue elements 10, 20, 30 into a Queue. What is the first element popped from the Stack, and the first element dequeued from the Queue?',
    NULL,
    jsonb_build_array(
        'Stack: 10, Queue: 10',
        'Stack: 30, Queue: 10',
        'Stack: 30, Queue: 30',
        'Stack: 10, Queue: 30'
    ),
    1,
    jsonb_build_array(
        'Incorrect: Stack follows Last-In First-Out, so 30 is popped first, not 10.',
        '',
        'Incorrect: Queue follows First-In First-Out, so the earliest item 10 is removed first, not 30.',
        'Incorrect: Inverted both Stack and Queue access semantics.'
    ),
    'A Stack operates on Last-In-First-Out (LIFO), returning the most recent element (30). A Queue operates on First-In-First-Out (FIFO), returning the oldest element (10).',
    'easy',
    'published'
)
ON CONFLICT (id) DO UPDATE SET
    concept = EXCLUDED.concept,
    question = EXCLUDED.question,
    code_snippet = EXCLUDED.code_snippet,
    options = EXCLUDED.options,
    correct_index = EXCLUDED.correct_index,
    wrong_reasons = EXCLUDED.wrong_reasons,
    explanation = EXCLUDED.explanation,
    difficulty = EXCLUDED.difficulty,
    status = EXCLUDED.status;
