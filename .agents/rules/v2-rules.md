# RecallLoop AI v2 — Architectural & Engineering Rules

**Tagline:** *"Learn what you don't know."*

---

## 1. Roles & Permissions Architecture
- **Roles:** `student`, `teacher`, `admin`.
- **Admin Role:** Seeded in the database migration/seeds. **Never** self-registered via public auth.
- **Teacher Role:** Requires explicit admin approval (`is_approved = true`) before accessing teacher tooling or publishing content.
- **Student Role:** Self-registers; default active role.

---

## 2. Core Mastery & Recommendation Rules
1. **Pure Deterministic TypeScript:** All mastery, scoring, and recommendation algorithms must be pure functions with 100% deterministic outputs. Tested with Vitest.
2. **No LLM in Recommendations:** Recommendations are purely mathematical and adaptive based on weakness, error counts, and daily assignments. Never delegate recommendation logic to an LLM.
3. **Derived Metrics Only:** Mastery percentages, status classifications, and learning trends are **DERIVED** on the fly from the `attempts` table. They are **never stored** in the database.
4. **Status Invariants:**
   - **Zero Attempts:** Stored as `null` accuracy $\rightarrow$ Displayed as **"Not Assessed"**.
   - **0% Accuracy ($\ge 1$ Attempts):** Stored as $0\%$ accuracy $\rightarrow$ Displayed as **"Weak"**.
   - **Developing:** $50\% \le \text{Accuracy} < 80\%$.
   - **Strong:** $\text{Accuracy} \ge 80\%$.
5. **Accessibility Invariant (WCAG 1.4.1):** Never rely on color alone. Status must always be rendered with **both an explicit icon AND text label** (e.g., `⚠️ Weak`, `📈 Developing`, `🛡️ Strong`, `❓ Not Assessed`).

---

## 3. Database & Security Rules
6. **Row-Level Security (RLS):** Every table in Postgres must have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`). All access permissions are strictly enforced at the database level.
7. **One Assigned Topic per Subject per Day:** Enforce a database unique constraint:
   `UNIQUE(subject_id, assigned_date)`.
8. **Secrets Management:** The Gemini API key lives **ONLY** in Supabase Edge Function secrets (`Deno.env.get('GEMINI_API_KEY')`). It must never be exposed to the client bundle, `.env` client files, or committed to git.

---

## 4. AI & Content Generation Rules
9. **Untrusted AI Output:** All Gemini output is untrusted. Edge Functions must validate JSON schema, option lengths, and answer key ranges before inserting into the database.
10. **Teacher Publication Gate:** Generated questions are saved with status `draft`. A human teacher must review and publish (`status = 'published'`) before any question can be assigned to students.
11. **Terminology Standard:** Always describe the core platform as **"adaptive and data-driven"**. AI is used strictly for offline/assisted quiz generation.

---

## 5. Code Quality & Workflow Rules
- **TypeScript Strictness:** Strict mode enabled, `verbatimModuleSyntax: true`, zero `any` types throughout the codebase.
- **Phased Execution:** Implement one phase at a time. Show a plan first. After each phase run tests and builds, summarize progress, and await explicit user approval.
