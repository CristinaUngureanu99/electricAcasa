---
name: review
description: Self-review all uncommitted changes before suggesting a commit. Catches common issues.
---

Review all uncommitted changes (`git diff` and `git diff --cached`) and check for:

## Must Fix (block commit)
- [ ] No `console.log` or `console.error` left in production code (ok in tests)
- [ ] No hardcoded secrets, API keys, or passwords
- [ ] No `any` types introduced
- [ ] No `dangerouslySetInnerHTML` or raw HTML injection
- [ ] No service role key used in client-side code
- [ ] All imports resolve (no missing modules)
- [ ] No commented-out code blocks (delete or keep, don't comment)
- [ ] TypeScript check passes: `npm run typecheck`
- [ ] ESLint passes: `npm run lint`
- [ ] Tests pass: `npm run test`

## Should Fix (warn)
- [ ] No `|| ` used for price fallback (should be `??`)
- [ ] New functions have proper return types (not inferred as `any`)
- [ ] Error messages are user-friendly in Romanian, not technical English
- [ ] Loading states present for async operations

## Review Summary
Present a table with:
- Files changed and what each change does (1 line per file)
- Issues found (MUST FIX vs SHOULD FIX)
- Suggested commit message

Do NOT commit — only report findings and let the user decide.
