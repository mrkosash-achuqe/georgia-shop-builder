import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Phone, Mail, MapPin, Clock, CheckCircle2, Send } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

const ContactContent = () => {
  const { t } = useLanguage();
  const ct = t.contact;
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" />
          {t.productDetail.backToHome}
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">{ct.title}</h1>
        <p className="text-muted-foreground mb-8">{ct.subtitle}</p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Contact form */}
          <div className="lg:flex-1">
            {sent ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">{ct.sent}</h2>
                <p className="text-muted-foreground">{ct.sentDesc}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{ct.nameLabel}</label>
                  <input
                    required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{ct.emailLabel}</label>
                  <input
                    type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{ct.messageLabel}</label>
                  <textarea
                    required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={ct.messagePlaceholder}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                  <Send className="h-4 w-4" />
                  {ct.send}
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="lg:w-80 space-y-4">
            {[
              { icon: Phone, label: t.footer.contact, value: t.footer.phone },
              { icon: Mail, label: ct.emailLabel, value: t.footer.email },
              { icon: MapPin, label: ct.address, value: ct.addressValue },
              { icon: Clock, label: ct.workHours, value: ct.workHoursValue },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <div className="mt-auto"><Footer /></div>
      <CartDrawer />
    </div>
  );
};

const Contact = () => (
  <CartProvider><ContactContent /></CartProvider>
);

export default Contact;
