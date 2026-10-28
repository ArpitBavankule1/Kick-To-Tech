# RecallLoop AI v2 — Multi-Role Adaptive Learning Platform

> *"Learn what you don't know."*

RecallLoop AI v2 is an adaptive and data-driven learning platform designed for computer science education. It diagnoses individual learner weaknesses from practice attempts, visually maps conceptual mastery, and serves targeted recommendations without algorithmic bias.

---

## 🛠️ Stack & Architecture

- **Frontend:** React 19 + TypeScript (Strict Mode, `verbatimModuleSyntax: true`, zero `any`) + Vite
- **Styling:** Tailwind CSS + Custom Design System (WCAG accessible: icon + text for all states)
- **State & Testing:** React Context, Vitest for pure deterministic logic validation
- **Backend & Database:** Supabase (Auth, Postgres with Row-Level Security, Edge Functions)
- **AI Assist:** Google Gemini (hosted **strictly** in Supabase Edge Function secrets for offline/teacher-assisted quiz generation; untrusted output validation)

---

## 👥 Multi-Role Architecture

| Role | Access & Registration Flow | Key Capabilities |
| :--- | :--- | :--- |
| **Student** | Self-registers via Supabase Auth | Solves daily assigned topics, practices weakest areas via adaptive engine, views derived knowledge map and progress history. |
| **Teacher** | Self-registers; **requires Admin Approval** (`is_approved = true`) | Sets daily topic assignments (1 per subject per day), monitors class weaknesses, generates AI quiz drafts, reviews and publishes questions. |
| **Admin** | **Seeded only**; never publicly self-registered | Approves teacher accounts, manages platform configuration and audit logs. |

---

## 📜 Core Architectural Rules

1. **Deterministic Mastery & Recommendations:** Pure TypeScript functions, 100% test-covered. **No LLM in recommendation logic.**
2. **Derived Metrics Only:** Mastery, status, and learning trends are **derived from the `attempts` table**, never stored in the database.
3. **Status Invariants:**
   - **Zero Attempts:** Displayed as **`❓ Not Assessed`** (accuracy = `null`). *Unassessed topics are never labeled weak.*
   - **$0\%$ with $\ge 1$ Attempts:** Displayed as **`⚠️ Weak`** (accuracy = $0\%$).
   - **Developing:** $50\% \le \text{Accuracy} < 80\%$ (**`📈 Developing`**).
   - **Strong:** $\text{Accuracy} \ge 80\%$ (**`🛡️ Strong`**).
4. **Accessible Status (WCAG 1.4.1):** Never rely on color alone. Status is **always** indicated by an explicit **icon + text label**.
5. **Secrets Hygiene:** Gemini API Key lives **ONLY** in Supabase Edge Function secrets. Never exposed to the client or git.
6. **Row-Level Security (RLS):** Every database table has RLS enabled. Permissions are strictly enforced in Postgres.
7. **Daily Assignment Constraint:** Enforced via database unique constraint `UNIQUE(subject_id, assigned_date)`.
8. **Untrusted AI Output:** Gemini quiz drafts must be schema-validated and explicitly reviewed and published by a teacher.
9. **Platform Nomenclature:** The platform is **"adaptive and data-driven"**. AI is used strictly for offline quiz generation.

---

## 🚀 Setup & Installation

### 1. Prerequisites
- **Node.js:** v18+ or v20+
- **npm:** v9+
- **Supabase CLI:** (optional, for local Edge Functions and migrations)

### 2. Clone & Install
```bash
git clone https://github.com/ArpitBavankule1/Kick-To-Tech.git
cd Kick-To-Tech
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Security Note:** Do not add `GEMINI_API_KEY` to `.env`. Configure it inside Supabase Edge Functions:
> ```bash
> supabase secrets set GEMINI_API_KEY="your-gemini-key"
> ```

### 4. Run Unit Tests
```bash
npm test
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Production Build
```bash
npm run build
```

---

## 🗺️ Implementation Phases

- **Phase 1: Project Governance & Foundation** (Completed)
  - Project rules file (`.agent/rules.md`), `.env.example`, `.gitignore` updates, Tailwind CSS integration, verified test baseline.
- **Phase 2: Database Schema & Row-Level Security** (Upcoming)
  - Postgres tables (`profiles`, `subjects`, `topics`, `assignments`, `questions`, `attempts`), RLS policies, unique constraints, and seed data.
- **Phase 3: Core Pure Logic Refactoring & Mathematical Invariants**
  - Attempts-derived mastery calculations, deterministic tie-breaking, daily assignment integration, and Vitest test suite.
- **Phase 4: Supabase Client, Auth & Role-Based Access Control (RBAC)**
  - Typed Supabase client, auth contexts, student onboarding, pending teacher approval gates, seeded admin auth.
- **Phase 5: Secure Gemini Quiz Generator (Supabase Edge Function)**
  - Schema-validated edge function, draft-to-publish teacher workflow, secret isolation.
- **Phase 6: Multi-Role Dashboard Interfaces & Accessible UI**
  - Student, Teacher, and Admin views with icon + text WCAG compliant indicators.
- **Phase 7: End-to-End Testing & Verification**
  - Full test suite, production build, and deployment check.
