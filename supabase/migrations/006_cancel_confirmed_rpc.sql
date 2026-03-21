-- Atomic cancel for confirmed orders: check confirmed + set cancelled + restore stock
CREATE OR REPLACE FUNCTION cancel_confirmed_order(p_order_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item RECORD;
BEGIN
  PERFORM 1 FROM public.orders WHERE id = p_order_id AND status = 'confirmed' FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE public.orders SET status = 'cancelled', updated_at = now() WHERE id = p_order_id;

  FOR v_item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id
  LOOP
    UPDATE public.products SET stock = stock + v_item.quantity WHERE id = v_item.product_id;
  END LOOP;

  RETURN true;
END;
$$;
