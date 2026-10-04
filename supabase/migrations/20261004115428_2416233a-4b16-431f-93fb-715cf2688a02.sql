CREATE TABLE public.bot_settings (id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), data jsonb NOT NULL DEFAULT '{}'::jsonb, access_denied jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_settings TO authenticated;
GRANT ALL ON public.bot_settings TO service_role;
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage bot settings" ON public.bot_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER bot_settings_updated_at BEFORE UPDATE ON public.bot_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.bot_settings (id, data) SELECT 1, jsonb_build_object('systemPrompt', COALESCE(data->'aiChat'->>'systemPrompt','')) FROM public.site_settings WHERE id=1 ON CONFLICT (id) DO NOTHING;
UPDATE public.site_settings SET data = jsonb_set(data, '{aiChat}', COALESCE(data->'aiChat','{}'::jsonb) - 'systemPrompt') WHERE id=1 AND data ? 'aiChat';
CREATE OR REPLACE FUNCTION public.save_site_settings(_data jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE ai jsonb := COALESCE(_data->'aiChat', '{}'::jsonb); private_data jsonb; public_data jsonb;
BEGIN
 IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Access denied'; END IF;
 IF jsonb_typeof(_data) <> 'object' OR jsonb_typeof(ai) <> 'object' THEN RAISE EXCEPTION 'Invalid settings'; END IF;
 private_data := jsonb_build_object('systemPrompt', COALESCE(ai->>'systemPrompt',''), 'tone',COALESCE(ai->>'tone','friendly'), 'responseLength',COALESCE(ai->>'responseLength','short'), 'businessInfo',COALESCE(ai->>'businessInfo',''), 'restrictToStock',COALESCE((ai->>'restrictToStock')::boolean,true), 'restrictionsEnabled',COALESCE((ai->>'restrictionsEnabled')::boolean,false), 'restrictions',COALESCE(ai->>'restrictions',''), 'faqs',COALESCE(ai->'faqs','[]'::jsonb));
 public_data := jsonb_set(_data, '{aiChat}', ai - ARRAY['systemPrompt','tone','responseLength','businessInfo','restrictToStock','restrictionsEnabled','restrictions','faqs']);
 INSERT INTO public.bot_settings(id,data) VALUES(1,private_data) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data;
 INSERT INTO public.site_settings(id,data) VALUES(1,public_data) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data;
END; $$;
REVOKE ALL ON FUNCTION public.save_site_settings(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_site_settings(jsonb) TO authenticated;