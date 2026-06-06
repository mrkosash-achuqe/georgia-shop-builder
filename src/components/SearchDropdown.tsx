import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Type, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface SearchResult {
  id: string;
  name_ka: string;
  name_en: string;
  price: number;
  images: string[];
  category?: string;
}

type Mode = "text" | "code";

const generateSku = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return String((hash % 900000) + 100000);
};

const SearchDropdown = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("text");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isKa = lang === "ka";

  const resetSearch = () => {
    setOpen(false);
    setQuery("");
  };

  const openProduct = (id: string) => {
    resetSearch();
    navigate(`/product/${id}`);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const m = (e as CustomEvent<Mode>).detail;
      if (m === "code" || m === "text") {
        setMode(m);
        setQuery("");
        setResults([]);
        setOpen(true);
      }
    };
    window.addEventListener("open-search-mode", handler as EventListener);
    return () => window.removeEventListener("open-search-mode", handler as EventListener);
  }, []);

  // Text search
  useEffect(() => {
    if (mode !== "text") return;
    if (query.trim().length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      const searchCol = lang === "ka" ? "name_ka" : "name_en";
      const { data } = await supabase
        .from("products")
        .select("id, name_ka, name_en, price, images")
        .ilike(searchCol, `%${query.trim()}%`)
        .limit(6);
      setResults(data || []);
      setOpen(true);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, lang, mode]);

  // Code search
  useEffect(() => {
    if (mode !== "code") return;
    const trimmed = query.trim();
    if (trimmed.length < 3) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, name_ka, name_en, price, images");
      const matches = (data || []).filter((p) => generateSku(p.id).includes(trimmed)).slice(0, 6);
      setResults(matches);
      setOpen(true);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, mode]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setQuery("");
    setResults([]);
  };

  const name = (r: SearchResult) => isKa ? r.name_ka : r.name_en;
  const placeholder =
    mode === "code"
      ? isKa ? "კოდი (მაგ: 914965)" : "Code (e.g. 914965)"
      : t.nav.search;

  return (
    <div ref={ref} className="relative w-full">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-background pr-1 focus-within:ring-2 focus-within:ring-primary">
        <div className="flex items-center gap-0.5 pl-1.5 py-1.5 border-r border-border mr-1">
          {([
            { m: "text" as Mode, icon: Type, title: isKa ? "ტექსტით" : "Text" },
            { m: "code" as Mode, icon: Hash, title: isKa ? "კოდით" : "Code" },
          ]).map(({ m, icon: Icon, title }) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              title={title}
              className={`p-1.5 rounded-md transition-colors ${
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
        <input
          type="text"
          inputMode={mode === "code" ? "numeric" : "text"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-2 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
        />
        <div className="rounded-md bg-primary p-2 text-primary-foreground shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </div>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-[32rem] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {loading
                ? isKa ? "ძებნა..." : "Searching..."
                : isKa ? "პროდუქტი ვერ მოიძებნა" : "No products found"}
            </div>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => openProduct(r.id)}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors w-full text-left"
              >
                <img
                  src={r.images?.[0] || "/placeholder.svg"}
                  alt={name(r)}
                  className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{name(r)}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-primary">{r.price} {t.products.currency}</p>
                    {mode === "code" && (
                      <span className="text-[10px] font-mono text-muted-foreground">#{generateSku(r.id)}</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
