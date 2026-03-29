import { useLanguage } from "@/i18n/LanguageContext";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";

const ProductGrid = () => {
  const { lang, t } = useLanguage();

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
        {t.products.title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} lang={lang} currency={t.products.currency} />
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;
