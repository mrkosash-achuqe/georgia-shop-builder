import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, CreditCard, Truck, CheckCircle2, ShieldCheck, Tag, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

type PaymentMethod = "card" | "cash" | "transfer";

type Zone = {
  id: string;
  name_ka: string;
  name_en: string;
  fee: number;
  free_threshold: number | null;
};

type AppliedPromo = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
};

const Checkout = () => {
  const { lang, t } = useLanguage();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const ct = t.checkout;

  const [step, setStep] = useState<"form" | "confirmed">("form");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", city: "", address: "", note: "" });
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedNumber, setConfirmedNumber] = useState<string>("");
  const [promoInput, setPromoInput] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState("");

  useEffect(() => {
    supabase.from("shipping_zones").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => {
        const list = (data || []) as Zone[];
        setZones(list);
        if (list.length && !zoneId) setZoneId(list[0].id);
      });
  }, []);

  const selectedZone = zones.find((z) => z.id === zoneId);
  const deliveryFee = selectedZone
    ? (selectedZone.free_threshold !== null && totalPrice >= Number(selectedZone.free_threshold) ? 0 : Number(selectedZone.fee))
    : 0;
  const discount = promo
    ? (promo.discount_type === "percent"
        ? Math.min(totalPrice, Math.round((totalPrice * promo.discount_value) / 100 * 100) / 100)
        : Math.min(totalPrice, Number(promo.discount_value)))
    : 0;
  const grandTotal = Math.max(0, totalPrice - discount + deliveryFee);

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setApplyingPromo(true);
    setPromoError("");
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();
    if (error || !data) {
      setPromoError("კოდი ვერ მოიძებნა");
      setApplyingPromo(false);
      return;
    }
    const now = new Date();
    if (data.starts_at && new Date(data.starts_at) > now) { setPromoError("კოდი ჯერ არ არის აქტიური"); setApplyingPromo(false); return; }
    if (data.expires_at && new Date(data.expires_at) < now) { setPromoError("კოდი ვადაგასულია"); setApplyingPromo(false); return; }
    if (data.max_uses !== null && data.used_count >= data.max_uses) { setPromoError("კოდი ამოწურულია"); setApplyingPromo(false); return; }
    if (Number(data.min_order_amount) > totalPrice) { setPromoError(`მინ. შეკვეთა: ${data.min_order_amount}₾`); setApplyingPromo(false); return; }
    setPromo({ id: data.id, code: data.code, discount_type: data.discount_type as "percent" | "fixed", discount_value: Number(data.discount_value) });
    toast.success(`✅ კოდი გააქტიურდა: ${data.code}`);
    setApplyingPromo(false);
  };

  const removePromo = () => { setPromo(null); setPromoInput(""); setPromoError(""); };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = ct.required;
    if (!form.lastName.trim()) errs.lastName = ct.required;
    if (!form.phone.trim()) errs.phone = ct.required;
    if (!form.email.trim()) errs.email = ct.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = ct.invalidEmail;
    if (!form.city.trim()) errs.city = ct.required;
    if (!form.address.trim()) errs.address = ct.required;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        user_id: user?.id ?? null,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        note: form.note.trim(),
        subtotal: totalPrice,
        shipping_fee: deliveryFee,
        discount: discount,
        promo_code: promo?.code ?? null,
        total: grandTotal,
        payment_method: paymentMethod,
        status: "pending",
      }).select("id, order_number").single();
      if (error || !order) throw error || new Error("no order");

      const itemsPayload = items.map((it) => ({
        order_id: order.id,
        product_id: it.product.id,
        product_name: lang === "ka" ? it.product.nameKa : it.product.nameEn,
        product_image: it.product.img || "",
        quantity: it.quantity,
        unit_price: it.product.price,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      if (promo) {
        const { data: cur } = await supabase.from("promo_codes").select("used_count").eq("id", promo.id).single();
        await supabase.from("promo_codes").update({ used_count: (cur?.used_count ?? 0) + 1 }).eq("id", promo.id);
      }

      setConfirmedNumber(order.order_number);
      setStep("confirmed");
      clearCart();
    } catch (err: any) {
      toast.error("შეკვეთის გაგზავნა ვერ მოხერხდა: " + (err?.message || "შეცდომა"));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && step !== "confirmed") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">{ct.emptyCart}</p>
            <Link to="/" className="text-primary hover:underline font-medium">{ct.backToShop}</Link>
          </div>
        </div>
        <Footer /><CartDrawer />
      </div>
    );
  }

  if (step === "confirmed") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-card rounded-2xl border border-border p-8 md:p-12 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">{ct.orderConfirmed}</h1>
            <p className="text-muted-foreground mb-2">{ct.orderNumber}: #{confirmedNumber || `ACH-${Date.now().toString().slice(-6)}`}</p>
            <p className="text-muted-foreground mb-8">{ct.confirmationMessage}</p>
            <button onClick={() => navigate("/")} className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">{ct.backToShop}</button>
          </div>
        </div>
        <Footer /><CartDrawer />
      </div>
    );
  }

  const InputField = ({ label, field, type = "text", placeholder = "", colSpan = false }: { label: string; field: string; type?: string; placeholder?: string; colSpan?: boolean }) => (
    <div className={colSpan ? "sm:col-span-2" : ""}>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input type={type} value={(form as Record<string, string>)[field] || ""} onChange={(e) => updateField(field, e.target.value)} placeholder={placeholder}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${errors[field] ? "border-destructive" : "border-border"}`} />
      {errors[field] && <p className="text-xs text-destructive mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" />{ct.backToShop}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">{ct.title}</h1>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:flex-1 space-y-8">
              <section className="bg-card rounded-xl border border-border p-5 md:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />{ct.deliveryAddress}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label={ct.firstName} field="firstName" />
                  <InputField label={ct.lastName} field="lastName" />
                  <InputField label={ct.phone} field="phone" type="tel" placeholder="+995 5XX XX XX XX" />
                  <InputField label={ct.email} field="email" type="email" placeholder="email@example.com" />
                  <InputField label={ct.city} field="city" />
                  <InputField label={ct.address} field="address" colSpan />
                  {zones.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-1.5">{ct.delivery}</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {zones.map((z) => {
                          const isFree = z.free_threshold !== null && totalPrice >= Number(z.free_threshold);
                          return (
                            <button key={z.id} type="button" onClick={() => setZoneId(z.id)}
                              className={`text-left p-3 rounded-lg border-2 text-sm transition-all ${zoneId === z.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                              <div className="font-medium text-foreground">{lang === "ka" ? z.name_ka : (z.name_en || z.name_ka)}</div>
                              <div className="text-xs text-muted-foreground">{isFree ? ct.free : `${Number(z.fee).toFixed(0)} ${t.products.currency}`}{z.free_threshold && !isFree ? ` · უფასო ${Number(z.free_threshold).toFixed(0)}+` : ""}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">{ct.note}</label>
                    <textarea value={form.note} onChange={(e) => updateField("note", e.target.value)} rows={3} placeholder={ct.notePlaceholder}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                </div>
              </section>
              <section className="bg-card rounded-xl border border-border p-5 md:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />{ct.paymentMethod}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { id: "card" as const, label: ct.payCard, icon: CreditCard },
                    { id: "cash" as const, label: ct.payCash, icon: Truck },
                    { id: "transfer" as const, label: ct.payTransfer, icon: ShieldCheck },
                  ]).map(({ id, label, icon: Icon }) => (
                    <button key={id} type="button" onClick={() => setPaymentMethod(id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${paymentMethod === id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                      <Icon className="h-6 w-6" />{label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
            <div className="lg:w-96">
              <div className="bg-card rounded-xl border border-border p-5 md:p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-foreground mb-4">{ct.orderSummary}</h2>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {items.map((item) => {
                    const name = lang === "ka" ? item.product.nameKa : item.product.nameEn;
                    return (
                      <div key={item.product.id} className="flex gap-3">
                        <img src={item.product.img} alt={name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-1">{name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} × {item.product.price} {t.products.currency}</p>
                        </div>
                        <span className="text-sm font-semibold text-foreground shrink-0">{item.quantity * item.product.price} {t.products.currency}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground"><span>{ct.subtotal}</span><span>{totalPrice} {t.products.currency}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>{ct.delivery}</span><span>{deliveryFee === 0 ? ct.free : `${deliveryFee} ${t.products.currency}`}</span></div>
                  <div className="flex justify-between text-foreground font-bold text-lg pt-2 border-t border-border"><span>{ct.total}</span><span className="text-primary">{grandTotal} {t.products.currency}</span></div>
                </div>
                <button type="submit" disabled={submitting} className="w-full mt-6 bg-primary text-primary-foreground py-3.5 rounded-lg font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-60">{submitting ? "..." : ct.placeOrder}</button>
                <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />{ct.securePayment}</p>
              </div>
            </div>
          </div>
        </form>
      </main>
      <div className="mt-auto"><Footer /></div>
      <CartDrawer />
    </div>
  );
};

export default Checkout;
