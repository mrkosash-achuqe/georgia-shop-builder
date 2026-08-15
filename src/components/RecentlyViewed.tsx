import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Product } from "@/data/products";
import ProductCard from "@/components/ProductCard";

const mapRow = (row: any): Product => ({
  id: row.id,
  img: row.images?.[0] || "/placeholder.svg",
  images: row.images?.length ? row.images : ["/placeholder.svg"],
  nameKa: row.name_ka,
  nameEn: row.name_en,
  descKa: row.desc_ka || "",
  descEn: row.desc_en || "",
  price: Number(row.price),
  rating: Number(row.rating),
  reviews: row.reviews_count,
  category: row.category,
  material: row.material,
  dimensions: row.dimensions,
  inStock: row.in_stock,
});

const RecentlyViewed = ({ excludeId, limit = 6 }: { excludeId?: string; limit?: number }) => {
  const { lang } = useLanguage();
  const { ids, clear } = useRecentlyViewed();
  const list = ids.filter((id) => id !== excludeId).slice(0, limit);

  const { data: products = [] } = useQuery({
    queryKey: ["recently-viewed", list],
    enabled: list.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name_ka, name_en, desc_ka, desc_en, price, rating, reviews_count, category, material, dimensions, in_stock, images")
        .in("id", list);
      const mapped = (data || []).map(mapRow);
      return list.map((id) => mapped.find((p) => p.id === id)).filter(Boolean) as Product[];
    },
  });

  if (products.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          {lang === "ka" ? "ბოლოს ნანახი" : "Recently viewed"}
        </h2>
        <button onClick={clear} className="text-xs text-muted-foreground hover:text-primary transition-colors">
          {lang === "ka" ? "გასუფთავება" : "Clear"}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} lang={lang} currency={lang === "ka" ? "₾" : "GEL"} />
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
