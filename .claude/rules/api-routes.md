---
description: Rules for API route handlers
paths:
  - "src/app/api/**"
---

- Every API route must check authentication (except public endpoints like newsletter signup).
- Admin API routes must verify the user has admin role via is_admin().
- Always validate and sanitize request body input.
- Use Supabase anon client for public data, service role only for admin operations.
- Apply rate limiting (src/lib/rate-limit.ts) on public-facing endpoints.
- Never expose internal error details in responses — log server-side, return generic message.
- Return proper HTTP status codes (400 for bad input, 401 for unauthenticated, 403 for unauthorized, 404 for not found).
