# RecallLoop AI — Adaptive Learning Assistant

> **A deterministic adaptive learning web application that diagnoses conceptual gaps from quiz answers and recommends targeted computer science practice.**

---

## 🎯 The Problem

Students frequently complete quizzes and receive aggregate numerical scores (e.g., *70%* or *14/20*), but they are left with little to no insight into **which specific concept to revise next**. Traditional quiz systems:
1. Treat all mistakes uniformly without pinpointing underlying sub-concepts.
2. Provide random or sequential questions rather than adapting to individual weaknesses.
3. Lack explanatory transparency, leaving learners unaware of *why* a particular practice topic was recommended.

---

## 💡 The Solution

**RecallLoop AI** closes the learning loop. As students answer multiple-choice questions across foundational computer science concepts, the app dynamically:
- **Computes topic-level mastery** based strictly on recorded answers.
- **Renders an interactive Knowledge Map** categorizing topics as **Strong**, **Developing**, **Weak**, or **Not Yet Assessed** (*unassessed topics are never labeled weak*).
- **Runs a deterministic Recommendation Engine** that picks the next question from the student's weakest assessed topic with remaining questions.
- **Provides grounded explanations** for every recommendation based directly on the student's answer history and failed concepts.
- **Shows immediate feedback and mastery updates** after each answer, updating confidence and metrics in real-time.
- **Stores progress locally** using browser `localStorage` without requiring external backends, credentials, or API keys.

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (strict mode, `verbatimModuleSyntax`)
- **Styling:** Vanilla CSS (Modern design system, glassmorphism, responsive container queries, tailored dark palette)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State & Persistence:** React Hooks (`useMemo`, `useState`) + `localStorage`
- **Unit Testing:** [Vitest](https://vitest.dev/)

---

## ✨ Features

### 1. Polished, Responsive Student Dashboard
- Real-time KPI metric cards:
  - **Overall Accuracy (%)** & total correct/attempt ratio.
  - **Questions Solved** out of 20 total questions.
  - **Knowledge Domains Assessed** (X of 4).
  - **Priority Focus Areas** (Alert badge when weak topics are detected).
  - **Mastered Domains** (Topics with $\ge 80\%$ accuracy).

### 2. 20 Verified Computer Science Questions
Covers four core foundational domains with code snippets and detailed technical rationales:
- **Arrays:** Contiguous memory indexing, element shifting insertion costs, memory offset calculations, dynamic array amortized capacity doubling, and out-of-bounds undefined behavior.
- **Loops & Control Flow:** Off-by-one boundary traps (`<` vs `<=`), post-decrement while loop tracing, nested loop time complexity ($O(N^2)$), `break` vs `continue` semantics, and unsigned integer underflow invariants.
- **Pointers & Memory:** Dereferencing vs address-of operators, pointer arithmetic scale factors (`sizeof(*ptr)`), pointer reassignment vs value modification, dangling pointer hazards, and pass-by-pointer mechanics.
- **Basic Data Structures:** Stack LIFO vs Queue FIFO principles, head insertion in linked lists vs arrays ($O(1)$ vs $O(N)$), parentheses matching via stack, FIFO queue simulation using two stacks, and singly linked list traversal costs.

### 3. Pure Topic-Wise Mastery Engine
Mastery is computed using pure, deterministic functions (`src/utils/mastery.ts`):
- **Not Yet Assessed:** Zero attempts recorded. Accuracy is `null`. *Strict invariant: Unassessed topics are never classified as weak.*
- **Weak:** Accuracy $< 50\%$ with $\ge 1$ attempt.
- **Developing:** Accuracy between $50\%$ and $79\%$.
- **Strong:** Accuracy $\ge 80\%$.

### 4. Interactive Knowledge Map
- Visual cards for each of the 4 domains.
- Colored status badges (*Strong: Green*, *Developing: Amber*, *Weak: Rose*, *Not Yet Assessed: Slate*).
- Animated progress bar indicating exact mastery percentage.
- List of specific sub-concepts failed during practice (e.g. *"Memory Offset Calculation"*, *"Pointer Arithmetic"*).
- Direct "Practice Topic" action button.

### 5. Deterministic Recommendation Engine
A pure recommendation algorithm (`src/utils/recommender.ts`):
1. **Weak Assessed Topics:** Evaluates assessed topics marked `weak` that have available (unmastered) questions.
   - *Tie-Breaking Rules:* Lowest accuracy percentage $\rightarrow$ Highest incorrect count $\rightarrow$ Highest total attempts $\rightarrow$ Canonical order (`arrays` $\rightarrow$ `loops` $\rightarrow$ `pointers` $\rightarrow$ `data_structures`).
2. **Developing Assessed Topics:** If no weak topics have available questions, evaluates `developing` topics with the same deterministic tie-breaker.
3. **Unassessed Topics:** If all assessed topics are addressed or strong, initiates a diagnostic baseline on the first unassessed topic.
4. **Spaced Reinforcement:** If all domains are strong, serves questions from strong topics to retain memory.
5. **Question Prioritization:** Prioritizes unattempted questions before retries, sorted by difficulty (`easy` $\rightarrow$ `medium` $\rightarrow$ `hard`), then by question ID.

### 6. Grounded Recommendation Explanations
Every recommendation includes a diagnostic explanation citing the student's actual history:
> *"Targeting Weakest Assessed Area: In Pointers & Memory, you scored 1 of 3 (33% accuracy, 2 incorrect). Recent recorded difficulty with: 'Pointer Arithmetic', 'Dangling Pointer Hazards'. Practicing 'Dereferencing vs Address Operator' will remediate this gap."*

### 7. Immediate Feedback & Live Mastery Updates
- Option highlights: Correct answers glow green; incorrect selections highlight red.
- Detailed technical explanation breaking down why the correct option is right and the underlying CS principle.
- **Live Mastery Delta Tag:** Shows previous accuracy vs updated accuracy immediately (e.g. `Pointers Mastery: 33% ➔ 50% (DEVELOPING)`).

### 8. Persistence, Sensible Empty States & Safe Reset
- Seamless synchronization with `localStorage`.
- Sensible zero-state guiding new users to their baseline diagnostic.
- 100% completion celebration card when all curriculum questions are mastered.
- "Reset Progress" with an accessible modal dialog preventing accidental data loss.

---

## 🧪 Unit Tests

RecallLoop AI includes unit tests for mastery calculations, edge cases, tie-breaking, and unassessed status guarantees using Vitest.

### Test Coverage Highlights:
- **`src/utils/mastery.test.ts`:**
  - ✅ Invariant test: Unassessed topics must **never** be labeled weak.
  - ✅ Accurate status categorization at boundaries ($49\% \rightarrow \text{weak}$, $50\% \rightarrow \text{developing}$, $80\% \rightarrow \text{strong}$).
  - ✅ Aggregation logic (assessed vs unassessed counts, overall accuracy).
  - ✅ Failed concept extraction.
- **`src/utils/recommender.test.ts`:**
  - ✅ Selects the weakest assessed topic with available questions.
  - ✅ Deterministic tie-breaking on equal accuracy by error count.
  - ✅ Deterministic tie-breaking on equal errors by canonical topic order (no randomness).
  - ✅ Handles exhausted topics where all questions are completed.
  - ✅ Unassessed topic diagnostic baseline initialization.
  - ✅ Difficulty-based question picking (`easy` before `medium` before `hard`).

### Running the Tests:
```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

**Verification Output:**
```text
 ✓ src/utils/mastery.test.ts (5 tests)
 ✓ src/utils/recommender.test.ts (6 tests)

 Test Files  2 passed (2)
      Tests  11 passed (11)
```

---

## 🚀 Setup & Execution Instructions

### Prerequisites
- Node.js (version 18+ or 20+ recommended)
- npm (version 9+)

### Installation
```bash
# 1. Clone repository
git clone https://github.com/ArpitBavankule1/Kick-To-Tech.git
cd Kick-To-Tech

# 2. Install dependencies
npm install

# 3. Run unit tests
npm test

# 4. Start local development server
npm run dev

# 5. Open application
# Navigate to: http://localhost:5173/
```

### Production Build
```bash
# Compile TypeScript and bundle Vite production assets
npm run build

# Preview production build locally
npm run preview
```

---

## 📋 Limitations

1. **Static Question Pool:** The MVP contains 20 curated questions (5 per domain). In a production system, this could connect to an expanded item bank or dynamic problem generator.
2. **Local Client Storage:** Progress is stored in browser `localStorage`. Switching browsers or devices does not sync progress unless exported or linked to a backend user account.
3. **Question Formats:** Currently limited to four-option multiple choice with code tracing. Future versions can incorporate interactive code execution, fill-in-the-blank, or Parsons puzzles.

---

## 🤖 AI Tools Used

- **Pair-Programming & Architecture:** Antigravity / Gemini 3.8 Flash for modular system design, TypeScript type contracts, deterministic recommendation algorithm formulation, and verified CS question curation.
- **Aesthetic Direction:** Modern Slate/Glassmorphism design system inspired by contemporary developer tools.
