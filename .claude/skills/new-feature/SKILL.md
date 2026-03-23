---
name: new-feature
description: Quality checklist to run after implementing a new feature. Ensures nothing is missed.
---

After the feature is implemented, go through this checklist and fix anything that's missing:

## Types
- [ ] All new data has TypeScript types in src/types/database.ts (if DB-related) or inline
- [ ] No `any` types — use proper types or `unknown` if truly unknown

## Loading & Error States
- [ ] Pages/components show Skeleton while loading (use src/components/ui/Skeleton.tsx)
- [ ] API failures show a user-friendly error message, not technical details
- [ ] Empty states handled (no data = helpful message, not blank screen)

## Data Safety
- [ ] Price calculations use `sale_price ?? price`, never `||`
- [ ] Null/undefined values handled with proper fallbacks
- [ ] User input validated at API boundaries

## Security
- [ ] API routes check authentication where required
- [ ] Admin routes verify admin role
- [ ] No service role key used in client-side code
- [ ] RLS policies cover the new data (if DB changes were made)

## UI/UX
- [ ] Responsive on mobile (test at 375px width)
- [ ] Follows design direction: off-white background, blue accents, airy layout
- [ ] Buttons have loading state during async operations
- [ ] Destructive actions require confirmation

## Tests
- [ ] At least one unit test for new utility functions
- [ ] Existing tests still pass (`npm run test`)
- [ ] Type check passes (`npm run typecheck`)

## Links & Navigation
- [ ] No links to pages that don't exist yet
- [ ] Breadcrumbs updated if new page was added
- [ ] Back navigation works correctly

Report which items pass and which need fixing. Fix what you can, flag what needs user input.
