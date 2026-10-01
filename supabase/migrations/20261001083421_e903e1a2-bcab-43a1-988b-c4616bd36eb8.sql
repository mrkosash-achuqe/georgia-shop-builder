CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_ka text NOT NULL,
  name_en text NOT NULL,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Signed-in view categories" ON public.categories FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.categories (slug,name_ka,name_en,sort_order) VALUES
('cutting-board-sets','შამფურების ნაკრები','Cutting Board Sets',1),
('clocks','საათი','Clocks',2),
('candle-holders','სანათი','Candle Holders',3),
('gift-boxes','სასაჩუქრე ყუთი','Gift Boxes',4),
('photo-frames','ფოტო ჩარჩო','Photo Frames',5),
('kids','საბავშვო','Kids',6),
('cutting-boards','შამფურები','Cutting Boards',7),
('corporate','კორპორატიული','Corporate',8),
('other','სხვადასხვა','Other',9);

CREATE TABLE public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view anon settings" ON public.site_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Signed-in view settings" ON public.site_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.site_settings (id, data) VALUES (1, '{}'::jsonb);

ALTER TABLE public.products ADD COLUMN video_url text;