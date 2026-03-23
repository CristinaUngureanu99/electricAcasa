---
name: verify
description: Run all quality checks (typecheck + lint + tests) to verify the project is healthy
---

Run the following checks sequentially and report results:

1. TypeScript type check: `npm run typecheck`
2. ESLint: `npm run lint`
3. Unit tests: `npm run test`

If any step fails, stop and report the failure with details. If all pass, confirm with a short summary.
