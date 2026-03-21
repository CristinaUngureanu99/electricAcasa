-- Dashboard stats as a single RPC call — all counts + revenue in one query
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT json_build_object(
    'users_count', (SELECT count(*) FROM profiles),
    'products_count', (SELECT count(*) FROM products),
    'orders_count', (SELECT count(*) FROM orders),
    'revenue', (SELECT coalesce(sum(total), 0) FROM orders WHERE payment_status = 'paid'),
    'pending_requests', (SELECT count(*) FROM package_requests WHERE status = 'new')
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
