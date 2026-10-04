import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AiChatSettings = {
  enabled?: boolean; assistantName?: string; titleKa?: string; titleEn?: string;
  greetingKa?: string; greetingEn?: string; systemPrompt?: string;
  tone?: "friendly" | "formal" | "enthusiastic";
  responseLength?: "short" | "balanced" | "detailed";
  businessInfo?: string; restrictToStock?: boolean;
  restrictionsEnabled?: boolean; restrictions?: string;
  faqs?: { question: string; answer: string }[];
  suggestions?: { ka: string; en: string }[];
};

export type SiteSettings = {
  storeNameKa?: string;
  storeNameEn?: string;
  tagline?: string;
  logoUrl?: string;
  colors?: { primary?: string; background?: string; foreground?: string; card?: string };
  font?: string;
  banner?: {
    imageUrl?: string;
    badgeKa?: string; badgeEn?: string;
    titleKa?: string; titleEn?: string;
    ctaKa?: string; ctaEn?: string;
    ctaLink?: string;
  };
  contact?: {
    phone?: string; email?: string; addressKa?: string; addressEn?: string;
    facebook?: string; instagram?: string; tiktok?: string; youtube?: string;
  };
  announcement?: { enabled?: boolean; textKa?: string; textEn?: string; link?: string };
  aiChat?: AiChatSettings;
  pages?: {
    aboutKa?: string; aboutEn?: string;
    deliveryKa?: string; deliveryEn?: string;
    returnsKa?: string; returnsEn?: string;
  };
};

export type Category = {
  id: string;
  slug: string;
  name_ka: string;
  name_en: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export const FONT_PRESETS: Record<string, { label: string; family: string; url: string }> = {
  "noto-georgian": { label: "Noto Sans Georgian", family: "'Noto Sans Georgian', sans-serif", url: "https://fonts.googleapis.com/css2?family=Noto+Sans+Georgian:wght@300;400;500;600;700&display=swap" },
  "noto-serif-georgian": { label: "Noto Serif Georgian", family: "'Noto Serif Georgian', serif", url: "https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@400;500;600;700&display=swap" },
  "system": { label: "System (Sylfaen / Arial)", family: "Sylfaen, Arial, sans-serif", url: "" },
};

export const DEFAULT_COLORS = { primary: "#ec6f1c", background: "#f6f2ec", foreground: "#2e261f", card: "#fbf9f6" };

export const hexToHsl = (hex: string): string | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

type Ctx = {
  settings: SiteSettings;
  categories: Category[];
  loading: boolean;
  refresh: () => void;
};

const SiteSettingsContext = createContext<Ctx>({ settings: {}, categories: [], loading: true, refresh: () => {} });

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const qc = useQueryClient();
  const settingsQ = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
      if (error) throw error;
      return (data?.data || {}) as SiteSettings;
    },
    refetchInterval: 30000,
  });
  const catsQ = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return (data || []) as Category[];
    },
  });

  const settings = settingsQ.data || {};

  useEffect(() => {
    const root = document.documentElement;
    const c = settings.colors || {};
    const map: [string, string | undefined, string[]][] = [
      ["primary", c.primary, ["--primary", "--accent", "--ring", "--sidebar-primary", "--sidebar-ring"]],
      ["background", c.background, ["--background"]],
      ["foreground", c.foreground, ["--foreground", "--card-foreground", "--popover-foreground", "--secondary-foreground"]],
      ["card", c.card, ["--card", "--popover"]],
    ];
    map.forEach(([, val, vars]) => {
      const hsl = val ? hexToHsl(val) : null;
      vars.forEach((v) => (hsl ? root.style.setProperty(v, hsl) : root.style.removeProperty(v)));
    });
    const font = settings.font && FONT_PRESETS[settings.font];
    if (font) {
      let link = document.getElementById("site-font") as HTMLLinkElement | null;
      if (font.url) {
        if (!link) {
          link = document.createElement("link");
          link.id = "site-font";
          link.rel = "stylesheet";
          document.head.appendChild(link);
        }
        link.href = font.url;
      } else link?.remove();
      document.body.style.fontFamily = font.family;
    } else {
      document.body.style.removeProperty("font-family");
    }
  }, [settings]);

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        categories: catsQ.data || [],
        loading: settingsQ.isLoading || catsQ.isLoading,
        refresh: () => {
          qc.invalidateQueries({ queryKey: ["site_settings"] });
          qc.invalidateQueries({ queryKey: ["categories"] });
        },
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);

/** Active categories only, for the storefront. */
export const useActiveCategories = () => useSiteSettings().categories.filter((c) => c.is_active);

export const categoryLabel = (cats: Category[], slug: string, lang: string) => {
  const c = cats.find((x) => x.slug === slug);
  if (!c) return slug;
  return lang === "ka" ? c.name_ka : c.name_en;
};

export const youtubeId = (url?: string | null): string | null => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : /^[\w-]{11}$/.test(url.trim()) ? url.trim() : null;
};
