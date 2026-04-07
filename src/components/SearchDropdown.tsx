import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface SearchResult {
  id: string;
  name_ka: string;
  name_en: string;
  price: number;
  images: string[];
}

const SearchDropdown = () => {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setOpen(false); return; }
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
  }, [query, lang]);

  const name = (r: SearchResult) => lang === "ka" ? r.name_ka : r.name_en;

  return (
    <div ref={ref} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.nav.search}
        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 transition-opacity">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {lang === "ka" ? "პროდუქტი ვერ მოიძებნა" : "No products found"}
            </div>
          ) : (
            results.map((r) => (
              <Link
                key={r.id}
                to={`/product/${r.id}`}
                onClick={() => { setOpen(false); setQuery(""); }}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors"
              >
                <img
                  src={r.images?.[0] || "/placeholder.svg"}
                  alt={name(r)}
                  className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{name(r)}</p>
                  <p className="text-xs font-semibold text-primary">{r.price} {t.products.currency}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
