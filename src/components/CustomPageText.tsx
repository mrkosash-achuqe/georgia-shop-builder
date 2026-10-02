import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";

/** Shows admin-written page text (from site settings) if present. */
const CustomPageText = ({ page }: { page: "about" | "delivery" | "returns" }) => {
  const { lang } = useLanguage();
  const { settings } = useSiteSettings();
  const p = settings.pages || {};
  const text = (lang === "ka" ? p[`${page}Ka` as const] : p[`${page}En` as const]) || "";
  if (!text.trim()) return null;
  return (
    <div className="bg-card rounded-xl border border-border p-6 md:p-8 mb-8">
      <p className="whitespace-pre-wrap text-foreground leading-relaxed">{text}</p>
    </div>
  );
};

export default CustomPageText;
