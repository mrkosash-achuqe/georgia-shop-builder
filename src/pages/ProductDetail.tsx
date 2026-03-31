import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, Heart, Star, ShoppingCart, Check, X, Truck, RotateCcw, Shield } from "lucide-react";
import { LanguageProvider, useLanguage } from "@/i18n/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";

const ProductDetailContent = () => {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLanguage();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {lang === "ka" ? "პროდუქტი ვერ მოიძებნა" : "Product Not Found"}
            </h1>
            <Link to="/" className="text-primary hover:underline">
              {lang === "ka" ? "მთავარ გვერდზე დაბრუნება" : "Back to Home"}
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const name = lang === "ka" ? product.nameKa : product.nameEn;
  const desc = lang === "ka" ? product.descKa : product.descEn;
  const similar = products.filter((p) => p.id !== product.id).slice(0, 4);

  const tp = t.productDetail;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 flex-1">
        {/* Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          {tp.backToHome}
        </Link>

        {/* Product section */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Gallery */}
          <div className="lg:w-1/2">
            <div className="bg-card rounded-2xl border border-border overflow-hidden mb-3">
              <img
                src={product.images[selectedImage]}
                alt={name}
                className="w-full aspect-square object-cover"
                width={600}
                height={600}
              />
            </div>
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl border-2 overflow-hidden transition-all ${
                    selectedImage === i
                      ? "border-primary shadow-md"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={img} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="lg:w-1/2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating) ? "fill-star text-star" : "text-border"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviews} {tp.reviews})
              </span>
            </div>

            {/* Price */}
            <div className="text-3xl font-bold text-primary mb-6">
              {product.price} {t.products.currency}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              {product.inStock ? (
                <>
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary font-medium">{tp.inStock}</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive font-medium">{tp.outOfStock}</span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed mb-6">{desc}</p>

            {/* Details table */}
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <h3 className="font-semibold text-foreground mb-3">{tp.details}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">{tp.material}</span>
                  <span className="text-foreground font-medium">{product.material}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">{tp.dimensions}</span>
                  <span className="text-foreground font-medium">{product.dimensions}</span>
                </div>
              </div>
            </div>

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2.5 text-foreground hover:bg-secondary transition-colors rounded-l-lg"
                >
                  −
                </button>
                <span className="px-4 py-2.5 text-foreground font-medium min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2.5 text-foreground hover:bg-secondary transition-colors rounded-r-lg"
                >
                  +
                </button>
              </div>

              <button
                disabled={!product.inStock}
                onClick={() => {
                  addToCart(product, quantity);
                  setQuantity(1);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-5 w-5" />
                {tp.addToCart}
              </button>

              <button className="p-3 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <Heart className="h-5 w-5" />
              </button>
            </div>

            {/* Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Truck, label: tp.freeDelivery },
                { icon: RotateCcw, label: tp.easyReturns },
                { icon: Shield, label: tp.guarantee },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-sm text-muted-foreground bg-card rounded-lg border border-border p-3"
                >
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Similar products */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">{tp.similarProducts}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} lang={lang} currency={t.products.currency} />
            ))}
          </div>
        </section>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>
      <CartDrawer />
    </div>
  );
};

const ProductDetail = () => (
  <LanguageProvider>
    <CartProvider>
      <ProductDetailContent />
    </CartProvider>
  </LanguageProvider>
);

export default ProductDetail;
