---
name: deploy-check
description: Run all quality checks including a production build before deploying to Vercel
disable-model-invocation: true
---

Run the following checks sequentially and report results after each step:

1. Format check: `npx prettier --check "src/**/*.{ts,tsx,css,json}"`
2. TypeScript type check: `npm run typecheck`
3. ESLint: `npm run lint`
4. Unit tests: `npm run test`
5. Production build: `npm run build`

If any step fails, stop immediately and report the failure with details.
If all pass, confirm the project is ready to deploy.
