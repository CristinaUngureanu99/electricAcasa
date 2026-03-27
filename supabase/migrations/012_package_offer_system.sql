-- Package offer system: offer items table, new columns on package_requests, orders, order_items
-- Allows admins to create personalized offers for package requests

-- New columns on package_requests
ALTER TABLE public.package_requests
  ADD COLUMN offer_total numeric(10,2),
  ADD COLUMN offer_status text CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'closed')),
  ADD COLUMN offer_created_at timestamptz,
  ADD COLUMN offer_notes text;

-- New column on orders to link to package request
ALTER TABLE public.orders
  ADD COLUMN package_request_id uuid REFERENCES public.package_requests(id) ON DELETE SET NULL;

-- Package offer items table
CREATE TABLE public.package_offer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.package_requests(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  created_at timestamptz DEFAULT now()
);

-- RLS for package_offer_items
ALTER TABLE public.package_offer_items ENABLE ROW LEVEL SECURITY;

-- Users can read their own offer items (via package_requests.user_id)
CREATE POLICY "Users can view own offer items"
  ON public.package_offer_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.package_requests pr
      WHERE pr.id = request_id AND pr.user_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins full access to offer items"
  ON public.package_offer_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
