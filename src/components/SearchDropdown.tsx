import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Type, Hash, Camera, X, Upload } from "lucide-react";
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

type Mode = "text" | "code" | "photo";

const generateSku = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return String((hash % 900000) + 100000);
};

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

const categoryMatchers: Record<string, string[]> = {
  "cutting-board-sets": ["cutting-board-sets", "ნაკრები", "საჭრელი დაფების ნაკრები", "შამფური", "შამფურები", "შამფურების ნაკრები", "skewer", "skewers", "skewer set", "set"],
  clocks: ["clocks", "საათი", "კედლის საათი", "clock", "wall clock"],
  "candle-holders": ["candle-holders", "სანთელი", "სანთლის სადგამი", "candle", "candle holder"],
  "gift-boxes": ["gift-boxes", "საჩუქრის ყუთი", "ყუთი", "gift box", "box"],
  "photo-frames": ["photo-frames", "ფოტო ჩარჩო", "ჩარჩო", "photo frame", "frame"],
  kids: ["kids", "საბავშვო", "ბავშვი", "children", "kid", "kids"],
  "cutting-boards": ["cutting-boards", "საჭრელი დაფა", "დაფა", "cutting board", "board"],
  corporate: ["corporate", "კორპორატიული", "corporate gift", "business gift"],
  other: ["other", "სხვა", "დეკორი", "decor", "decoration"],
};

const normalize = (value: string | null | undefined) => (value || "").toLowerCase().trim();

const inferCategories = (terms: string[]) => {
  const normalized = terms.map(normalize).filter(Boolean);
  return categoryKeys.filter((category) =>
    categoryMatchers[category].some((match) => {
      const m = normalize(match);
      return normalized.some((term) => term.includes(m) || m.includes(term));
    })
  );
};

