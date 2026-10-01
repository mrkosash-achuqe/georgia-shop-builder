REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
DROP POLICY "Anyone can view approved reviews" ON public.product_reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.product_reviews FOR SELECT TO anon USING (is_approved = true);
CREATE POLICY "Signed-in can view approved, own or admin reviews" ON public.product_reviews FOR SELECT TO authenticated USING ((is_approved = true) OR (auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::app_role));