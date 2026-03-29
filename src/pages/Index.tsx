import { LanguageProvider } from "@/i18n/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoriesSidebar from "@/components/CategoriesSidebar";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

const Index = () => {
  return (
    <LanguageProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />

          {/* Hero + Categories layout */}
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-64 shrink-0">
                <CategoriesSidebar />
              </div>
              <div className="flex-1">
                <HeroSection />
              </div>
            </div>
          </div>

          {/* Products */}
          <ProductGrid />

          {/* Footer */}
          <div className="mt-auto">
            <Footer />
          </div>

          <CartDrawer />
        </div>
      </CartProvider>
    </LanguageProvider>
  );
};

export default Index;
