import type { Question, TopicConfig } from '../types';

export const TOPIC_CONFIGS: TopicConfig[] = [
  {
    id: 'arrays',
    title: 'Arrays',
    description: 'Contiguous memory, indexing, time complexity, and dynamic array reallocation.',
    iconName: 'LayoutGrid',
  },
  {
    id: 'loops',
    title: 'Loops & Control Flow',
    description: 'Iteration bounds, off-by-one traps, nested complexity, and termination invariants.',
    iconName: 'Repeat',
  },
  {
    id: 'pointers',
    title: 'Pointers & Memory',
    description: 'Memory addresses, dereferencing, pointer arithmetic, and reference passing.',
    iconName: 'Crosshair',
  },
  {
    id: 'data_structures',
    title: 'Basic Data Structures',
    description: 'Stacks (LIFO), Queues (FIFO), Linked Lists, and fundamental access patterns.',
    iconName: 'Layers',
  },
];

export const QUESTIONS: Question[] = [
  // ================= ARRAYS (5 questions) =================
  {
    id: 'arr-1',
    topic: 'arrays',
    topicTitle: 'Arrays',
    difficulty: 'easy',
    concept: 'Contiguous Memory & Random Access',
    question: 'Why does an array provide O(1) constant time random access for any element `A[i]`?',
    options: [
      'Elements are stored contiguously, allowing direct address arithmetic `base + i * size`.',
      'The CPU stores all array values in registers simultaneously.',
      'Arrays use hash collisions avoidance to find items quickly.',
      'A linked index table is searched in log(n) binary steps.'
    ],
    correctAnswer: 0,
    explanation:
      'Because array elements are stored in contiguous memory blocks of equal size, the exact memory address of element i is computed instantly via formula: Address = BaseAddress + (index * sizeof(Type)). No traversal is required.',
  },
  {
    id: 'arr-2',
    topic: 'arrays',
    topicTitle: 'Arrays',
    difficulty: 'medium',
    concept: 'Element Shifting Overhead',
    question: 'What is the worst-case time complexity of inserting an element at index 0 of a static array of size N?',
    options: [
      'O(1) because index 0 is at the base address.',
      'O(N) because all N existing elements must be shifted right by one position.',
      'O(log N) through binary splitting.',
      'O(N^2) due to memory reallocation overhead.'
    ],
    correctAnswer: 1,
    explanation:
      'Inserting at the beginning requires moving element N-1 to N, N-2 to N-1, down to index 0 to 1. This requires N shifting operations, leading to O(N) linear time complexity.',
  },
  {
    id: 'arr-3',
    topic: 'arrays',
    topicTitle: 'Arrays',
    difficulty: 'medium',
    concept: 'Memory Offset Calculation',
    question: 'An integer array starts at memory address 0x2000. If each integer occupies 4 bytes, what is the memory address of `arr[5]` (using 0-based indexing)?',
    options: [
      '0x2010',
      '0x2014',
      '0x2018',
      '0x2020'
    ],
    correctAnswer: 1,
    explanation:
      'Address = Base + (Index * ElementSize) = 0x2000 + (5 * 4 bytes) = 0x2000 + 20 bytes. In hexadecimal, 20 is 0x14, so the target address is 0x2014.',
  },
  {
    id: 'arr-4',
    topic: 'arrays',
    topicTitle: 'Arrays',
    difficulty: 'hard',
    concept: 'Dynamic Array Resizing',
    question: 'When a dynamic array (like std::vector or ArrayList) doubles its internal capacity upon becoming full, what is the amortized time complexity of each append operation?',
    options: [
      'O(N) amortized because each resize copies the entire array.',
      'O(1) amortized because the expensive O(N) copies occur exponentially infrequently.',
      'O(log N) amortized because binary tree indexing is applied.',
      'O(1) worst-case under all circumstances.'
    ],
    correctAnswer: 1,
    explanation:
      'Although copying elements takes O(N) when doubling occurs, doubling happens only after 1, 2, 4, 8, 16... inserts. Averaged across all N insertions, total work is proportional to 2N operations, yielding O(1) amortized cost per append.',
  },
  {
    id: 'arr-5',
    topic: 'arrays',
    topicTitle: 'Arrays',
    difficulty: 'easy',
    concept: 'Array Bounds & Indexing',
    codeSnippet: 'int nums[5] = {10, 20, 30, 40, 50};\nint val = nums[5];',
    question: 'What happens when executing the C code above?',
    options: [
      'It safely returns 0 as a default fallback.',
      'It prints 50 because 5 is the length of the array.',
      'It accesses out-of-bounds memory, invoking Undefined Behavior.',
      'The compiler automatically resizes the array to size 6.'
    ],
    correctAnswer: 2,
    explanation:
      'In a 5-element 0-indexed array, valid indices are 0 through 4. Accessing nums[5] reads memory outside the allocated buffer, causing undefined behavior (potential segmentation fault or data corruption).',
  },

  // ================= LOOPS (5 questions) =================
  {
    id: 'loop-1',
    topic: 'loops',
    topicTitle: 'Loops & Control Flow',
    difficulty: 'easy',
    concept: 'Off-By-One Boundary Trap',
    codeSnippet: 'int count = 0;\nfor (int i = 0; i <= 5; i++) {\n    count++;\n}',
    question: 'What is the final value of `count` after the loop terminates?',
    options: [
      '4',
      '5',
      '6',
      'Infinite loop'
    ],
    correctAnswer: 2,
    explanation:
      'The condition `i <= 5` evaluates to true for i = 0, 1, 2, 3, 4, and 5. That is 6 iterations total, so count increments to 6. A common off-by-one trap is confusing `< 5` (5 times) with `<= 5` (6 times).',
  },
  {
    id: 'loop-2',
    topic: 'loops',
    topicTitle: 'Loops & Control Flow',
    difficulty: 'medium',
    concept: 'Post-Decrement Loop Evaluation',
    codeSnippet: 'int n = 3;\nint sum = 0;\nwhile (n-- > 0) {\n    sum += n;\n}',
    question: 'What is the final value of `sum`?',
    options: [
      '6',
      '3',
      '2',
      '0'
    ],
    correctAnswer: 1,
    explanation:
      'Step-by-step trace:\n1. Initially n=3, sum=0.\n2. Condition (3 > 0) is true -> n decrements to 2 -> sum += 2 (sum is 2).\n3. Condition (2 > 0) is true -> n decrements to 1 -> sum += 1 (sum is 3).\n4. Condition (1 > 0) is true -> n decrements to 0 -> sum += 0 (sum is 3).\n5. Condition (0 > 0) is false -> loop terminates. The final value of sum is 3.',
  },
  {
    id: 'loop-3',
    topic: 'loops',
    topicTitle: 'Loops & Control Flow',
    difficulty: 'medium',
    concept: 'Nested Loop Complexity',
    codeSnippet: 'for (int i = 0; i < N; i++) {\n    for (int j = i; j < N; j++) {\n        // constant-time operation\n    }\n}',
    question: 'How many total iterations does the inner loop body execute for a given positive integer N?',
    options: [
      'N iterations',
      'N * (N + 1) / 2 iterations, giving O(N^2) complexity',
      'N * log(N) iterations',
      '2^N iterations'
    ],
    correctAnswer: 1,
    explanation:
      'When i=0, inner runs N times. When i=1, inner runs N-1 times... When i=N-1, it runs 1 time. The sum of 1 + 2 + ... + N equals N*(N+1)/2 = (N^2 + N)/2, which is O(N^2) asymptotic complexity.',
  },
  {
    id: 'loop-4',
    topic: 'loops',
    topicTitle: 'Loops & Control Flow',
    difficulty: 'easy',
    concept: 'Break vs Continue Semantics',
    codeSnippet: 'int total = 0;\nfor (int i = 1; i <= 5; i++) {\n    if (i % 2 == 0) continue;\n    total += i;\n}',
    question: 'What is the final value of `total`?',
    options: [
      '9 (1 + 3 + 5)',
      '6 (2 + 4)',
      '15 (1 + 2 + 3 + 4 + 5)',
      '1 (breaks immediately)'
    ],
    correctAnswer: 0,
    explanation:
      '`continue` skips the rest of the current iteration when i is even (2 and 4). Only odd values (1, 3, and 5) reach `total += i`. Total = 1 + 3 + 5 = 9.',
  },
  {
    id: 'loop-5',
    topic: 'loops',
    topicTitle: 'Loops & Control Flow',
    difficulty: 'hard',
    concept: 'Loop Invariants & Halting Condition',
    codeSnippet: 'unsigned int x = 5;\nwhile (x >= 0) {\n    if (x == 0) break;\n    x -= 2;\n}',
    question: 'If `if (x == 0) break;` were omitted, why would an unsigned loop `while (x >= 0) { x -= 2; }` with starting x=5 never terminate?',
    options: [
      'Unsigned integers are always >= 0, and 5 - 2 - 2 - 2 underflows to a huge positive number.',
      'The loop condition `x >= 0` causes a syntax error on unsigned types.',
      'Unsigned integers wrap around to negative numbers.',
      'The CPU throws an arithmetic overflow exception immediately.'
    ],
    correctAnswer: 0,
    explanation:
      'Because `x` is unsigned, subtracting 2 when x=1 results in modular underflow (e.g. 1 - 2 = UINT_MAX). Since unsigned values can never be less than 0, `x >= 0` is perpetually true, causing an infinite loop.',
  },

  // ================= POINTERS (5 questions) =================
  {
    id: 'ptr-1',
    topic: 'pointers',
    topicTitle: 'Pointers & Memory',
    difficulty: 'easy',
    concept: 'Dereferencing vs Address Operator',
    codeSnippet: 'int a = 42;\nint *ptr = &a;\n*ptr = 99;',
    question: 'What are the values of `a` and `*ptr` after running this code?',
    options: [
      'a = 42, *ptr = 99',
      'a = 99, *ptr = 99',
      'a = 42, *ptr = &a',
      'a = 99, *ptr = address of a'
    ],
    correctAnswer: 1,
    explanation:
      '`ptr` holds the memory address of `a`. Dereferencing `*ptr = 99` writes 99 directly into the memory location of `a`. Thus, both `a` and `*ptr` evaluate to 99.',
  },
  {
    id: 'ptr-2',
    topic: 'pointers',
    topicTitle: 'Pointers & Memory',
    difficulty: 'medium',
    concept: 'Pointer Arithmetic Scale Factor',
    codeSnippet: 'int arr[4] = {10, 20, 30, 40};\nint *p = arr;\np = p + 2;',
    question: 'If `int` is 4 bytes and `arr` starts at byte address 1000, what is the numerical address in `p`, and what does `*p` evaluate to?',
    options: [
      'Address 1002, *p = 20',
      'Address 1008, *p = 30',
      'Address 1008, *p = 20',
      'Address 1004, *p = 10'
    ],
    correctAnswer: 1,
    explanation:
      'In C/C++, pointer arithmetic scales by `sizeof(*p)`. Adding 2 to an `int*` increases the byte address by `2 * 4 = 8` bytes. Address = 1000 + 8 = 1008, pointing to `arr[2]`, which holds the value 30.',
  },
  {
    id: 'ptr-3',
    topic: 'pointers',
    topicTitle: 'Pointers & Memory',
    difficulty: 'medium',
    concept: 'Pointer Reassignment vs Value Mutation',
    codeSnippet: 'int x = 10, y = 20;\nint *p = &x;\nint *q = &y;\np = q;\n*p = 50;',
    question: 'What are the final values of `x` and `y`?',
    options: [
      'x = 50, y = 20',
      'x = 10, y = 50',
      'x = 50, y = 50',
      'x = 10, y = 20'
    ],
    correctAnswer: 1,
    explanation:
      'First, `p` points to `x`. Then `p = q;` reassigns `p` to point to `y` (address assignment). Finally, `*p = 50;` modifies the value at `y`. `x` remains untouched at 10, while `y` becomes 50.',
  },
  {
    id: 'ptr-4',
    topic: 'pointers',
    topicTitle: 'Pointers & Memory',
    difficulty: 'hard',
    concept: 'Null Pointer & Dangling Pointer Hazards',
    question: 'What is the danger of returning a pointer to a local stack-allocated variable from a function?',
    options: [
      'The memory is automatically promoted to global static memory.',
      'The stack frame is destroyed upon function return, making the returned pointer dangling and pointing to invalid memory.',
      'The compiler automatically allocates heap memory with malloc.',
      'It causes an immediate compile-time syntax rejection in standard C.'
    ],
    correctAnswer: 1,
    explanation:
      'Variables allocated on the stack exist only for the lifetime of their enclosing function call. When the function returns, its stack frame is popped. Any pointer pointing to that local address becomes a dangling pointer; dereferencing it causes undefined behavior.',
  },
  {
    id: 'ptr-5',
    topic: 'pointers',
    topicTitle: 'Pointers & Memory',
    difficulty: 'easy',
    concept: 'Pass By Pointer / Reference',
    codeSnippet: 'void swap(int *a, int *b) {\n    int temp = *a;\n    *a = *b;\n    *b = temp;\n}',
    question: 'Why must `swap` take pointer arguments `int *a, int *b` instead of standard `int a, int b` to swap two variables in the caller scope?',
    options: [
      'Pointers consume less memory than integers in CPU registers.',
      'C passes arguments by value (copying them); pointers allow the function to mutate the original memory locations.',
      'Integers cannot be reassigned once defined in C.',
      'Functions without pointers are automatically executed asynchronously.'
    ],
    correctAnswer: 1,
    explanation:
      'Because C uses call-by-value, passing primitive ints creates isolated local copies inside the function. Passing memory addresses (pointers) allows `swap` to dereference and alter the caller\'s original variables directly.',
  },

  // ================= BASIC DATA STRUCTURES (5 questions) =================
  {
    id: 'ds-1',
    topic: 'data_structures',
    topicTitle: 'Basic Data Structures',
    difficulty: 'easy',
    concept: 'LIFO vs FIFO Principles',
    question: 'You push values 10, 20, 30 onto a Stack, and enqueue values 10, 20, 30 into a Queue. What is the first item popped from the Stack, and the first item dequeued from the Queue?',
    options: [
      'Stack: 10, Queue: 10',
      'Stack: 30, Queue: 10',
      'Stack: 30, Queue: 30',
      'Stack: 10, Queue: 30'
    ],
    correctAnswer: 1,
    explanation:
      'A Stack follows Last-In-First-Out (LIFO), so the last item pushed (30) is popped first. A Queue follows First-In-First-Out (FIFO), so the earliest item enqueued (10) is removed first.',
  },
  {
    id: 'ds-2',
    topic: 'data_structures',
    topicTitle: 'Basic Data Structures',
    difficulty: 'medium',
    concept: 'Head Insertion: Linked List vs Array',
    question: 'Why is inserting a node at the head of a Singly Linked List O(1) time complexity, whereas inserting at index 0 of an Array is O(N)?',
    options: [
      'Linked lists keep nodes contiguously in cache memory.',
      'Inserting at the head of a linked list only requires updating two pointers (newNode->next = head; head = newNode), requiring zero element shifts.',
      'Linked lists use binary trees internally to locate the head.',
      'Arrays require a linear search to find index 0.'
    ],
    correctAnswer: 1,
    explanation:
      'In a linked list, inserting at head involves setting `newNode.next = head` and updating `head = newNode`, which is 2 pointer updates (O(1)). In an array, all N elements must be physically shifted right to create an empty slot at index 0 (O(N)).',
  },
  {
    id: 'ds-3',
    topic: 'data_structures',
    topicTitle: 'Basic Data Structures',
    difficulty: 'medium',
    concept: 'Parentheses Matching Stack Algorithm',
    question: 'When validating matched brackets like "{[()]}", why is a Stack the optimal data structure?',
    options: [
      'Because the most recently opened opening bracket must match the very first closing bracket encountered (LIFO matching).',
      'Because stacks automatically sort elements in ascending alphabetical order.',
      'Because a Queue would process brackets in the exact same order with lower space complexity.',
      'Because stacks permit random index access to find the matching closing bracket in O(1).'
    ],
    correctAnswer: 0,
    explanation:
      'Nested structures obey symmetrical nesting: the innermost opening delimiter opened most recently must be closed first. This exactly mirrors the Last-In-First-Out (LIFO) property of a Stack.',
  },
  {
    id: 'ds-4',
    topic: 'data_structures',
    topicTitle: 'Basic Data Structures',
    difficulty: 'hard',
    concept: 'Queue via Two Stacks Amortization',
    question: 'How can a FIFO Queue be implemented using two LIFO Stacks (Inbox and Outbox) with amortized O(1) dequeue?',
    options: [
      'Pushing to Inbox, and on Dequeue, if Outbox is empty, transfer all Inbox items to Outbox (reversing their order), then pop from Outbox.',
      'Keep one stack for even numbers and one stack for odd numbers.',
      'Store all items in Inbox and pop directly from Inbox using bottom indexing.',
      'Transfer elements back and forth between both stacks on every single push and pop.'
    ],
    correctAnswer: 0,
    explanation:
      'Enqueues push directly to the Inbox stack (O(1)). Dequeue pops from Outbox. If Outbox is empty, all elements from Inbox are popped and pushed into Outbox, reversing the order. Each element moves across the stacks exactly twice in its lifecycle, giving O(1) amortized cost per operation.',
  },
  {
    id: 'ds-5',
    topic: 'data_structures',
    topicTitle: 'Basic Data Structures',
    difficulty: 'easy',
    concept: 'Linked List Traversal Complexity',
    question: 'What is the time complexity to retrieve the k-th element from the beginning of a Singly Linked List of length N?',
    options: [
      'O(1) through pointer indexing',
      'O(log k) using binary search',
      'O(k) because you must follow `next` pointers step-by-step from the head',
      'O(N^2) due to memory fragmentation'
    ],
    correctAnswer: 2,
    explanation:
      'Unlike arrays with contiguous memory, linked list nodes are scattered across the heap. To reach the k-th element, you must traverse k-1 `next` pointers sequentially starting from the head node, taking O(k) linear time.',
  },
];
