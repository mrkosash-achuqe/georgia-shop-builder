import { useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/data/products";

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
});

type Props = { productId?: string; limit?: number };

const AiRecommendations = ({ productId, limit = 4 }: Props) => {
  const { lang, t } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["ai-recs", productId, lang, limit],
    staleTime: 1000 * 60 * 30,
    retry: false,
    queryFn: async () => {
      const { data: res, error } = await supabase.functions.invoke("ai-recommendations", {
        body: { productId, lang, limit },
      });
      if (error) throw error;
      const ids: string[] = res?.ids ?? [];
      if (!ids.length) return { products: [] as Product[], reason: "" };
      const { data: rows } = await supabase.from("products").select("*").in("id", ids);
      const ordered = ids
        .map((id) => (rows ?? []).find((r: any) => r.id === id))
        .filter(Boolean)
        .map(mapDbProduct);
      return { products: ordered, reason: (res?.reason as string) ?? "" };
    },
  });

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            {lang === "ka" ? "თქვენ ასევე მოგეწონებათ" : "You may also like"}
          </h2>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (!data?.products?.length) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          {lang === "ka" ? "თქვენ ასევე მოგეწონებათ" : "You may also like"}
        </h2>
      </div>
      {data.reason && <p className="text-sm text-muted-foreground mb-5">{data.reason}</p>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {data.products.map((p) => (
          <ProductCard key={p.id} product={p} lang={lang} currency={t.products.currency} />
        ))}
      </div>
    </section>
  );
};

export default AiRecommendations;