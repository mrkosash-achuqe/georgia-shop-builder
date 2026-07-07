import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, Heart, Star, ShoppingCart, Check, X, Truck, RotateCcw, Shield, Loader2, ZoomIn, Plus, Minus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/data/products";
import { useWishlist } from "@/context/WishlistContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProductReviews from "@/components/ProductReviews";
import SEO from "@/components/SEO";

const generateSku = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return String(hash % 900000 + 100000);
};

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
  personalizationEnabled: !!row.personalization_enabled,
  personalizationNote: row.personalization_note || "",
});

type ProductSeo = {
  seo_title?: string | null;
  seo_description?: string | null;
  og_image?: string | null;
};

const ProductDetailContent = () => {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLanguage();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false);
  const [personalizationName, setPersonalizationName] = useState("");

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const mapped = mapDbProduct(data) as Product & ProductSeo;
      mapped.seo_title = (data as any).seo_title;
      mapped.seo_description = (data as any).seo_description;
      mapped.og_image = (data as any).og_image;
      return mapped;
    },
    enabled: !!id,
  });

  const { data: similar = [] } = useQuery({
    queryKey: ["similar-products", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .neq("id", id!)
        .limit(4);
      if (error) throw error;
      return (data || []).map(mapDbProduct);
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

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
  const tp = t.productDetail;
  const seo = product as Product & ProductSeo;
  const pageTitle = (seo.seo_title || `${name} — აჩუქე`).slice(0, 60);
  const pageDesc = (seo.seo_description || desc || "").slice(0, 160);
  const ogImg = seo.og_image || product.images?.[0];
  const canonical = `https://achuqe.com/product/${product.id}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={pageTitle}
        description={pageDesc}
        image={ogImg}
        type="product"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name,
          description: desc,
          image: product.images,
          sku: generateSku(product.id),
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "GEL",
            availability: product.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: canonical,
          },
          ...(product.reviews > 0 && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: product.rating,
              reviewCount: product.reviews,
            },
          }),
        }}
      />
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" />
          {tp.backToHome}
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Gallery */}
          <div className="lg:w-1/2">
            <div className="bg-card rounded-2xl border border-border overflow-hidden mb-3">
              <button
                type="button"
                onClick={() => { setZoomLevel(1); setZoomPos({ x: 50, y: 50 }); setZoomOpen(true); }}
                className="relative w-full block group"
                aria-label={tp.zoomHint}
              >
                <img src={product.images[selectedImage]} alt={name} className="w-full aspect-square object-cover" width={600} height={600} />
                <span className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-background/90 text-foreground text-xs px-2.5 py-1.5 rounded-md border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="h-3.5 w-3.5" /> {tp.zoomHint}
                </span>
              </button>
            </div>
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`w-20 h-20 rounded-xl border-2 overflow-hidden transition-all ${selectedImage === i ? "border-primary shadow-md" : "border-border hover:border-primary/50"}`}>
                  <img src={img} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="lg:w-1/2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-star text-star" : "text-border"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{product.rating} ({product.reviews} {tp.reviews})</span>
            </div>
            <div className="text-3xl font-bold text-primary mb-6">{product.price} {t.products.currency}</div>
            <div className="flex items-center gap-2 mb-6">
              {product.inStock ? (
                <><Check className="h-4 w-4 text-primary" /><span className="text-sm text-primary font-medium">{tp.inStock}</span></>
              ) : (
                <><X className="h-4 w-4 text-destructive" /><span className="text-sm text-destructive font-medium">{tp.outOfStock}</span></>
              )}
            </div>
            <p className="text-muted-foreground leading-relaxed mb-6">{desc}</p>
            {product.personalizationEnabled && (
            <div className="bg-card rounded-xl border border-border mb-6 overflow-hidden">
              <button
                type="button"
                onClick={() => setPersonalizationOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-secondary/50 transition-colors"
                aria-expanded={personalizationOpen}
              >
                <span className="font-semibold text-foreground">{tp.personalizationTitle}</span>
                <span className="flex items-center justify-center w-7 h-7 rounded-md border border-border text-muted-foreground shrink-0">
                  {personalizationOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>
              {personalizationOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
                  <h4 className="font-medium text-foreground">{tp.personalizationHeader}</h4>
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-1">{tp.personalizationNote}</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>{tp.personalizationDetail}</li>
                    </ul>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={personalizationEnabled}
                      onChange={(e) => setPersonalizationEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    {tp.personalizationCheckbox}
                  </label>
                  {personalizationEnabled && (
                    <input
                      type="text"
                      value={personalizationName}
                      onChange={(e) => setPersonalizationName(e.target.value)}
                      placeholder={tp.personalizationPlaceholder}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}
                </div>
              )}
            </div>
            )}
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <h3 className="font-semibold text-foreground mb-3">{tp.details}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">{tp.sku}</span>
                  <span className="text-foreground font-mono font-medium">#{generateSku(product.id)}</span>
                </div>
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
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-border rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2.5 text-foreground hover:bg-secondary transition-colors rounded-l-lg">−</button>
                <span className="px-4 py-2.5 text-foreground font-medium min-w-[3rem] text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2.5 text-foreground hover:bg-secondary transition-colors rounded-r-lg">+</button>
              </div>
              <button disabled={!product.inStock} onClick={() => { addToCart(product, quantity); setQuantity(1); }} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                <ShoppingCart className="h-5 w-5" />{tp.addToCart}
              </button>
              <button
                onClick={() => product && toggleWishlist(product)}
                className={`p-3 rounded-lg border transition-colors ${
                  product && isInWishlist(product.id)
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground hover:text-primary hover:border-primary"
                }`}
              >
                <Heart className={`h-5 w-5 ${product && isInWishlist(product.id) ? "fill-primary" : ""}`} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[{ icon: Truck, label: tp.freeDelivery }, { icon: RotateCcw, label: tp.easyReturns }, { icon: Shield, label: tp.guarantee }].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground bg-card rounded-lg border border-border p-3">
                  <Icon className="h-4 w-4 text-primary shrink-0" />{label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">{tp.similarProducts}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {similar.map((p) => (
                <ProductCard key={p.id} product={p} lang={lang} currency={t.products.currency} />
              ))}
            </div>
          </section>
        )}

        <ProductReviews productId={product.id} />
      </main>
      <div className="mt-auto"><Footer /></div>
      <CartDrawer />
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-5xl p-0 bg-background border-border overflow-hidden">
          <div
            className="relative w-full h-[80vh] overflow-hidden bg-secondary cursor-zoom-in"
            onClick={() => setZoomLevel((z) => (z >= 3 ? 1 : z + 1))}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setZoomPos({
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              });
            }}
          >
            <img
              src={product.images[selectedImage]}
              alt={name}
              className="w-full h-full object-contain transition-transform duration-200 select-none pointer-events-none"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
              }}
            />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 border border-border rounded-md px-3 py-1.5 text-xs text-muted-foreground">
              <ZoomIn className="h-3.5 w-3.5" /> {Math.round(zoomLevel * 100)}%
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 p-3 border-t border-border overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedImage(i); setZoomLevel(1); }}
                  className={`w-16 h-16 rounded-lg border-2 overflow-hidden shrink-0 transition-all ${selectedImage === i ? "border-primary" : "border-border hover:border-primary/50"}`}
                >
                  <img src={img} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetailContent;
