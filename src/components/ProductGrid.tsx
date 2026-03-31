import { useLanguage } from "@/i18n/LanguageContext";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";

interface ProductGridProps {
  selectedCategory?: string | null;
  searchQuery?: string;
}

const categoryMap: Record<string, string> = {
  "cutting-board-sets": "cutting-board-sets",
  "clocks": "clocks",
  "candle-holders": "candle-holders",
  "gift-boxes": "gift-boxes",
  "photo-frames": "photo-frames",
  "kids": "kids",
  "cutting-boards": "cutting-boards",
  "corporate": "corporate",
  "other": "other",
};

const ProductGrid = ({ selectedCategory, searchQuery }: ProductGridProps) => {
  const { lang, t } = useLanguage();

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
      {filtered.length === 0 ? (
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
