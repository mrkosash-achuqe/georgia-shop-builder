import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Package, Users as UsersIcon, ShoppingBag, Truck, BarChart3, MessageSquare,
  FileText, Boxes, AlertTriangle, Loader2, Save, Search } from "lucide-react";

type Row = {
  id: string;
  name_ka: string;
  name_en: string | null;
  sku: string | null;
  images: string[] | null;
  in_stock: boolean;
  stock_quantity: number | null;
};

const THRESHOLD_KEY = "achuqe_low_stock_threshold";

const AdminInventory = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [onlyLow, setOnlyLow] = useState(true);
  const [threshold, setThreshold] = useState<number>(() => Number(localStorage.getItem(THRESHOLD_KEY) || 3));
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data); setChecking(false);
    });
  }, [user, authLoading]);

  useEffect(() => { localStorage.setItem(THRESHOLD_KEY, String(threshold)); }, [threshold]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, name_ka, name_en, sku, images, in_stock, stock_quantity")
        .order("stock_quantity", { ascending: true });
      if (error) toast.error("პროდუქტების ჩატვირთვა ვერ მოხერხდა");
      else setRows((data as Row[]) || []);
      setLoading(false);
    };
    load();
  }, [isAdmin]);

  const save = async (row: Row) => {
    const qty = drafts[row.id];
    if (qty === undefined) return;
    setSaving(row.id);
    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: qty, in_stock: qty > 0 })
      .eq("id", row.id);
    if (error) toast.error("შენახვა ვერ მოხერხდა");
    else {
      toast.success("ნაშთი განახლდა");
      setRows((p) => p.map((r) => (r.id === row.id ? { ...r, stock_quantity: qty, in_stock: qty > 0 } : r)));
      setDrafts((d) => { const n = { ...d }; delete n[row.id]; return n; });
    }
    setSaving(null);
  };

  if (authLoading || checking) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">წვდომა შეზღუდულია</h1>
          <p className="text-muted-foreground">მხოლოდ ადმინისტრატორებისთვის</p>
        </div>
        <Footer />
      </div>
    );
  }

  const qty = (r: Row) => Number(r.stock_quantity ?? 0);
  const filtered = rows.filter((r) => {
    const matchQ = !query ||
      r.name_ka?.toLowerCase().includes(query.toLowerCase()) ||
      (r.name_en || "").toLowerCase().includes(query.toLowerCase()) ||
      (r.sku || "").toLowerCase().includes(query.toLowerCase());
    const matchLow = !onlyLow || qty(r) <= threshold;
    return matchQ && matchLow;
  });

  const outCount = rows.filter((r) => qty(r) <= 0).length;
  const lowCount = rows.filter((r) => qty(r) > 0 && qty(r) <= threshold).length;

  const tab = "px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          <Link to="/admin" className={tab}><Package className="h-4 w-4" /> პროდუქტები</Link>
          <Link to="/admin/dashboard" className={tab}><BarChart3 className="h-4 w-4" /> დაშბორდი</Link>
          <Link to="/admin/users" className={tab}><UsersIcon className="h-4 w-4" /> მომხმარებლები</Link>
          <Link to="/admin/orders" className={tab}><ShoppingBag className="h-4 w-4" /> შეკვეთები</Link>
          <Link to="/admin/shipping" className={tab}><Truck className="h-4 w-4" /> მიწოდება</Link>
          <Link to="/admin/reviews" className={tab}><MessageSquare className="h-4 w-4" /> მიმოხილვები</Link>
          <Link to="/admin/blog" className={tab}><FileText className="h-4 w-4" /> ბლოგი</Link>
          <span className="px-4 py-2.5 text-sm font-semibold text-primary border-b-2 border-primary flex items-center gap-2 whitespace-nowrap -mb-px"><Boxes className="h-4 w-4" /> მარაგი</span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-3 sm:p-5">
            <p className="text-lg sm:text-2xl font-bold text-primary">{rows.length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">სულ პროდუქტი</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 sm:p-5">
            <p className="text-lg sm:text-2xl font-bold text-yellow-600">{lowCount}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">მცირე ნაშთი</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 sm:p-5">
            <p className="text-lg sm:text-2xl font-bold text-destructive">{outCount}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">ამოწურული</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="დასახელება ან კოდი..." className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">ზღვარი</span>
            <input type="number" min={0} value={threshold} onChange={(e) => setThreshold(Math.max(0, Number(e.target.value)))} className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
          </div>
          <button onClick={() => setOnlyLow((v) => !v)} className={`rounded-xl border px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${onlyLow ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}>
            მხოლოდ მცირე ნაშთი
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">იტვირთება...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">პროდუქტი არ მოიძებნა</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {filtered.map((r) => {
              const q = drafts[r.id] ?? qty(r);
              const dirty = drafts[r.id] !== undefined && drafts[r.id] !== qty(r);
              const level = qty(r) <= 0 ? "bg-destructive/10 text-destructive" : qty(r) <= threshold ? "bg-yellow-500/10 text-yellow-700" : "bg-green-500/10 text-green-700";
              return (
                <div key={r.id} className="p-3 sm:p-4 flex items-center gap-3">
                  {r.images?.[0] ? (
                    <img src={r.images![0]} alt={r.name_ka} loading="lazy" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-secondary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.name_ka}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.sku ? `#${r.sku}` : "კოდი არ არის"}</p>
                  </div>
                  <span className={`hidden sm:inline text-[11px] px-2 py-1 rounded-full ${level}`}>
                    {qty(r) <= 0 ? "ამოწურული" : qty(r) <= threshold ? "მცირე" : "საკმარისი"}
                  </span>
                  <input
                    type="number" min={0} value={q}
                    onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: Math.max(0, Number(e.target.value)) }))}
                    className="w-20 rounded-lg border border-border bg-background px-2 py-2 text-sm text-center"
                  />
                  <button
                    onClick={() => save(r)} disabled={!dirty || saving === r.id}
                    className="p-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="შენახვა"
                  >
                    {saving === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminInventory;
