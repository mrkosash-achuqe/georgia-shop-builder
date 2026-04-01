import { Link } from "react-router-dom";
import { ChevronLeft, Award, Hand, Sparkles, Truck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

const AboutContent = () => {
  const { t } = useLanguage();
  const at = t.about;

  const values = [
    { icon: Award, title: at.qualityTitle, desc: at.qualityDesc },
    { icon: Hand, title: at.handmadeTitle, desc: at.handmadeDesc },
    { icon: Sparkles, title: at.uniqueTitle, desc: at.uniqueDesc },
    { icon: Truck, title: at.deliveryTitle, desc: at.deliveryDesc },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" />
          {t.productDetail.backToHome}
        </Link>

        {/* Hero */}
        <div className="bg-card rounded-2xl border border-border p-8 md:p-12 mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{at.heroTitle}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg">{at.heroDesc}</p>
        </div>

        {/* Mission */}
        <div className="bg-card rounded-xl border border-border p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">{at.missionTitle}</h2>
          <p className="text-muted-foreground leading-relaxed">{at.missionDesc}</p>
        </div>

        {/* Values grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card rounded-xl border border-border p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </main>
      <div className="mt-auto"><Footer /></div>
      <CartDrawer />
    </div>
  );
};

const About = () => (
  <LanguageProvider><CartProvider><AboutContent /></CartProvider></LanguageProvider>
);

export default About;