const SearchDropdown = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("text");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoKeywords, setPhotoKeywords] = useState<string[]>([]);
  const [photoCategory, setPhotoCategory] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isKa = lang === "ka";

  const resetSearch = () => {
    setOpen(false);
    setQuery("");
    setPhotoPreview(null);
    setPhotoKeywords([]);
    setPhotoCategory(null);
  };

  const openCategory = (category: string) => {
    resetSearch();
    navigate(`/?category=${encodeURIComponent(category)}#products`);
  };

  const openProduct = (id: string) => {
    resetSearch();
    navigate(`/product/${id}`);
  };

  const openBestPhotoMatch = () => {
    if (results[0]) {
      openProduct(results[0].id);
      return;
    }
    const category = photoCategory || inferCategories(photoKeywords)[0];
    if (category) openCategory(category);
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
      if (m === "code" || m === "photo" || m === "text") {
        setMode(m);
        setQuery("");
        setResults([]);
        setPhotoCategory(null);
        setOpen(true);
        if (m === "photo") setTimeout(() => fileRef.current?.click(), 50);
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setOpen(true);
    setPhotoKeywords([]);
    setPhotoCategory(null);
    setResults([]);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      try {
        const { data, error } = await supabase.functions.invoke("image-search", { body: { imageUrl: dataUrl } });
        if (error) throw error;
        const kws: string[] = isKa ? data.keywords_ka || [] : data.keywords_en || [];
        setPhotoKeywords(kws);
        const inferredCategories = inferCategories([...(data.keywords_ka || []), ...(data.keywords_en || [])]);
        const bestCategory = inferredCategories[0] || null;
        setPhotoCategory(bestCategory);
        if (kws.length === 0 && !bestCategory) { setLoading(false); return; }
        // Fetch all products and rank by keyword matches against name + description + category
        const { data: prods } = await supabase
          .from("products")
          .select("id, name_ka, name_en, desc_ka, desc_en, price, images, category");
        const allKws = [...(data.keywords_ka || []), ...(data.keywords_en || [])].map((k: string) => k.toLowerCase());
        const ranked = (prods || [])
          .map((p: any) => {
            const hay = `${p.name_ka} ${p.name_en} ${p.desc_ka || ""} ${p.desc_en || ""} ${p.category || ""}`.toLowerCase();
            const keywordScore = allKws.reduce((s, k) => (k && hay.includes(k) ? s + 2 : s), 0);
            const categoryScore = inferredCategories.includes(p.category) ? 5 : 0;
            const score = keywordScore + categoryScore;
            return { p, score };
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
          .map((x) => ({ id: x.p.id, name_ka: x.p.name_ka, name_en: x.p.name_en, price: x.p.price, images: x.p.images, category: x.p.category }));
        setResults(ranked);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setQuery("");
    setResults([]);
    setPhotoPreview(null);
    setPhotoKeywords([]);
    setPhotoCategory(null);
    if (m === "photo") setTimeout(() => fileRef.current?.click(), 50);
  };

  const name = (r: SearchResult) => isKa ? r.name_ka : r.name_en;
  const placeholder =
    mode === "code"
      ? isKa ? "კოდი (მაგ: 914965)" : "Code (e.g. 914965)"
      : mode === "photo"
      ? isKa ? "ატვირთეთ ფოტო ძიებისთვის" : "Upload a photo to search"
      : t.nav.search;

  return (
    <div ref={ref} className="relative w-full">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-background pr-1 focus-within:ring-2 focus-within:ring-primary">
        <div className="flex items-center gap-0.5 pl-1.5 py-1.5 border-r border-border mr-1">
          {([
            { m: "text" as Mode, icon: Type, title: isKa ? "ტექსტით" : "Text" },
            { m: "code" as Mode, icon: Hash, title: isKa ? "კოდით" : "Code" },
            { m: "photo" as Mode, icon: Camera, title: isKa ? "ფოტოთი" : "Photo" },
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
        {mode === "photo" ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center gap-2 px-2 py-2.5 text-sm text-muted-foreground text-left"
          >
            <Upload className="h-4 w-4" />
            <span className="truncate">{placeholder}</span>
          </button>
        ) : (
          <input
            type="text"
            inputMode={mode === "code" ? "numeric" : "text"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            placeholder={placeholder}
            className="flex-1 bg-transparent px-2 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
          />
        )}
        <button
          type="button"
          onClick={() => { if (mode === "photo") openBestPhotoMatch(); }}
          className="rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-[32rem] overflow-y-auto">
          {mode === "photo" && photoPreview && (
            <div className="flex items-center gap-3 p-3 border-b border-border">
              <button type="button" onClick={openBestPhotoMatch} className="shrink-0" title={isKa ? "ნაპოვნზე გადასვლა" : "Open match"}>
                <img src={photoPreview} alt="" className="w-14 h-14 rounded-lg object-cover border border-border" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  {isKa ? "AI-ის ანალიზი:" : "AI analysis:"}
                </p>
                {photoKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {photoKeywords.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={async () => {
                          setLoading(true);
                          setOpen(true);
                          const categoryFallback = inferCategories([k])[0] || photoCategory;
                          const like = `%${k}%`;
                          const { data } = await supabase
                            .from("products")
                            .select("id, name_ka, name_en, price, images, desc_ka, desc_en, category")
                            .or(
                              `name_ka.ilike.${like},name_en.ilike.${like},desc_ka.ilike.${like},desc_en.ilike.${like},category.ilike.${like}`
                            )
                            .limit(8);
                          const matches = (data || []).map((p: any) => ({
                            id: p.id, name_ka: p.name_ka, name_en: p.name_en, price: p.price, images: p.images, category: p.category,
                          }));
                          setResults(matches);
                          if (matches.length === 0 && categoryFallback) openCategory(categoryFallback);
                          setLoading(false);
                        }}
                        className="text-[11px] bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                ) : loading ? (
                  <p className="text-xs text-muted-foreground">{isKa ? "მუშავდება..." : "Processing..."}</p>
                ) : null}
              </div>
              <button
                onClick={() => { setPhotoPreview(null); setPhotoKeywords([]); setResults([]); }}
                className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
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
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors"
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
