import { Link } from "react-router-dom";
import { ChevronLeft, RotateCcw, RefreshCw, AlertTriangle, Banknote } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SEO from "@/components/SEO";

const Returns = () => {
  const { t } = useLanguage();
  const rt = t.returns;
  const sections = [
    { icon: RotateCcw, title: rt.policyTitle, desc: rt.policyDesc },
    { icon: RefreshCw, title: rt.exchangeTitle, desc: rt.exchangeDesc },
    { icon: AlertTriangle, title: rt.damageTitle, desc: rt.damageDesc },
    { icon: Banknote, title: rt.refundTitle, desc: rt.refundDesc },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={rt.title + " — achuqe"} description={rt.subtitle} />
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" />{t.productDetail.backToHome}
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2">{rt.title}</h1>
        <p className="text-muted-foreground mb-8">{rt.subtitle}</p>
        <div className="space-y-4">
          {sections.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card rounded-xl border border-border p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <div className="mt-auto"><Footer /></div>
      <CartDrawer />
    </div>
  );
};

export default Returns;
