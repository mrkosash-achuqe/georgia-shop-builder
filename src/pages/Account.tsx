import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, User, Package, MapPin, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

type Order = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  paid: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  shipped: "bg-purple-500/10 text-purple-700 border-purple-500/30",
  delivered: "bg-green-500/10 text-green-700 border-green-500/30",
  completed: "bg-green-500/10 text-green-700 border-green-500/30",
  cancelled: "bg-red-500/10 text-red-700 border-red-500/30",
};

const Account = () => {
  const { lang, t } = useLanguage();
  const { user, profile, loading: authLoading, setAuthModalOpen } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as "profile" | "orders" | "address") || "profile";
  const at = t.account;

  const [form, setForm] = useState({ full_name: "", phone: "", city: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) setAuthModalOpen(true);
  }, [authLoading, user, setAuthModalOpen]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          city: (data as any).city || "",
          address: (data as any).address || "",
        });
      }
    });
  }, [user, profile]);

  useEffect(() => {
    if (!user || tab !== "orders") return;
    setOrdersLoading(true);
    supabase.from("orders").select("id, order_number, status, total, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setOrders((data as Order[]) || []); setOrdersLoading(false); });
  }, [user, tab]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim() || null,
      phone: form.phone.trim() || null,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("✅ " + at.saved);
  };

  const tabs: Array<{ id: "profile" | "orders" | "address"; label: string; icon: typeof User }> = [
    { id: "profile", label: at.tabProfile, icon: User },
    { id: "orders", label: at.tabOrders, icon: Package },
    { id: "address", label: at.tabAddress, icon: MapPin },
  ];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
        <CartDrawer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" />{t.productDetail.backToHome}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">{at.title}</h1>

        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          {tabs.map((tb) => {
            const Icon = tb.icon;
            const active = tab === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => setParams({ tab: tb.id })}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tb.label}
              </button>
            );
          })}
        </div>

        {(tab === "profile" || tab === "address") && (
          <div className="bg-card rounded-xl border border-border p-5 md:p-6 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tab === "profile" && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">{at.fullName}</label>
                    <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">{at.phone}</label>
                    <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+995 5XX XX XX XX"
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email</label>
                    <input type="email" value={user.email || ""} disabled
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm bg-secondary/50 text-muted-foreground" />
                  </div>
                </>
              )}
              {tab === "address" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{at.city}</label>
                    <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">{at.address}</label>
                    <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </>
              )}
            </div>
            <button onClick={save} disabled={saving}
              className="mt-5 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? "..." : at.save}
            </button>
          </div>
        )}

        {tab === "orders" && (
          <div>
            {ordersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">{at.noOrders}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="bg-card rounded-xl border border-border p-4 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[150px]">
                      <p className="text-xs text-muted-foreground">{at.orderNumber}</p>
                      <p className="font-mono font-semibold text-foreground">#{o.order_number}</p>
                    </div>
                    <div className="min-w-[120px]">
                      <p className="text-xs text-muted-foreground">{at.orderDate}</p>
                      <p className="text-sm text-foreground">{new Date(o.created_at).toLocaleDateString(lang === "ka" ? "ka-GE" : "en-US")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{at.orderStatus}</p>
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${statusColors[o.status] || "bg-secondary text-muted-foreground border-border"}`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{at.orderTotal}</p>
                      <p className="font-bold text-primary">{Number(o.total).toFixed(2)} {t.products.currency}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <div className="mt-auto"><Footer /></div>
      <CartDrawer />
    </div>
  );
};

export default Account;