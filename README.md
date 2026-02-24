# Product Coach

AI-powered proposal coach for Singapore public officers.

## Quick Start

1. Clone and install:

```sh
git clone https://github.com/cosmicdelight/the-product-coach.git
cd the-product-coach
npm install
```

2. Create `.env`:

```sh
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

3. Run:

```sh
npm run dev
```

## Security Rule (Day 1)

- Never place secrets in `VITE_*` variables.
- `VITE_*` variables are public in browser bundles.
- AI/API secrets must be server-side only.

## Day 1 Remediation Checklist

- [ ] Remove frontend usage of `VITE_OPENAI_API_KEY`.
- [ ] Move AI calls to backend/edge function.
- [ ] Rotate potentially exposed OpenAI keys.
- [ ] Enforce CI checks for `lint`, `typecheck`, and `build`.

## Verify Day 1 Completion

```sh
npm run lint
npm run typecheck
npm run build
```
