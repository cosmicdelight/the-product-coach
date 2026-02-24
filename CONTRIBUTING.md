# Contributing Guide

## Branch and PR Rules

- Base branch: `main`.
- Use short-lived feature branches for all non-trivial changes.
- Keep PRs focused and scoped to one objective.
- Do not merge if CI is red.

## Local Development Checklist

Before opening a PR, run:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Quality Expectations

- New critical behavior should include at least one test.
- Prefer small, reviewable commits with clear intent.
- Preserve existing behavior unless the change explicitly targets behavior updates.
- Avoid introducing new `any` or silent `catch` blocks.

## Commit Message Guidance

- Use concise, imperative, purpose-first messages.
- Focus on why the change exists, not only what changed.

Example:

```text
Improve invite reliability with centralized error mapping.
```

## CI Expectations

The following checks must pass in CI:

1. TypeScript (`npm run typecheck`)
2. ESLint (`npm run lint`)
3. Tests (`npm test`)
4. Build (`npm run build`)

## Security and Secrets

- Never commit secrets or API keys.
- Never put privileged keys in `VITE_*`.
- Keep browser-side env vars limited to public-safe values.
