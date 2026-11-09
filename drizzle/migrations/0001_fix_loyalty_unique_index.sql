DROP INDEX IF EXISTS public.loyalty_unique_earn_per_order;
CREATE UNIQUE INDEX loyalty_unique_earn_per_order ON public.loyalty_transactions (order_id, type);