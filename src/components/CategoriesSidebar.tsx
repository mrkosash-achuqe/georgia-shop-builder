import { useState } from "react";
import { ChevronRight, ChevronDown, Hash, Camera } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface CategoriesSidebarProps {
  selectedCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
}

const categoryKeys = [
  "cutting-board-sets",
  "clocks",
  "candle-holders",
  "gift-boxes",
  "photo-frames",
  "kids",
  "cutting-boards",
  "corporate",
  "other",
];

const CategoriesSidebar = ({ selectedCategory, onSelectCategory }: CategoriesSidebarProps) => {
  const { t, lang } = useLanguage();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const isKa = lang === "ka";

  const triggerSearch = (mode: "code" | "photo") => {
    window.dispatchEvent(new CustomEvent("open-search-mode", { detail: mode }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 md:max-h-[600px] md:opacity-100"}`}>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => triggerSearch("code")}
            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Hash className="h-3.5 w-3.5" />
            {isKa ? "კოდით ძიება" : "By Code"}
          </button>
          <button
            onClick={() => triggerSearch("photo")}
            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
            {isKa ? "ფოტოთი ძიება" : "By Photo"}
          </button>
        </div>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onSelectCategory?.(null)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-colors ${
                selectedCategory === null
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground hover:bg-secondary hover:text-primary"
              }`}
            >
              <ChevronRight className="h-3.5 w-3.5" />
              {t.categories.all}
            </button>
          </li>
          {t.categories.items.map((item, i) => (
            <li key={i}>
              <button
                onClick={() => onSelectCategory?.(categoryKeys[i])}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-colors group ${
                  selectedCategory === categoryKeys[i]
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-secondary hover:text-primary"
                }`}
              >
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                {item}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default CategoriesSidebar;
