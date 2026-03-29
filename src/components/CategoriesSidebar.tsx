import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const CategoriesSidebar = () => {
  const { t } = useLanguage();

  return (
    <aside className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="w-6 h-0.5 bg-primary rounded" />
        {t.categories.title}
      </h2>
      <ul className="space-y-1">
        {t.categories.items.map((item, i) => (
          <li key={i}>
            <a
              href="#"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary hover:text-primary transition-colors group"
            >
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              {item}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default CategoriesSidebar;
