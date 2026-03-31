import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

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
  const { t } = useLanguage();

  return (
    <aside className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="w-6 h-0.5 bg-primary rounded" />
        {t.categories.title}
      </h2>
      <ul className="space-y-1">
        {/* All categories */}
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
    </aside>
  );
};

export default CategoriesSidebar;
