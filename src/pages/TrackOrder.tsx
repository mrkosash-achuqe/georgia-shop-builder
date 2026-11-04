import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Search, Loader2, CheckCircle2, Truck, Clock, XCircle, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SEO from "@/components/SEO";

type TrackedOrder = {
  order_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  customer: string;
  city: string;
  address: string;
  payment_method: string;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
};

type TrackedItem = { product_name: string; product_image: string; quantity: number; unit_price: number };

const STEPS = ["pending", "processing", "shipped", "delivered"] as const;

const LABELS: Record<string, { ka: string; en: string }> = {
  pending: { ka: "მიღებულია", en: "Received" },
  processing: { ka: "მუშავდება", en: "Processing" },
  shipped: { ka: "გზაშია", en: "Shipped" },
  delivered: { ka: "მიწოდებულია", en: "Delivered" },
  cancelled: { ka: "გაუქმებულია", en: "Cancelled" },
};

const TrackOrder = () => {
  const { lang } = useLanguage();
  const ka = lang === "ka";
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [items, setItems] = useState<TrackedItem[]>([]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !contact.trim()) return;
    setLoading(true); setError(""); setOrder(null); setItems([]);
    const { data, error: fnErr } = await supabase.functions.invoke("track-order", {
      body: { orderNumber, contact },
    });
    setLoading(false);
    if (fnErr || !data?.order) {
      setError(ka ? "შეკვეთა ვერ მოიძებნა. შეამოწმეთ ნომერი და ელფოსტა/ტელეფონი." : "Order not found. Check the number and email/phone.");
      return;
    }
    setOrder(data.order);
    setItems(data.items || []);
  };

  const cancelled = order?.status === "cancelled";
  const activeIndex = order ? STEPS.indexOf(order.status as typeof STEPS[number]) : -1;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={ka ? "შეკვეთის მიდევნება | აჩუქე" : "Track your order | Achuqe"}
        description={ka ? "შეიყვანეთ შეკვეთის ნომერი და ელფოსტა, რომ ნახოთ მიწოდების სტატუსი." : "Enter your order number and email to see delivery status."}
      />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-10 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-5">
          <ChevronLeft className="h-4 w-4" /> {ka ? "მთავარზე" : "Back to shop"}
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{ka ? "შეკვეთის მიდევნება" : "Track your order"}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {ka ? "შეიყვანეთ შეკვეთის ნომერი და ელფოსტა ან ტელეფონი." : "Enter your order number and the email or phone used at checkout."}
        </p>

        <form onSubmit={submit} className="bg-card rounded-2xl border border-border p-4 sm:p-5 grid gap-3 sm:grid-cols-2">
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder={ka ? "ACH-260815-12345" : "ACH-260815-12345"}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={ka ? "ელფოსტა ან ტელეფონი" : "Email or phone"}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {ka ? "მოძებნა" : "Track"}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <XCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {order && (
          <div className="mt-6 space-y-4">
            <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <div>
                  <p className="font-bold text-foreground">#{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString(ka ? "ka-GE" : "en-GB")}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full ${cancelled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                  {LABELS[order.status]?.[ka ? "ka" : "en"] || order.status}
                </span>
              </div>

              {!cancelled && (
                <ol className="relative space-y-4">
                  {STEPS.map((s, i) => {
                    const done = i <= activeIndex;
                    const Icon = i === 0 ? Clock : i === 2 ? Truck : CheckCircle2;
                    return (
                      <li key={s} className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className={`text-sm font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
                            {LABELS[s][ka ? "ka" : "en"]}
                          </p>
                          {i === activeIndex && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.updated_at).toLocaleString(ka ? "ka-GE" : "en-GB")}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">{ka ? "მიწოდება" : "Delivery"}</p>
              <p className="text-sm text-foreground">{order.customer}</p>
              <p className="text-sm text-muted-foreground">{order.city}, {order.address}</p>
            </div>

            <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-3 p-3 sm:p-4">
                  {it.product_image ? (
                    <img src={it.product_image} alt={it.product_name} loading="lazy" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-secondary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{it.product_name}</p>
                    <p className="text-xs text-muted-foreground">× {it.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-foreground">{(it.quantity * Number(it.unit_price)).toFixed(2)} ₾</p>
                </div>
              ))}
              <div className="p-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>{ka ? "ქვეჯამი" : "Subtotal"}</span><span>{Number(order.subtotal).toFixed(2)} ₾</span></div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-muted-foreground"><span>{ka ? "ფასდაკლება" : "Discount"}</span><span>-{Number(order.discount).toFixed(2)} ₾</span></div>
                )}
                <div className="flex justify-between text-muted-foreground"><span>{ka ? "მიწოდება" : "Shipping"}</span><span>{Number(order.shipping_fee).toFixed(2)} ₾</span></div>
                <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border"><span>{ka ? "სულ" : "Total"}</span><span>{Number(order.total).toFixed(2)} ₾</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

export default TrackOrder;
