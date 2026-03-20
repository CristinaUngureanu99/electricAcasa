-- electricAcasa.ro — MVP e-commerce schema
-- Depends on: 001_initial_schema.sql (profiles table)

-- =============================================================================
-- HELPER: auto-update updated_at trigger function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- CATEGORIES
-- =============================================================================

CREATE TABLE public.categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  parent_id  uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url  text,
  sort_order integer DEFAULT 0,
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT categories_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- Public: anyone can see active categories
CREATE POLICY "Public can view active categories" ON public.categories
  FOR SELECT USING (is_active = true);

-- Admin: can see all categories (including inactive)
CREATE POLICY "Admins can view all categories" ON public.categories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert categories" ON public.categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update categories" ON public.categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete categories" ON public.categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- PRODUCTS
-- =============================================================================

CREATE TABLE public.products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text DEFAULT '',
  sku           text UNIQUE,
  brand_name    text DEFAULT '',
  price         numeric(10,2) NOT NULL CHECK (price >= 0),
  sale_price    numeric(10,2) CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price <= price)),
  category_id   uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  stock         integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  images        jsonb DEFAULT '[]'::jsonb,
  specs         jsonb DEFAULT '[]'::jsonb,
  datasheet_url text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_is_active ON public.products(is_active);

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public: anyone can see active products
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = true);

-- Admin: can see all products (including inactive)
CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- PRODUCT RELATIONS
-- =============================================================================

CREATE TABLE public.product_relations (
  product_id         uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  related_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type               text NOT NULL DEFAULT 'compatible',
  PRIMARY KEY (product_id, related_product_id),
  CONSTRAINT product_relations_no_self CHECK (product_id <> related_product_id)
);

ALTER TABLE public.product_relations ENABLE ROW LEVEL SECURITY;

-- Public: only show relations where both products are active
CREATE POLICY "Public can view active product relations" ON public.product_relations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND is_active = true)
    AND EXISTS (SELECT 1 FROM public.products WHERE id = related_product_id AND is_active = true)
  );

CREATE POLICY "Admins can insert product relations" ON public.product_relations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update product relations" ON public.product_relations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete product relations" ON public.product_relations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- ADDRESSES
-- =============================================================================

CREATE TABLE public.addresses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('shipping', 'billing')),
  name        text NOT NULL,
  street      text NOT NULL,
  city        text NOT NULL,
  county      text NOT NULL,
  postal_code text NOT NULL,
  phone       text NOT NULL,
  is_default  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Max one default shipping address per user
CREATE UNIQUE INDEX idx_addresses_default_shipping
  ON public.addresses(user_id) WHERE type = 'shipping' AND is_default = true;

-- Max one default billing address per user
CREATE UNIQUE INDEX idx_addresses_default_billing
  ON public.addresses(user_id) WHERE type = 'billing' AND is_default = true;

CREATE POLICY "Users can view own addresses" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- ORDERS
-- =============================================================================

CREATE TABLE public.orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number      bigint GENERATED BY DEFAULT AS IDENTITY UNIQUE,
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  subtotal          numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost     numeric(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total             numeric(10,2) NOT NULL CHECK (total >= 0),
  CONSTRAINT orders_total_integrity CHECK (total = subtotal + shipping_cost),
  shipping_address  jsonb NOT NULL,
  billing_address   jsonb,
  payment_method    text NOT NULL CHECK (payment_method IN ('card', 'ramburs')),
  payment_status    text NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_session_id text UNIQUE,
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Users can view own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- NO client-side INSERT policy: orders are created server-side only
-- (via API route / server action using service role)

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update orders (change status, payment_status, etc.)
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- ORDER ITEMS
-- =============================================================================

CREATE TABLE public.order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity     integer NOT NULL CHECK (quantity > 0),
  unit_price   numeric(10,2) NOT NULL CHECK (unit_price >= 0)
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- Users can view items from own orders
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
  );

-- NO client-side INSERT policy: order items are created server-side only
-- (together with the order, using service role)

-- Admins can view all order items
CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- CART ITEMS (logged-in users only; guest cart lives in localStorage)
-- =============================================================================

CREATE TABLE public.cart_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity   integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);

CREATE POLICY "Users can view own cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own cart" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove from own cart" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- PACKAGE REQUESTS
-- =============================================================================

CREATE TABLE public.package_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name            text NOT NULL,
  email           text NOT NULL,
  phone           text,
  description     text NOT NULL,
  attachment_url  text,
  status          text NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'in_review', 'answered', 'closed')),
  admin_notes     text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.package_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a package request (including anonymous)
CREATE POLICY "Anyone can submit package request" ON public.package_requests
  FOR INSERT WITH CHECK (true);

-- Users can view own requests
CREATE POLICY "Users can view own package requests" ON public.package_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all package requests" ON public.package_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update requests (change status, add notes)
CREATE POLICY "Admins can update package requests" ON public.package_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- NEWSLETTER SUBSCRIPTIONS
-- =============================================================================

CREATE TABLE public.newsletter_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view newsletter subscriptions" ON public.newsletter_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update subscriptions
CREATE POLICY "Admins can update newsletter subscriptions" ON public.newsletter_subscriptions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete subscriptions
CREATE POLICY "Admins can delete newsletter subscriptions" ON public.newsletter_subscriptions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
