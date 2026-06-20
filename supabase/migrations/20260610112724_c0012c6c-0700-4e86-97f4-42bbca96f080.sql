CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
    SET 
      stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - NEW.quantity),
      in_stock = CASE WHEN GREATEST(0, COALESCE(stock_quantity, 0) - NEW.quantity) > 0 THEN true ELSE false END
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_product_stock ON public.order_items;
CREATE TRIGGER trg_decrement_product_stock
AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_product_stock();