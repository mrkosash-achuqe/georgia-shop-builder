import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { trackAddToWishlist, trackRemoveFromWishlist } from "@/lib/analytics";

interface WishlistContextType {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  syncing: boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const STORAGE_KEY = "achuqe_wishlist_v1";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isDbProduct = (id: string) => UUID_RE.test(id);

const mapDbProduct = (row: any): Product => ({
  id: row.id,
  img: row.images?.[0] || "/placeholder.svg",
  images: row.images?.length ? row.images : ["/placeholder.svg"],
  nameKa: row.name_ka,
  nameEn: row.name_en,
  descKa: row.desc_ka,
  descEn: row.desc_en,
  price: Number(row.price),
  rating: Number(row.rating),
  reviews: row.reviews_count,
  category: row.category,
  material: row.material,
  dimensions: row.dimensions,
  inStock: row.in_stock,
  personalizationEnabled: !!row.personalization_enabled,
  personalizationNote: row.personalization_note || "",
});

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [syncing, setSyncing] = useState(false);
  const syncedFor = useRef<string | null>(null);
  const [items, setItems] = useState<Product[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Product[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  // Sync with the database on sign-in: merge local items up, pull remote items down
  useEffect(() => {
    if (!user) {
      syncedFor.current = null;
      return;
    }
    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;

    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        const localIds = items.filter((p) => isDbProduct(p.id)).map((p) => p.id);
        if (localIds.length) {
          await supabase
            .from("wishlists")
            .upsert(
              localIds.map((product_id) => ({ user_id: user.id, product_id })),
              { onConflict: "user_id,product_id", ignoreDuplicates: true }
            );
        }

        const { data: rows } = await supabase
          .from("wishlists")
          .select("product_id")
          .eq("user_id", user.id);

        const ids = (rows ?? []).map((r: any) => r.product_id);
        if (!ids.length) {
          if (!cancelled) setItems((prev) => prev.filter((p) => !isDbProduct(p.id)));
          return;
        }

        const { data: prods } = await supabase.from("products").select("*").in("id", ids);
        if (cancelled) return;
        const remote = (prods ?? []).map(mapDbProduct);
        setItems((prev) => [...prev.filter((p) => !isDbProduct(p.id)), ...remote]);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, items]);

  const toggleWishlist = useCallback(
    (product: Product) => {
      let removed = false;
      setItems((prev) => {
        const exists = prev.find((p) => p.id === product.id);
        if (exists) {
          removed = true;
          return prev.filter((p) => p.id !== product.id);
        }
        return [...prev, product];
      });

      if (removed) {
        trackRemoveFromWishlist(product, lang);
      } else {
        trackAddToWishlist(product, lang);
      }

      if (user && isDbProduct(product.id)) {
        if (removed) {
          void supabase
            .from("wishlists")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", product.id);
        } else {
          void supabase
            .from("wishlists")
            .upsert(
              { user_id: user.id, product_id: product.id },
              { onConflict: "user_id,product_id", ignoreDuplicates: true }
            );
        }
      }
    },
    [user, lang]
  );

  const isInWishlist = useCallback(
    (productId: string) => items.some((p) => p.id === productId),
    [items]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
    if (user) void supabase.from("wishlists").delete().eq("user_id", user.id);
  }, [user]);

  return (
    <WishlistContext.Provider value={{ items, toggleWishlist, isInWishlist, clearWishlist, syncing }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
