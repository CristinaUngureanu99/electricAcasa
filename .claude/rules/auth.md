---
description: Rules for authentication flows
paths:
  - "src/app/(auth)/**"
  - "src/lib/supabase-middleware.ts"
  - "src/middleware.ts"
---

- Use Supabase Auth exclusively — no custom auth logic.
- Auth state is managed via @supabase/ssr middleware (src/lib/supabase-middleware.ts).
- Always handle expired sessions gracefully — redirect to login, don't show errors.
- Password reset and email confirmation flows are handled by Supabase, not custom code.
- Validate form inputs on blur (not just submit) for better UX.
- Never store tokens in localStorage — Supabase SSR handles cookie-based sessions.
- After login/register, redirect to the page the user was trying to reach.
