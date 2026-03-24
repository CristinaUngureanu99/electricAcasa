-- Add shipping_method to orders (curier = default, easybox = locker delivery)
ALTER TABLE public.orders
  ADD COLUMN shipping_method text NOT NULL DEFAULT 'curier'
  CHECK (shipping_method IN ('curier', 'easybox'));
