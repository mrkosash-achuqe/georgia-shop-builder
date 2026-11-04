import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActiveCategories } from "@/context/SiteSettingsContext";

interface CategoriesSidebarProps {
  selectedCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
}

const CategoriesSidebar = ({ selectedCategory, onSelectCategory }: CategoriesSidebarProps) => {
  const { t, lang } = useLanguage();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const categories = useActiveCategories();

  const itemClass = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-colors group ${
      active ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-secondary hover:text-primary"
    }`;

  return (
    <aside className="bg-card rounded-xl border border-border p-4 md:p-5">
      <button
        onClick={() => isMobile && setIsOpen(!isOpen)}
        className="w-full text-lg font-bold text-foreground mb-2 md:mb-4 flex items-center justify-between gap-2"
      >
        <span className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-primary rounded" />
          {t.categories.title}
        </span>
        {isMobile && (
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        )}
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0 md:max-h-[1200px] md:opacity-100"}`}>
        <ul className="space-y-1">
          <li>
            <button onClick={() => onSelectCategory?.(null)} className={itemClass(selectedCategory === null)}>
              <ChevronRight className="h-3.5 w-3.5" />
              {t.categories.all}
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button onClick={() => onSelectCategory?.(c.slug)} className={itemClass(selectedCategory === c.slug)}>
                {c.image_url ? (
                  <img src={c.image_url} alt="" className="h-6 w-6 rounded object-cover shrink-0" loading="lazy" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
                {lang === "ka" ? c.name_ka : c.name_en}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default CategoriesSidebar;
