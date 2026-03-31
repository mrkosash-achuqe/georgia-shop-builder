import { useState } from "react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoriesSidebar from "@/components/CategoriesSidebar";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <LanguageProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="min-h-screen flex flex-col bg-background">
            <Header />

            {/* Hero + Categories layout */}
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-64 shrink-0">
                  <CategoriesSidebar
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                  />
                </div>
                <div className="flex-1">
                  <HeroSection />
                </div>
              </div>
            </div>

            {/* Products */}
            <ProductGrid selectedCategory={selectedCategory} searchQuery={searchQuery} />

            {/* Footer */}
            <div className="mt-auto">
              <Footer />
            </div>

            <CartDrawer />
          </div>
        </WishlistProvider>
      </CartProvider>
    </LanguageProvider>
  );
};

export default Index;
