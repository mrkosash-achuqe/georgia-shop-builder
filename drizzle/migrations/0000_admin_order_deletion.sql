GRANT DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));