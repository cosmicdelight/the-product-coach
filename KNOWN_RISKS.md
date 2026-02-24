# Known Risks Register

Last updated: 2026-02-24

## Risk 1: Frontend AI key path still present

- **Area:** `src/services/aiService.ts`
- **Severity:** High
- **Why it matters:** `VITE_OPENAI_API_KEY` usage in frontend can expose key material if configured.
- **Current status:** Fallback behavior exists, but secure backend proxy migration is not fully complete.
- **Owner:** Product + Engineering
- **Target date:** 2026-03-06
- **Mitigation plan:** Move all OpenAI calls to backend/edge function and remove client key dependency.

## Risk 2: Hook dependency lint warnings remain

- **Area:** Wizard step components and related context files
- **Severity:** Medium
- **Why it matters:** Missing hook dependencies can cause stale state or drift under future refactors.
- **Current status:** 16 lint warnings remain (no lint errors).
- **Owner:** Frontend Engineering
- **Target date:** 2026-03-03
- **Mitigation plan:** Resolve warnings incrementally by stabilizing callbacks and dependency arrays.

## Risk 3: Build output has large chunk warning

- **Area:** Production bundle
- **Severity:** Medium
- **Why it matters:** Large JS chunk can impact initial page load and runtime performance.
- **Current status:** Build passes with chunk-size warning (>500 KB minified).
- **Owner:** Frontend Engineering
- **Target date:** 2026-03-10
- **Mitigation plan:** Introduce route/component code-splitting and tune bundler chunk strategy.

## Risk 4: Test coverage is still baseline-level

- **Area:** Automated testing
- **Severity:** Medium
- **Why it matters:** Limited coverage may miss regressions in auth/collaboration/review flows.
- **Current status:** CI test gate exists, with initial service-level tests only.
- **Owner:** Engineering
- **Target date:** 2026-03-07
- **Mitigation plan:** Add tests for route protection, proposal save flow, collaborator join/invite, and review transitions.
