import { useState } from "react";
import { Search, Globe, User, ShoppingCart, Menu, X, ChevronRight, LogOut, Heart } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const { lang, setLang, t } = useLanguage();
  const { totalItems, setIsOpen } = useCart();
  const { user, profile, signOut, setAuthModalOpen } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: t.nav.aboutUs, href: "/about" },
    { label: t.nav.blog, href: "/blog" },
    { label: t.nav.contact, href: "/contact" },
    { label: t.nav.delivery, href: "/delivery" },
    { label: t.nav.returns, href: "/returns" },
  ];

  const userInitial = profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      <header className="bg-card border-b border-border sticky top-0 z-30">
        {/* Top bar */}
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 text-foreground hover:text-primary transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">აჩუქე</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">achuqe.com</span>
          </Link>

          {/* Search (desktop) */}
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
              <span className="hidden sm:inline">{lang === "ka" ? "EN" : "ქარ"}</span>
            </button>

            <Link
              to="/wishlist"
              className="text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
              title={t.nav.wishlist}
            >
              <Heart className="h-5 w-5" />
            </Link>

            <button
              onClick={() => setIsOpen(true)}
              className="relative flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">{userInitial}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground max-w-[100px] truncate">{profile?.full_name || t.auth.myAccount}</span>
                <button
                  onClick={signOut}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title={t.auth.signOut}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4" />
                <span>{t.nav.signIn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation (desktop) */}
        <nav className="container mx-auto px-4 py-2.5 hidden md:flex items-center justify-center gap-1 text-sm font-medium border-t border-border/50">
          {navLinks.map((link, i) => (
            <span key={link.label} className="flex items-center">
              <Link
                to={link.href}
                className="relative px-4 py-1.5 rounded-full text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
              >
                {link.label}
              </Link>
              {i < navLinks.length - 1 && (
                <span className="w-1 h-1 rounded-full bg-border mx-1" />
              )}
            </span>
          ))}
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

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-72 bg-card border-r border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-300">
            {/* Menu header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-lg font-bold text-foreground">აჩუქე</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User action */}
            <div className="p-4 border-b border-border">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="text-sm bg-primary text-primary-foreground">{userInitial}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || t.auth.myAccount}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { signOut(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.auth.signOut}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm"
                >
                  <User className="h-4 w-4" />
                  {t.nav.signIn}
                </button>
              )}
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto p-4">
              {/* Wishlist link */}
              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-3 rounded-lg text-foreground hover:bg-secondary hover:text-primary transition-colors text-sm font-medium mb-1"
              >
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  {t.nav.wishlist}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-3 rounded-lg text-foreground hover:bg-secondary hover:text-primary transition-colors text-sm font-medium"
                    >
                      {link.label}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Categories in mobile menu */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  {t.categories.title}
                </h3>
                <ul className="space-y-1">
                  {t.categories.items.map((cat, i) => (
                    <li key={i}>
                      <a
                        href="#"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary hover:text-primary transition-colors"
                      >
                        {cat}
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            {/* Language switch */}
            <div className="p-4 border-t border-border">
              <button
                onClick={() => {
                  setLang(lang === "ka" ? "en" : "ka");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Globe className="h-4 w-4" />
                {lang === "ka" ? "English" : "ქართული"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
