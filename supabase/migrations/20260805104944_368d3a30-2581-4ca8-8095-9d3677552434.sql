
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(_order_id uuid, _points integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_balance integer; v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _points IS NULL OR _points <= 0 THEN RETURN 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = _order_id AND user_id = v_uid) THEN
    RAISE EXCEPTION 'order not found';
  END IF;
  SELECT COALESCE(SUM(points), 0) INTO v_balance FROM public.loyalty_transactions WHERE user_id = v_uid;
  IF v_balance < _points THEN RAISE EXCEPTION 'insufficient points'; END IF;
  INSERT INTO public.loyalty_transactions (user_id, order_id, points, type, description)
  VALUES (v_uid, _order_id, -_points, 'redeem', 'Redeemed on order')
  ON CONFLICT (order_id, type) DO NOTHING;
  RETURN _points;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_loyalty_points(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_points(uuid, integer) TO authenticated;
