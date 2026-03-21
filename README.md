# electricAcasa.ro

E-commerce platform for electrical supplies — switchgear, lighting, circuit protection, cables, smart home, EV charging and HVAC control.

**Live:** [electricacasa.vercel.app](https://electricacasa.vercel.app)

## Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, Supabase (Postgres + Auth + RLS + Storage)
- **Payments**: Stripe (card) + Cash on delivery (ramburs)
- **Email**: Resend (optional)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Deploy**: Vercel

## Features

### Shop
- Product catalog with sidebar filters (category, brand, price, stock, discount)
- Category pages with dedicated filters
- Product detail with specs, datasheets, compatible products
- Search from nav bar
- Shopping cart (localStorage for guests, DB for authenticated users)
- Checkout: cash on delivery + card (Stripe, when configured)
- Package generator — guided form for custom project quotes

### Client account
- Order history with filters
- Order cancellation (ramburs only)
- Address management (shipping + billing)
- Profile editing

### Admin panel
- Dashboard with aggregated stats (single RPC)
- Product management (CRUD, images, datasheets, featured flag)
- Category management (with descriptions, auto-generated slugs)
- Order management (status transitions, detail view)
- Package request management (status, admin notes, attachment download)
- User list with search

## Setup

```bash
# Install dependencies
npm install

# Environment variables
# Copy and fill:
cp .env.local.example .env.local

# Apply Supabase migrations (001-010) via SQL Editor
# See supabase/migrations/ for the full list

# Run dev server
npm run dev
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public URL (e.g. https://electricacasa.vercel.app) |
| `STRIPE_SECRET_KEY` | For card payments | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | For card payments | Stripe webhook signing secret |
| `RESEND_API_KEY` | For emails | Resend API key |
| `EMAIL_FROM` | No | Sender address (default: electricAcasa) |

## Database migrations

Apply in order via Supabase SQL Editor:

| # | File | Description |
|---|------|-------------|
| 001 | `001_initial_schema.sql` | Profiles, auth trigger, RLS |
| 002 | `002_ecommerce_schema.sql` | Categories, products, orders, cart, addresses, package requests |
| 003 | `003_storage_buckets.sql` | Storage: product-images, datasheets, package-attachments |
| 004 | `004_product_relations_admin_select.sql` | Admin select policy for product relations |
| 005 | `005_stock_and_cancel_rpc.sql` | Stock decrement/increment, cart cleanup, order cancel RPCs |
| 006 | `006_cancel_confirmed_rpc.sql` | Cancel confirmed orders RPC |
| 007 | `007_fix_rls_recursion.sql` | Fix RLS recursion with is_admin() SECURITY DEFINER |
| 008 | `008_category_description.sql` | Category description field |
| 009 | `009_product_featured.sql` | Product is_featured flag |
| 010 | `010_dashboard_stats_rpc.sql` | Dashboard aggregated stats RPC |

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run test         # Vitest unit tests
npx playwright test  # E2E tests (requires env vars)
```

## E2E tests

Set these env vars before running Playwright:

```bash
E2E_USER_EMAIL=...
E2E_USER_PASSWORD=...
E2E_ADMIN_EMAIL=...
E2E_ADMIN_PASSWORD=...
npx playwright test
```

Test suites: auth flow, register, checkout ramburs, order cancellation, admin orders, catalog filters.

## Admin bootstrap

1. Register a normal account
2. In Supabase SQL Editor: `UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';`
3. Logout and login again
4. Access `/admin/dashboard`
