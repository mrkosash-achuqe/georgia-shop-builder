import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoriesSidebar from "@/components/CategoriesSidebar";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

const Index = () => {
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const category = searchParams.get("category");
    setSelectedCategory(category || null);
    if (category && window.location.hash === "#products") {
      setTimeout(() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
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
      <div id="products">
        <ProductGrid selectedCategory={selectedCategory} searchQuery={searchQuery} />
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
      <CartDrawer />
    </div>
  );
};

export default Index;
