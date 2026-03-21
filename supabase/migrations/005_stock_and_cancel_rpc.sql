-- Atomic stock decrement: returns false if insufficient
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id uuid, p_quantity int)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.products SET stock = stock - p_quantity
  WHERE id = p_product_id AND stock >= p_quantity;
  RETURN FOUND;
END;
$$;

-- Stock restore (used by cancel)
CREATE OR REPLACE FUNCTION increment_stock(p_product_id uuid, p_quantity int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.products SET stock = stock + p_quantity WHERE id = p_product_id;
END;
$$;

-- Atomic cart cleanup: subtract ordered quantities in one transaction
CREATE OR REPLACE FUNCTION subtract_cart_items(p_user_id uuid, p_items jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item RECORD;
  v_current_qty int;
  v_new_qty int;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id uuid, quantity int)
  LOOP
    SELECT quantity INTO v_current_qty FROM public.cart_items
    WHERE user_id = p_user_id AND product_id = v_item.product_id;
    IF FOUND THEN
      v_new_qty := v_current_qty - v_item.quantity;
      IF v_new_qty <= 0 THEN
        DELETE FROM public.cart_items WHERE user_id = p_user_id AND product_id = v_item.product_id;
      ELSE
        UPDATE public.cart_items SET quantity = v_new_qty
        WHERE user_id = p_user_id AND product_id = v_item.product_id;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Atomic cancel: check pending + set cancelled + restore stock in one transaction
CREATE OR REPLACE FUNCTION cancel_order_and_restore_stock(p_order_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item RECORD;
BEGIN
  PERFORM 1 FROM public.orders WHERE id = p_order_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE public.orders SET status = 'cancelled', updated_at = now() WHERE id = p_order_id;

  FOR v_item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id
  LOOP
    UPDATE public.products SET stock = stock + v_item.quantity WHERE id = v_item.product_id;
  END LOOP;

  RETURN true;
END;
$$;
