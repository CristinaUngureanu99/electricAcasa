---
description: Rules for admin panel code
paths:
  - "src/app/(admin)/**"
  - "src/components/ui/admin/**"
---

- All admin pages require authenticated admin user — verify with is_admin().
- Use the service role Supabase client only in API routes, never in client components.
- Admin components use DataTable (src/components/ui/DataTable.tsx) for lists.
- Always show confirmation modal (ConfirmModal) before destructive actions (delete, cancel).
