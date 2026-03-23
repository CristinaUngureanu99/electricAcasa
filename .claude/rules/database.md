---
description: Rules for database migrations and Supabase schema
paths:
  - "supabase/migrations/**"
  - "src/types/database.ts"
---

- NEVER edit or rename existing migration files. Always create a new file with the next number (e.g., 011_description.sql).
- Migration file naming: `NNN_short_description.sql` (e.g., 010_dashboard_stats_rpc.sql).
- Every new table MUST have RLS enabled and at least one policy.
- Use SECURITY DEFINER functions for admin checks (see 007_fix_rls_recursion.sql pattern).
- Add NOT NULL constraints by default. Only allow NULL when there's a clear reason.
- Always add foreign key constraints with appropriate ON DELETE behavior (CASCADE, SET NULL, or RESTRICT).
- When adding columns, provide a DEFAULT value if NOT NULL to avoid breaking existing rows.
- After creating a migration, update src/types/database.ts to match the new schema.
- Test migrations against the live Supabase project before considering them done.
- RPCs (database functions) go in migration files, not in application code.
- Document what each migration does with a SQL comment at the top of the file.
