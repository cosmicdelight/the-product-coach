# Product Coach

AI-powered proposal coach for public officers.

This app helps teams draft, review, and collaborate on structured innovation proposals.

## Quick Start

### 1) Clone and install

```sh
git clone https://github.com/cosmicdelight/the-product-coach.git
cd the-product-coach
npm install
```

### 2) Configure environment

Create a `.env` file in the repository root:

```sh
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### 3) Run locally

```sh
npm run dev
```

Open the URL shown in terminal (typically `http://localhost:5173`).

## Available Scripts

- `npm run dev` - Start local dev server.
- `npm run typecheck` - Run TypeScript checks (no emit).
- `npm run lint` - Run ESLint.
- `npm test` - Run unit tests once via Vitest.
- `npm run test:watch` - Run Vitest in watch mode.
- `npm run build` - Build production bundle.
- `npm run preview` - Serve production build locally.

## Environment and Security Rules

- Never place secrets in `VITE_*` variables.
- `VITE_*` variables are bundled client-side and are public at runtime.
- Only use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in frontend.
- Any AI or privileged API keys must be handled server-side.

## CI Quality Gate

The repository enforces a CI workflow on push/PR to `main`:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `npm run build`

## Architecture Overview

- `src/pages` - Top-level route pages.
- `src/components` - UI components (including wizard and collaborator panels).
- `src/contexts` - Shared app state (`AuthContext`, `ProposalWizardContext`).
- `src/services` - Domain services (AI logic, error handling utilities).
- `src/lib` - Client setup utilities (for example Supabase client wiring).
- `.github/workflows/ci.yml` - CI checks and merge gate pipeline.

## Troubleshooting

- Missing env vars:
  - Ensure `.env` exists and `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set.
- Auth/profile issues:
  - Confirm Supabase tables and RLS policies are configured as expected.
- Lint warnings:
  - Current known warnings are tracked in `KNOWN_RISKS.md`.
- Build chunk warning:
  - Bundle-size warning exists; use code-splitting when optimizing performance.

## Handoff Docs

- Contribution expectations: `CONTRIBUTING.md`
- Known risks with owners and dates: `KNOWN_RISKS.md`
