# Product Coach

AI-powered proposal coach for public officers.

This app helps teams draft, review, and collaborate on structured innovation proposals.

**Disclaimer:** The concept was developed as part of a group project for the Practice Module for Designing and Managing Products and Platforms at NUS-ISS. This prototype was built after the module and is not an official product of the Singapore government.

**Built with Vite + React + TypeScript** · [Live demo](https://productcoach.bolt.host/) · [GitHub](https://github.com/cosmicdelight/the-product-coach)

---

## What it does

- **Draft structured proposals** — guided wizard for building innovation proposals end-to-end.
- **AI Innovation Coach (conversational side panel)** — persistent chat panel docked to the proposal workflow for real-time, section-specific guidance (in the proposal wizard on larger screens).
- **Section-level “Get Feedback”** — trigger targeted feedback on any section/field and iterate in-chat with clarifying follow-ups.
- **Snapshot cards + audit trail** — timestamped draft excerpts and structured feedback captured in a persistent chat history.
- **Prompt chips + usefulness ratings** — quick prompts (e.g. “Suggest improvements”) and a simple helpful/not helpful rating to improve relevance over time.
- **Collaboration + review workflow** — invite collaborators and manage review/comments and revision loops.

---

## Tech stack


| Layer    | Stack                                                                            |
| -------- | -------------------------------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, React Router                                         |
| UI       | Tailwind CSS, Lucide icons                                                       |
| Backend  | Supabase (Auth, Postgres, Edge Functions) or Bolt Database (Supabase-compatible) |
| AI       | Edge Function proxy (`supabase/functions/ai-proxy`)                              |
| Tests    | Vitest                                                                           |


---

## Live demo

**[productcoach.bolt.host](https://productcoach.bolt.host/)**

---

## Demo account

Try the app without signing up:

- **Email:** `demo@productcoach.example`
- **Password:** `Demo123!`

The demo account is read-only — you can view sample proposals but not create or edit.

**Bolt Database:** See [docs/BOLT_DEMO_SETUP.md](docs/BOLT_DEMO_SETUP.md) for setup steps (create demo user in Bolt Auth, run migration, run seed).

---

## Getting started

1. **Clone the repo**

```bash
git clone https://github.com/cosmicdelight/the-product-coach.git
cd the-product-coach
```

1. **Set up environment variables**

Create a `.env` file in the repository root:

```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

- **Bolt Database**: these env vars are typically set automatically by Bolt hosting; for local dev, copy your Bolt project's URL and anon key from the Database settings.
- **Supabase**: use your project's URL + anon key from Supabase project settings.

1. **Install and run**

```bash
npm install
npm run dev
```

1. **(Optional) Configure edge function secrets**

AI requests are intended to go through the `ai-proxy` edge function in `supabase/functions/ai-proxy`. Store `OPENAI_API_KEY` (and any other privileged credentials) as server-side secrets where the edge function runs.

---

## Project structure

- `src/pages` — Top-level route pages
- `src/components` — UI components (including wizard and collaborator panels)
- `src/contexts` — Shared app state (`AuthContext`, `ProposalWizardContext`)
- `src/services` — Domain services (AI logic, error handling utilities)
- `src/lib` — Client setup utilities (for example Supabase client wiring)
- `supabase/migrations` — Database migrations
- `supabase/seeds` — Seeds (including Bolt demo seed)

---

## Scripts

- `npm run dev` — Start local dev server
- `npm run typecheck` — Run TypeScript checks (no emit)
- `npm run lint` — Run ESLint
- `npm test` — Run unit tests once via Vitest (uses placeholder env vars)
- `npm run test:watch` — Run Vitest in watch mode (uses placeholder env vars)
- `npm run build` — Build production bundle
- `npm run preview` — Serve production build locally

---

## Environment and security rules

- Never place secrets in `VITE_`* variables.
- `VITE_*` variables are bundled client-side and are public at runtime.
- Only use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in frontend.
- Any AI or privileged API keys must be handled server-side.

---

## CI quality gate

The repository enforces a CI workflow on push/PR to `main`:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `npm run build`

---

## Troubleshooting

- **Missing env vars**: ensure `.env` exists and `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set.
- **Auth/profile issues**: confirm database tables and RLS policies are configured as expected (Bolt Database or Supabase).
- **Lint warnings**: current known warnings are tracked in `KNOWN_RISKS.md`.
- **Build chunk warning**: bundle-size warning exists; use code-splitting when optimizing performance.

---

## Handoff docs

- Contribution expectations: `CONTRIBUTING.md`
- Known risks with owners and dates: `KNOWN_RISKS.md`

