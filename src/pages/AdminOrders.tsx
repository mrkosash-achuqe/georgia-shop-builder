import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Package, Users as UsersIcon, Truck, ShoppingBag, ArrowLeft,
  ChevronDown, Search, XCircle, AlertTriangle, Eye, X, BarChart3 , MessageSquare } from "lucide-react";

type Order = {
  id: string;
  order_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  note: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
};

type OrderItem = {
  id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
};

const STATUSES = [
  { id: "pending", label: "მოლოდინში", color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30" },
  { id: "paid", label: "გადახდილი", color: "bg-green-500/10 text-green-700 border-green-500/30" },
  { id: "shipped", label: "გაგზავნილი", color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  { id: "delivered", label: "მიწოდებული", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  { id: "cancelled", label: "გაუქმებული", color: "bg-destructive/10 text-destructive border-destructive/30" },
];

const statusOf = (s: string) => STATUSES.find((x) => x.id === s) || STATUSES[0];

const AdminOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); setChecking(false); });
  }, [user, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchOrders();
  }, [isAdmin]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) toast.error("შეკვეთების ჩატვირთვა ვერ მოხერხდა");
    else setOrders(data || []);
    setLoading(false);
  };

  const openOrder = async (o: Order) => {
    setSelected(o);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", o.id);
    setItems(data || []);
  };

  const updateStatus = async (newStatus: string) => {
    if (!selected) return;
    setUpdating(true);
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", selected.id);
    if (error) toast.error("სტატუსის შეცვლა ვერ მოხერხდა");
    else {
      toast.success("სტატუსი განახლდა");
      setSelected({ ...selected, status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? { ...o, status: newStatus } : o)));
    }
    setUpdating(false);
  };

  if (authLoading || checking) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  }
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-3">წვდომა შეზღუდულია</h1>
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-medium"><ArrowLeft className="h-4 w-4" /> მთავარ გვერდზე</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const filtered = orders.filter((o) => {
    const matchQ = !query || o.order_number.toLowerCase().includes(query.toLowerCase()) || `${o.first_name} ${o.last_name}`.toLowerCase().includes(query.toLowerCase()) || o.phone.includes(query) || o.email.toLowerCase().includes(query.toLowerCase());
    const matchS = !statusFilter || o.status === statusFilter;
    return matchQ && matchS;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
    revenue: orders.filter((o) => ["paid", "shipped", "delivered"].includes(o.status)).reduce((s, o) => s + Number(o.total), 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          <Link to="/admin" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap"><Package className="h-4 w-4" /> პროდუქტები</Link>
          <Link to="/admin/dashboard" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap"><BarChart3 className="h-4 w-4" /> დაშბორდი</Link>
                    <Link to="/admin/users" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap"><UsersIcon className="h-4 w-4" /> მომხმარებლები</Link>
          <span className="px-4 py-2.5 text-sm font-semibold text-primary border-b-2 border-primary flex items-center gap-2 whitespace-nowrap -mb-px"><ShoppingBag className="h-4 w-4" /> შეკვეთები</span>
          <Link to="/admin/shipping" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap"><Truck className="h-4 w-4" /> მიწოდება</Link>
          <Link to="/admin/reviews" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap"><MessageSquare className="h-4 w-4" /> მიმოხილვები</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
          {[
            { label: "სულ", value: stats.total, cls: "bg-primary/10 text-primary" },
            { label: "მოლოდინში", value: stats.pending, cls: "bg-yellow-500/10 text-yellow-600" },
            { label: "გადახდილი", value: stats.paid, cls: "bg-green-500/10 text-green-600" },
            { label: "შემოსავალი ₾", value: stats.revenue.toFixed(0), cls: "bg-emerald-500/10 text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-3 sm:p-5">
              <p className={`text-lg sm:text-2xl font-bold ${s.cls.split(" ")[1]}`}>{s.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="შეკვეთა, სახელი, ტელეფონი..." className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:min-w-[180px] rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none pr-10">
              <option value="">ყველა სტატუსი</option>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">იტვირთება...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">შეკვეთები არ მოიძებნა</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {filtered.map((o) => {
                const s = statusOf(o.status);
                return (
                  <button key={o.id} onClick={() => openOrder(o)} className="w-full p-4 hover:bg-secondary/50 transition-colors flex items-center gap-4 text-left">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm text-foreground">#{o.order_number}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>
                      </div>
                      <p className="text-sm text-foreground truncate">{o.first_name} {o.last_name} · {o.phone}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.city} · {new Date(o.created_at).toLocaleString("ka-GE")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary text-base">{Number(o.total).toFixed(0)} ₾</p>
                      <Eye className="h-4 w-4 text-muted-foreground inline-block mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelected(null)}>
          <div className="bg-card w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">#{selected.order_number}</h3>
                <p className="text-xs text-muted-foreground">{new Date(selected.created_at).toLocaleString("ka-GE")}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-secondary rounded-lg"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* Status */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">სტატუსი</label>
                <div className="flex gap-2 flex-wrap">
                  {STATUSES.map((s) => (
                    <button key={s.id} onClick={() => updateStatus(s.id)} disabled={updating} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${selected.status === s.id ? s.color + " font-semibold" : "border-border text-muted-foreground hover:bg-secondary"}`}>{s.label}</button>
                  ))}
                </div>
              </div>
              {/* Customer */}
              <div className="bg-secondary/30 rounded-xl p-4 text-sm space-y-1">
                <p><span className="text-muted-foreground">სახელი:</span> <strong>{selected.first_name} {selected.last_name}</strong></p>
                <p><span className="text-muted-foreground">ტელეფონი:</span> <strong>{selected.phone}</strong></p>
                <p><span className="text-muted-foreground">ელ-ფოსტა:</span> <strong>{selected.email}</strong></p>
                <p><span className="text-muted-foreground">მისამართი:</span> <strong>{selected.city}, {selected.address}</strong></p>
                {selected.note && <p><span className="text-muted-foreground">შენიშვნა:</span> {selected.note}</p>}
                <p><span className="text-muted-foreground">გადახდა:</span> <strong>{selected.payment_method}</strong></p>
              </div>
              {/* Items */}
              <div>
                <h4 className="text-sm font-semibold mb-2">პროდუქტები</h4>
                <div className="space-y-2">
                  {items.map((it) => (
                    <div key={it.id} className="flex gap-3 items-center bg-secondary/30 rounded-lg p-2">
                      {it.product_image && <img src={it.product_image} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{it.product_name}</p>
                        <p className="text-xs text-muted-foreground">{it.quantity} × {Number(it.unit_price).toFixed(0)} ₾</p>
                      </div>
                      <p className="text-sm font-semibold">{(it.quantity * Number(it.unit_price)).toFixed(0)} ₾</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Totals */}
              <div className="border-t border-border pt-4 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>ქვეჯამი</span><span>{Number(selected.subtotal).toFixed(0)} ₾</span></div>
                <div className="flex justify-between text-muted-foreground"><span>მიწოდება</span><span>{Number(selected.shipping_fee).toFixed(0)} ₾</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border"><span>სულ</span><span className="text-primary">{Number(selected.total).toFixed(0)} ₾</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default AdminOrders;
