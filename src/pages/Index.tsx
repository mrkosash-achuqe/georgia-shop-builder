import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoriesSidebar from "@/components/CategoriesSidebar";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SEO from "@/components/SEO";
import { useLanguage } from "@/i18n/LanguageContext";

const Index = () => {
  const { lang } = useLanguage();
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
      <SEO
        title={lang === "ka"
          ? "აჩუქე — ხელნაკეთი ხის ნაკეთობები საქართველოში"
          : "achuqe — Handcrafted Wooden Products from Georgia"}
        description={lang === "ka"
          ? "ხელნაკეთი ხის ნაკეთობების ონლაინ მაღაზია: შამფურები, საათები, საჩუქრები. უფასო მიწოდება 100₾-ზე მეტ შეკვეთაზე."
          : "Online store for handcrafted wooden products by Georgian masters: cutting boards, clocks, gifts. Free delivery on orders over 100 GEL."}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "achuqe",
          url: "https://achuqe.com",
          inLanguage: lang === "ka" ? "ka-GE" : "en-US",
        }}
      />
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
