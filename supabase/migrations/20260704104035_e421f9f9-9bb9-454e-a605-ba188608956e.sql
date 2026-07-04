
CREATE OR REPLACE FUNCTION public.recalc_product_rating(p_product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg NUMERIC;
  v_count INTEGER;
BEGIN
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
    INTO v_avg, v_count
    FROM public.product_reviews
   WHERE product_id = p_product_id AND is_approved = true;

  UPDATE public.products
     SET rating = ROUND(v_avg::numeric, 1),
         reviews_count = v_count
   WHERE id = p_product_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.recalc_product_rating(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_reviews_recalc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_product_rating(OLD.product_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_product_rating(NEW.product_id);
    IF TG_OP = 'UPDATE' AND OLD.product_id <> NEW.product_id THEN
      PERFORM public.recalc_product_rating(OLD.product_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_reviews_recalc_ai
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_reviews_recalc();
