-- Fix infinite recursion in RLS policies.
-- All admin policies used: EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
-- This causes recursion when evaluated on the profiles table itself,
-- and also when other tables' policies trigger profiles RLS evaluation.
-- Fix: SECURITY DEFINER function that bypasses RLS.

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = check_user_id
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- =============================================================================
-- PROFILES (001)
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- =============================================================================
-- CATEGORIES (002)
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view all categories" ON public.categories;
CREATE POLICY "Admins can view all categories" ON public.categories
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories" ON public.categories
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories" ON public.categories
  FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories" ON public.categories
  FOR DELETE USING (public.is_admin(auth.uid()));

-- =============================================================================
-- PRODUCTS (002)
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (public.is_admin(auth.uid()));

-- =============================================================================
-- PRODUCT RELATIONS (002 + 004)
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view all product relations" ON public.product_relations;
CREATE POLICY "Admins can view all product relations" ON public.product_relations
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert product relations" ON public.product_relations;
CREATE POLICY "Admins can insert product relations" ON public.product_relations
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update product relations" ON public.product_relations;
CREATE POLICY "Admins can update product relations" ON public.product_relations
  FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete product relations" ON public.product_relations;
CREATE POLICY "Admins can delete product relations" ON public.product_relations
  FOR DELETE USING (public.is_admin(auth.uid()));

-- =============================================================================
-- ORDERS (002)
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- =============================================================================
-- ORDER ITEMS (002)
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (public.is_admin(auth.uid()));

-- =============================================================================
-- PACKAGE REQUESTS (002)
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view all package requests" ON public.package_requests;
CREATE POLICY "Admins can view all package requests" ON public.package_requests
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update package requests" ON public.package_requests;
CREATE POLICY "Admins can update package requests" ON public.package_requests
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- =============================================================================
-- NEWSLETTER (002)
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view newsletter subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Admins can view newsletter subscriptions" ON public.newsletter_subscriptions
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update newsletter subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Admins can update newsletter subscriptions" ON public.newsletter_subscriptions
  FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete newsletter subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Admins can delete newsletter subscriptions" ON public.newsletter_subscriptions
  FOR DELETE USING (public.is_admin(auth.uid()));

-- =============================================================================
-- STORAGE (003)
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view all package attachments" ON storage.objects;
CREATE POLICY "Admins can view all package attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'package-attachments'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can delete package attachments" ON storage.objects;
CREATE POLICY "Admins can delete package attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'package-attachments'
    AND public.is_admin(auth.uid())
  );
