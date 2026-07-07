import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Language, translations } from "./translations";

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (typeof translations)[Language];
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "achuqe.lang";

const detectInitial = (): Language => {
  if (typeof window === "undefined") return "ka";
  const url = new URLSearchParams(window.location.search).get("lang");
  if (url === "en" || url === "ka") return url;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "ka") return stored;
  const nav = window.navigator?.language?.toLowerCase() ?? "";
  return nav.startsWith("en") ? "en" : "ka";
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(detectInitial);
  const t = translations[lang];

  const setLang = (next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
