
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  points integer NOT NULL,
  type text NOT NULL DEFAULT 'earn',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS loyalty_unique_earn_per_order
  ON public.loyalty_transactions(order_id, type) WHERE order_id IS NOT NULL;

GRANT SELECT ON public.loyalty_transactions TO authenticated;
GRANT ALL ON public.loyalty_transactions TO service_role;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own loyalty" ON public.loyalty_transactions;
CREATE POLICY "Users view own loyalty" ON public.loyalty_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.recalc_loyalty_balance(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
     SET loyalty_points = GREATEST(0, COALESCE((
       SELECT SUM(points) FROM public.loyalty_transactions WHERE user_id = _user_id
     ), 0))
   WHERE id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_loyalty_balance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recalc_loyalty_balance(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS loyalty_balance_sync ON public.loyalty_transactions;
CREATE TRIGGER loyalty_balance_sync
AFTER INSERT OR UPDATE OR DELETE ON public.loyalty_transactions
FOR EACH ROW EXECUTE FUNCTION public.trg_loyalty_balance();

CREATE OR REPLACE FUNCTION public.award_order_loyalty()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_points integer;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status IN ('paid','shipped','delivered','completed')
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    v_points := FLOOR(COALESCE(NEW.total,0))::integer;
    IF v_points > 0 THEN
      INSERT INTO public.loyalty_transactions (user_id, order_id, points, type, description)
      VALUES (NEW.user_id, NEW.id, v_points, 'earn', 'Order ' || NEW.order_number)
      ON CONFLICT (order_id, type) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_order_loyalty ON public.orders;
CREATE TRIGGER trg_award_order_loyalty
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.award_order_loyalty();

CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  reminded_at timestamptz,
  recovered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS abandoned_carts_user_unique ON public.abandoned_carts(user_id) WHERE user_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.abandoned_carts TO authenticated;
GRANT ALL ON public.abandoned_carts TO service_role;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own abandoned cart" ON public.abandoned_carts;
CREATE POLICY "Users manage own abandoned cart" ON public.abandoned_carts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS abandoned_carts_updated_at ON public.abandoned_carts;
CREATE TRIGGER abandoned_carts_updated_at BEFORE UPDATE ON public.abandoned_carts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
