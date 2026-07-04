import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Package, Users as UsersIcon, ShoppingBag, Truck, Tag,
  BarChart3, TrendingUp, DollarSign, AlertTriangle, Loader2
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

type OrderRow = {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  first_name: string;
  last_name: string;
};

type ItemRow = {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  orders: { created_at: string; status: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(45, 90%, 55%)",
  paid: "hsl(140, 60%, 45%)",
  shipped: "hsl(210, 80%, 55%)",
  delivered: "hsl(160, 70%, 40%)",
  cancelled: "hsl(0, 70%, 55%)",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "მოლოდინში",
  paid: "გადახდილი",
  shipped: "გაგზავნილი",
  delivered: "მიწოდებული",
  cancelled: "გაუქმებული",
};

const RANGES = [
  { key: "7", label: "7 დღე" },
  { key: "30", label: "30 დღე" },
  { key: "90", label: "90 დღე" },
  { key: "365", label: "წელი" },
] as const;

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("30");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [lowStock, setLowStock] = useState<{ id: string; name_ka: string; stock_quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user) return setChecking(false);
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
      setChecking(false);
    };
    if (!authLoading) check();
  }, [user, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - Number(range));
      const sinceIso = since.toISOString();

      const [ordersRes, itemsRes, productsRes, lowRes, rolesRes] = await Promise.all([
        supabase.from("orders").select("id, order_number, total, status, created_at, first_name, last_name").gte("created_at", sinceIso).order("created_at", { ascending: true }),
        supabase.from("order_items").select("product_id, product_name, quantity, unit_price, orders!inner(created_at, status)").gte("orders.created_at", sinceIso),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id, name_ka, stock_quantity").lte("stock_quantity", 3).order("stock_quantity", { ascending: true }).limit(8),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }),
      ]);

      setOrders((ordersRes.data as OrderRow[]) || []);
      setItems((itemsRes.data as unknown as ItemRow[]) || []);
      setProductsCount(productsRes.count || 0);
      setLowStock(lowRes.data || []);
      setUsersCount(rolesRes.count || 0);
      setLoading(false);
    };
    load();
  }, [isAdmin, range]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">წვდომა შეზღუდულია</h1>
          <p className="text-muted-foreground">მხოლოდ ადმინისტრატორებისთვის</p>
        </div>
      </div>
    );
  }

  const paidStatuses = ["paid", "shipped", "delivered"];
  const revenue = orders.filter((o) => paidStatuses.includes(o.status)).reduce((s, o) => s + Number(o.total), 0);
  const paidCount = orders.filter((o) => paidStatuses.includes(o.status)).length;
  const avgOrder = paidCount ? revenue / paidCount : 0;

  // Daily revenue series
  const dayMap = new Map<string, { date: string; revenue: number; orders: number }>();
  const days = Number(range);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { date: key.slice(5), revenue: 0, orders: 0 });
  }
  orders.forEach((o) => {
    const key = o.created_at.slice(0, 10);
    const entry = dayMap.get(key);
    if (!entry) return;
    entry.orders += 1;
    if (paidStatuses.includes(o.status)) entry.revenue += Number(o.total);
  });
  const dailySeries = Array.from(dayMap.values());

  // Status pie
  const statusMap = new Map<string, number>();
  orders.forEach((o) => statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1));
  const statusData = Array.from(statusMap.entries()).map(([status, value]) => ({
    name: STATUS_LABELS[status] || status,
    value,
    color: STATUS_COLORS[status] || "hsl(220, 10%, 50%)",
  }));

  // Top products
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
  items.forEach((it) => {
    if (!paidStatuses.includes(it.orders?.status || "")) return;
    const key = it.product_id || it.product_name;
    const cur = productMap.get(key) || { name: it.product_name, qty: 0, revenue: 0 };
    cur.qty += it.quantity;
    cur.revenue += it.quantity * Number(it.unit_price);
    productMap.set(key, cur);
  });
  const topProducts = Array.from(productMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const recentOrders = [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);

  const statCards = [
    { label: "შემოსავალი", value: `${revenue.toFixed(0)} ₾`, icon: DollarSign, cls: "bg-emerald-500/10 text-emerald-600" },
    { label: "შეკვეთები", value: orders.length, icon: ShoppingBag, cls: "bg-primary/10 text-primary" },
    { label: "საშ. ჩეკი", value: `${avgOrder.toFixed(0)} ₾`, icon: TrendingUp, cls: "bg-blue-500/10 text-blue-600" },
    { label: "პროდუქტები", value: productsCount, icon: Package, cls: "bg-orange-500/10 text-orange-600" },
    { label: "მომხმარებლები", value: usersCount, icon: UsersIcon, cls: "bg-purple-500/10 text-purple-600" },
    { label: "დაბალი მარაგი", value: lowStock.length, icon: AlertTriangle, cls: "bg-red-500/10 text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          <span className="px-4 py-2.5 text-sm font-semibold text-primary border-b-2 border-primary flex items-center gap-2 whitespace-nowrap -mb-px"><BarChart3 className="h-4 w-4" /> დაშბორდი</span>
          <Link to="/admin" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><Package className="h-4 w-4" /> პროდუქტები</Link>
          <Link to="/admin/users" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><UsersIcon className="h-4 w-4" /> მომხმარებლები</Link>
          <Link to="/admin/orders" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><ShoppingBag className="h-4 w-4" /> შეკვეთები</Link>
          <Link to="/admin/shipping" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><Truck className="h-4 w-4" /> მიწოდება</Link>
          <Link to="/admin/promo" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><Tag className="h-4 w-4" /> პრომო</Link>
          <Link to="/admin/reviews" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap"><MessageSquare className="h-4 w-4" /> მიმოხილვები</Link>
        </div>

        {/* Range selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold">ანალიტიკა</h1>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${range === r.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {statCards.map((s) => (
                <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.cls}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                  <div className="text-xl font-bold">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Revenue chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
                <h3 className="font-semibold mb-4">შემოსავალი დღეების მიხედვით</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailySeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="შემოსავალი ₾" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="orders" name="შეკვეთები" stroke="hsl(210, 80%, 55%)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status pie */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="font-semibold mb-4">სტატუსების განაწილება</h3>
                {statusData.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-16">მონაცემი არაა</div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                          {statusData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Top products & Low stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="font-semibold mb-4">ტოპ პროდუქტები (რაოდენობით)</h3>
                {topProducts.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-10">გაყიდვები არაა</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis type="category" dataKey="name" width={120} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                        <Bar dataKey="qty" name="ცალი" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> დაბალი მარაგი
                </h3>
                {lowStock.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-10">ყველა პროდუქტს აქვს საკმარისი მარაგი 🎉</div>
                ) : (
                  <div className="space-y-2">
                    {lowStock.map((p) => (
                      <Link key={p.id} to="/admin" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <span className="text-sm font-medium truncate">{p.name_ka}</span>
                        <span className={`text-sm font-bold ${p.stock_quantity === 0 ? "text-red-600" : "text-orange-600"}`}>
                          {p.stock_quantity} ცალი
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent orders */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">ბოლო შეკვეთები</h3>
                <Link to="/admin/orders" className="text-sm text-primary hover:underline">ყველა →</Link>
              </div>
              {recentOrders.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-10">შეკვეთა არაა</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="pb-2 font-medium">ნომერი</th>
                        <th className="pb-2 font-medium">მომხმარებელი</th>
                        <th className="pb-2 font-medium">სტატუსი</th>
                        <th className="pb-2 font-medium text-right">თანხა</th>
                        <th className="pb-2 font-medium text-right">თარიღი</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o) => (
                        <tr key={o.id} className="border-b border-border/50 last:border-0">
                          <td className="py-3 font-mono text-xs">#{o.order_number}</td>
                          <td className="py-3">{o.first_name} {o.last_name}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${STATUS_COLORS[o.status] || "#888"}20`, color: STATUS_COLORS[o.status] || "#888" }}>
                              {STATUS_LABELS[o.status] || o.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-semibold">{Number(o.total).toFixed(0)} ₾</td>
                          <td className="py-3 text-right text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("ka-GE")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
