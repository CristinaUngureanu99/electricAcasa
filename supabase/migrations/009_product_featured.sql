-- Add is_featured flag for editorial product recommendations on homepage
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;
