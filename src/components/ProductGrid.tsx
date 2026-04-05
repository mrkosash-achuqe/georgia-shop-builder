import { useLanguage } from "@/i18n/LanguageContext";
import { Product } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface ProductGridProps {
  selectedCategory?: string | null;
  searchQuery?: string;
}

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

const ProductGrid = ({ selectedCategory, searchQuery }: ProductGridProps) => {
  const { lang, t } = useLanguage();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapDbProduct);
    },
  });

  let filtered = products;

  if (selectedCategory) {
    filtered = filtered.filter((p) => p.category === selectedCategory);
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.nameKa.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.descKa.toLowerCase().includes(q) ||
        p.descEn.toLowerCase().includes(q)
    );
  }

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
        {t.products.title}
      </h2>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">{t.products.noResults}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} currency={t.products.currency} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
