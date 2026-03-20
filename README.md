# Business App Skeleton

A clean, generic starter for building business web applications. Extracted from a production app, stripped of all business logic, ready to customize.

## Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, Supabase (Postgres + Auth + RLS)
- **Email**: Resend (optional)
- **Testing**: Vitest
- **Deploy**: Vercel (or any Node.js host)

## What's included

- Authentication (sign up, login, password reset, email confirmation)
- User dashboard and profile management (name, phone, password, delete account)
- Admin panel with role-based access (admin, user)
- Cookie consent banner
- Privacy and Terms template pages
- Responsive layout with sidebar navigation
- Mobile bottom navigation
- Rate limiting utility
- Email sending utility (via Resend)

## Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd BusinessSiteBase
npm install

# 2. Environment variables
cp .env.local.example .env.local
# Fill in Supabase credentials and site URL

# 3. Supabase migration
# Apply supabase/migrations/001_initial_schema.sql via Supabase Dashboard SQL Editor or CLI

# 4. Run dev server
npm run dev
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `NEXT_PUBLIC_SITE_URL` | Yes | Your production URL |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `EMAIL_FROM` | No | Sender email address |

## What to customize first

1. **`src/config/site.ts`** -- app name, tagline, contact info
2. **`public/logo.png`** -- your logo
3. **`supabase/migrations/`** -- add your business tables
4. **`src/app/globals.css`** -- colors and theme
5. **`src/app/page.tsx`** -- landing page content
6. **Business modules** -- add your pages under `src/app/(client)/` and `src/app/(admin)/admin/`

## Available scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check (tsc --noEmit)
npm run test         # Vitest
```

## User roles

| Role | Access |
|---|---|
| `user` | Dashboard, profile |
| `admin` | Full admin panel + user management |

## When to use this skeleton

**Use it if** your project needs: user accounts, login/register, admin panel, dashboard, profile management, role-based access. Most business apps, SaaS tools, booking platforms, management systems.

**Don't use it if** you're building: a static landing page, a blog, a marketing site without user accounts, or something that doesn't need auth/admin.

## Bootstrap a new project

```bash
# Quick setup — updates site.ts, package.json, and manifest
npm run bootstrap
```

The script will ask for your app name, URL, and contact email, then update all config files automatically.
