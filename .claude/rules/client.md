---
description: Rules for client account portal
paths:
  - "src/app/(client)/**"
  - "src/components/ui/client/**"
---

- All client pages require an authenticated user — redirect to login if not authenticated.
- Use the anon Supabase client — RLS ensures users only see their own data.
- Never use the service role key in client-facing code.
- Order cancellation: only allowed for orders in "pending" or "confirmed" status.
- Address management: validate Romanian postal codes (6 digits) and phone numbers.
- Show Skeleton loading states while fetching user data.
- Use order-helpers.ts (src/lib/order-helpers.ts) for consistent order status labels and colors.
