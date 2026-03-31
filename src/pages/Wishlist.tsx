import { Link } from "react-router-dom";
import { ChevronLeft, Heart } from "lucide-react";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider, useWishlist } from "@/context/WishlistContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";

const WishlistContent = () => {
  const { lang, t } = useLanguage();
  const { items } = useWishlist();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" />
          {t.productDetail.backToHome}
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
          <Heart className="h-7 w-7 text-primary" />
          {t.wishlist.title}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">{t.wishlist.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} currency={t.products.currency} />
            ))}
          </div>
        )}
      </main>
      <div className="mt-auto"><Footer /></div>
      <CartDrawer />
    </div>
  );
};

const Wishlist = () => (
  <LanguageProvider><CartProvider><WishlistProvider><WishlistContent /></WishlistProvider></CartProvider></LanguageProvider>
);

export default Wishlist;
