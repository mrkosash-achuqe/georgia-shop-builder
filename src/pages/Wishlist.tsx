import { Link } from "react-router-dom";
import { ChevronLeft, Heart, X, Star, Trash2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useWishlist } from "@/context/WishlistContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

const Wishlist = () => {
  const { lang, t } = useLanguage();
  const { items, toggleWishlist, clearWishlist } = useWishlist();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" />{t.productDetail.backToHome}
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
          <Heart className="h-7 w-7 text-primary" />{t.wishlist.title}
          {items.length > 0 && (
            <span className="text-lg font-normal text-muted-foreground">({items.length})</span>
          )}
          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-normal text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-lg hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              {t.wishlist.clear}
            </button>
          )}
        </h1>
        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">{t.wishlist.empty}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((product) => {
              const name = lang === "ka" ? product.nameKa : product.nameEn;
              return (
                <div key={product.id} className="flex items-center gap-4 bg-card rounded-xl border border-border p-3 hover:shadow-md transition-shadow">
                  <Link to={`/product/${product.id}`} className="shrink-0">
                    <img
                      src={product.img}
                      alt={name}
                      className="w-20 h-20 rounded-lg object-cover border border-border"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${product.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                      {name}
                    </Link>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < Math.floor(product.rating) ? "fill-star text-star" : "text-border"}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm font-bold text-primary mt-1">{product.price} {t.products.currency}</p>
                  </div>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    title={lang === "ka" ? "წაშლა" : "Remove"}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <div className="mt-auto"><Footer /></div>
      <CartDrawer />
    </div>
  );
};

export default Wishlist;
