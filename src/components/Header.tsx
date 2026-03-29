import { Search, Globe, User } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const Header = () => {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="bg-card border-b border-border">
      {/* Top bar */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-bold text-foreground tracking-tight">საპოვნელა</span>
          <span className="text-xs text-muted-foreground">Sapovnela.com</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-4 hidden md:flex">
          <div className="relative w-full">
            <input
              type="text"
              placeholder={t.nav.search}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 transition-opacity">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setLang(lang === "ka" ? "en" : "ka")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span>{lang === "ka" ? "EN" : "ქარ"}</span>
          </button>
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t.nav.signIn}</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="container mx-auto px-4 py-2 hidden md:flex items-center gap-6 text-sm font-medium">
        <a href="#" className="text-foreground hover:text-primary transition-colors">{t.nav.aboutUs}</a>
        <a href="#" className="text-foreground hover:text-primary transition-colors">{t.nav.blog}</a>
        <a href="#" className="text-foreground hover:text-primary transition-colors">{t.nav.contact}</a>
        <a href="#" className="text-foreground hover:text-primary transition-colors">{t.nav.delivery}</a>
        <a href="#" className="text-foreground hover:text-primary transition-colors">{t.nav.returns}</a>
      </nav>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative w-full">
          <input
            type="text"
            placeholder={t.nav.search}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-primary p-2 text-primary-foreground">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
