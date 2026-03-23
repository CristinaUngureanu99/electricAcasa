# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

E-commerce site for electrical products (electricAcasa.ro). Next.js 16 App Router, TypeScript, Tailwind CSS v4, Supabase (Postgres + Auth + Storage), Stripe payments, Resend email, deployed on Vercel.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run typecheck` — TypeScript check (`tsc --noEmit`)
- `npm run lint` — ESLint
- `npm run test` — Vitest (unit tests, jsdom)
- `npm run test:e2e` — Playwright (requires E2E_USER_EMAIL, E2E_USER_PASSWORD, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD env vars)
- `npm run format` — Prettier (format all source files)

## Architecture

- **Route groups**: `(shop)` public catalog, `(auth)` login/register, `(client)` account area, `(admin)` admin panel
- **Path alias**: `@/` maps to `src/`
- **Site config**: `src/config/site.ts` — site name, URL, contact info, shipping costs
- **Database types**: `src/types/database.ts`
- **Supabase clients**: `src/lib/supabase.ts` (browser), `src/lib/supabase-server.ts` (server)
- **Tailwind CSS v4**: CSS-first config in `src/app/globals.css`, no tailwind.config.js
- **ESLint**: flat config in `eslint.config.mjs` (with eslint-config-prettier)
- **Prettier**: config in `.prettierrc`. Auto-runs on every edit via hook.

## Key Rules

- **Plan first**: always propose a plan before implementing changes that touch multiple files.
- **Supabase clients**: public pages use the anon client + RLS policies. Only admin API routes may use the service role key.
- **Migrations**: never edit committed migration files in `supabase/migrations/`. Always create a new migration file.
- **Price fallback**: use `sale_price ?? price` (nullish coalescing), never `||`.
- **No dead links**: never link to pages that don't exist yet. Use existing fallbacks or hide the link.
- **Commits**: direct to main branch. Always ask before committing or pushing.
