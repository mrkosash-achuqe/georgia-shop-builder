import { supabase } from "@/integrations/supabase/client";

export const fetchSiteSettings = async (): Promise<Record<string, unknown>> => {
  const { data, error } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  if (error) throw error;
  return (data?.data || {}) as Record<string, unknown>;
};
