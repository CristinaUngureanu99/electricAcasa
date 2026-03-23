---
description: Rules for email templates and notifications
paths:
  - "src/lib/email-templates.ts"
  - "src/lib/email.ts"
  - "src/app/api/notifications/**"
---

- All emails use the shared `layout()` wrapper in email-templates.ts — never write standalone HTML.
- Email content is in Romanian.
- Use `escapeHtml()` on any user-provided data before inserting into templates.
- Use `formatPrice()` for displaying prices in emails.
- Site branding (name, team, contact) comes from `src/config/site.ts` — never hardcode.
- Style: inline CSS only (email clients don't support stylesheets). Follow the existing blue gradient header + white body pattern.
- Each template function returns `{ subject: string; html: string }`.
- Emails are sent via Resend (src/lib/email.ts) — never call the Resend API directly from routes.
