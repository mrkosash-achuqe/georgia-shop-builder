import { Heart, Star } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

import product1 from "@/assets/product1.jpg";
import product2 from "@/assets/product2.jpg";
import product3 from "@/assets/product3.jpg";
import product4 from "@/assets/product4.jpg";
import product5 from "@/assets/product5.jpg";
import product6 from "@/assets/product6.jpg";
import product7 from "@/assets/product7.jpg";
import product8 from "@/assets/product8.jpg";

const productData = [
  { img: product1, nameKa: "კედლის საათი - ჩუქურთმა", nameEn: "Wall Clock - Chukurtma", price: 190, rating: 4.8 },
  { img: product2, nameKa: "ჭრის დაფა - ქართული სტილი", nameEn: "Cutting Board - Georgian Style", price: 120, rating: 4.9 },
  { img: product3, nameKa: "სასაჩუქრე ყუთი", nameEn: "Gift Box - Ornamental", price: 85, rating: 4.7 },
  { img: product4, nameKa: "ქართული ხის დომინო", nameEn: "Wooden Domino Set", price: 65, rating: 4.6 },
  { img: product5, nameKa: "ღვინის ბოთლის სადგამი", nameEn: "Wine Bottle Holder", price: 150, rating: 5.0 },
  { img: product6, nameKa: "ფოტო ჩარჩო - ხის", nameEn: "Photo Frame - Wood", price: 75, rating: 4.5 },
  { img: product7, nameKa: "თაფლის კოვზის ნაკრები", nameEn: "Honey Dipper Set", price: 45, rating: 4.8 },
  { img: product8, nameKa: "კედლის დეკორაცია", nameEn: "Wall Decor - Cross", price: 110, rating: 4.9 },
];

const ProductCard = ({ product, lang, currency }: { product: typeof productData[0]; lang: string; currency: string }) => (
  <div className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
    <div className="relative aspect-square overflow-hidden">
      <img
        src={product.img}
        alt={lang === "ka" ? product.nameKa : product.nameEn}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
        width={512}
        height={512}
      />
      <button className="absolute bottom-3 right-3 bg-card/80 backdrop-blur-sm rounded-full p-2 text-muted-foreground hover:text-primary transition-colors">
        <Heart className="h-4 w-4" />
      </button>
    </div>
    <div className="p-3">
      <h3 className="text-sm font-medium text-foreground line-clamp-1 mb-1.5">
        {lang === "ka" ? product.nameKa : product.nameEn}
      </h3>
      <div className="flex items-center gap-1 mb-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${i < Math.floor(product.rating) ? "fill-star text-star" : "text-border"}`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({product.rating})</span>
      </div>
      <p className="text-base font-bold text-foreground">
        {product.price} {currency}
      </p>
    </div>
  </div>
);

const ProductGrid = () => {
  const { lang, t } = useLanguage();

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
        {t.products.title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {productData.map((product, i) => (
          <ProductCard key={i} product={product} lang={lang} currency={t.products.currency} />
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;
