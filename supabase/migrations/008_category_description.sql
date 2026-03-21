-- Add description field to categories for display on homepage and category pages
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description text DEFAULT '';
