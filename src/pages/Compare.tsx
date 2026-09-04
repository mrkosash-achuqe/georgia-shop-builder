import { Link } from "react-router-dom";
import { Scale, X, ShoppingCart, Star, ChevronLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCompare } from "@/context/CompareContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/i18n/LanguageContext";

const CATEGORY_LABELS: Record<string, { ka: string; en: string }> = {
  clocks: { ka: "საათები", en: "Clocks" },
  "cutting-boards": { ka: "ჭრის დაფები", en: "Cutting Boards" },
  "gift-boxes": { ka: "სასაჩუქრე ყუთები", en: "Gift Boxes" },
  "photo-frames": { ka: "ფოტო ჩარჩოები", en: "Photo Frames" },
  other: { ka: "სხვა", en: "Other" },
};

const Compare = () => {
  const { items, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const { lang } = useLanguage();
  const ka = lang === "ka";
  const currency = ka ? "₾" : "GEL";

  const rows: { label: string; render: (p: (typeof items)[number]) => React.ReactNode; highlightDiff?: (p: (typeof items)[number]) => string | number }[] = [
    {
      label: ka ? "ფასი" : "Price",
      render: (p) => <span className="font-bold text-foreground">{p.price} {currency}</span>,
      highlightDiff: (p) => p.price,
    },
    {
      label: ka ? "შეფასება" : "Rating",
      render: (p) => (
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-star text-star" /> {p.rating} ({p.reviews})
        </span>
      ),
      highlightDiff: (p) => p.rating,
    },
    {
      label: ka ? "კატეგორია" : "Category",
      render: (p) => CATEGORY_LABELS[p.category]?.[ka ? "ka" : "en"] || p.category,
    },
    { label: ka ? "მასალა" : "Material", render: (p) => p.material },
    { label: ka ? "ზომები" : "Dimensions", render: (p) => p.dimensions },
    {
      label: ka ? "მარაგი" : "Stock",
      render: (p) =>
        p.inStock ? (
          <span className="text-green-600 font-medium">{ka ? "მარაგშია" : "In stock"}</span>
        ) : (
          <span className="text-destructive font-medium">{ka ? "არ არის მარაგში" : "Out of stock"}</span>
        ),
    },
    {
      label: ka ? "პერსონალიზაცია" : "Personalization",
      render: (p) =>
        p.personalizationEnabled
          ? <span className="text-green-600">✓</span>
          : <span className="text-muted-foreground">—</span>,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> {ka ? "მთავარი" : "Home"}
        </Link>

        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            {ka ? "პროდუქტების შედარება" : "Compare Products"}
          </h1>
          {items.length > 0 && (
            <button onClick={clearCompare} className="text-sm text-muted-foreground hover:text-destructive transition-colors">
              {ka ? "გასუფთავება" : "Clear all"}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <Scale className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-1">
              {ka ? "შედარების სია ცარიელია" : "Your comparison list is empty"}
            </p>
            <p className="text-sm text-muted-foreground/70">
              {ka
                ? "დაამატეთ პროდუქტები შედარების ღილაკით (⚖) — მაქს. 3"
                : "Add products with the compare button (⚖) — up to 3"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[640px] border-collapse bg-card rounded-2xl border border-border overflow-hidden">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left text-sm text-muted-foreground font-medium w-36 align-bottom">
                    {ka ? "პროდუქტი" : "Product"}
                  </th>
                  {items.map((p) => {
                    const name = ka ? p.nameKa : p.nameEn;
                    return (
                      <th key={p.id} className="p-4 align-top">
                        <div className="relative">
                          <button
                            onClick={() => removeFromCompare(p.id)}
                            className="absolute -top-1 -right-1 bg-card border border-border rounded-full p-1 text-muted-foreground hover:text-destructive transition-colors"
                            aria-label={ka ? "წაშლა" : "Remove"}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <Link to={`/product/${p.id}`}>
                            <img
                              src={p.img}
                              alt={name}
                              className="w-28 h-28 object-cover rounded-xl border border-border mx-auto"
                              loading="lazy"
                            />
                            <p className="text-sm font-medium text-foreground mt-2 text-center line-clamp-2">{name}</p>
                          </Link>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const values = row.highlightDiff ? items.map(row.highlightDiff) : null;
                  const allSame = values ? new Set(values).size === 1 : true;
                  return (
                    <tr key={row.label} className="border-b border-border last:border-0">
                      <td className="p-4 text-sm text-muted-foreground font-medium">{row.label}</td>
                      {items.map((p) => (
                        <td
                          key={p.id}
                          className={`p-4 text-sm text-center ${!allSame ? "bg-primary/5" : ""}`}
                        >
                          {row.render(p)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr>
                  <td className="p-4" />
                  {items.map((p) => (
                    <td key={p.id} className="p-4 text-center">
                      <button
                        onClick={() => addToCart(p, 1)}
                        disabled={!p.inStock}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {ka ? "კალათაში" : "Add to cart"}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Compare;
