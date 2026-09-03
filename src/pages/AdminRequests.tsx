import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Package, Users as UsersIcon, ShoppingBag, Truck, Tag, BarChart3,
  MessageSquare, FileText, Boxes, Loader2, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

type RequestRow = {
  id: string;
  order_id: string;
  user_id: string | null;
  email: string | null;
  type: "cancel" | "return";
  reason: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
  order_number?: string;
  order_total?: number;
  order_status?: string;
};

const TYPE_LABEL: Record<string, string> = { cancel: "გაუქმება", return: "დაბრუნება" };
const STATUS_LABEL: Record<string, string> = { pending: "მოლოდინში", approved: "დამტკიცებული", rejected: "უარყოფილი" };
const STATUS_CLS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  approved: "bg-green-500/10 text-green-700 border-green-500/30",
  rejected: "bg-red-500/10 text-red-700 border-red-500/30",
};

const AdminRequests = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => { setIsAdmin(!!data); setChecking(false); });
  }, [user, authLoading]);

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("order_requests").select("*").order("created_at", { ascending: false });
    const list: RequestRow[] = data || [];
    const ids = Array.from(new Set(list.map((r) => r.order_id)));
    if (ids.length) {
      const { data: orders } = await supabase.from("orders")
        .select("id, order_number, total, status").in("id", ids);
      const map = new Map((orders || []).map((o) => [o.id, o]));
      list.forEach((r) => {
        const o = map.get(r.order_id);
        r.order_number = o?.order_number;
        r.order_total = o ? Number(o.total) : undefined;
        r.order_status = o?.status;
      });
    }
    setRows(list);
    setLoading(false);
  };

  const decide = async (row: RequestRow, status: "approved" | "rejected") => {
    setBusy(row.id);
    const note = window.prompt("კომენტარი მომხმარებლისთვის (არასავალდებულო)") || null;
    const { error } = await (supabase as any)
      .from("order_requests").update({ status, admin_note: note }).eq("id", row.id);
    if (error) { toast.error(error.message); setBusy(null); return; }

    if (status === "approved" && row.type === "cancel") {
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", row.order_id);
    }
    toast.success(status === "approved" ? "✅ დამტკიცდა" : "უარყოფილია");
    setBusy(null);
    fetchAll();
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
      </div>
    );
  }

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          <Link to="/admin/dashboard" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><BarChart3 className="h-4 w-4" /> დაშბორდი</Link>
          <Link to="/admin" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><Package className="h-4 w-4" /> პროდუქტები</Link>
          <Link to="/admin/users" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><UsersIcon className="h-4 w-4" /> მომხმარებლები</Link>
          <Link to="/admin/orders" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><ShoppingBag className="h-4 w-4" /> შეკვეთები</Link>
          <span className="px-4 py-2.5 text-sm font-semibold text-primary border-b-2 border-primary flex items-center gap-2 whitespace-nowrap -mb-px"><RotateCcw className="h-4 w-4" /> მოთხოვნები{pendingCount ? ` (${pendingCount})` : ""}</span>
          <Link to="/admin/shipping" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><Truck className="h-4 w-4" /> მიწოდება</Link>
          <Link to="/admin/promo" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><Tag className="h-4 w-4" /> პრომო</Link>
          <Link to="/admin/reviews" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><MessageSquare className="h-4 w-4" /> მიმოხილვები</Link>
          <Link to="/admin/blog" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><FileText className="h-4 w-4" /> ბლოგი</Link>
          <Link to="/admin/inventory" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><Boxes className="h-4 w-4" /> მარაგი</Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h1 className="text-2xl font-bold">გაუქმება / დაბრუნება</h1>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(["all", "pending", "approved", "rejected"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {f === "all" ? "ყველა" : STATUS_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <RotateCcw className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">მოთხოვნები არ არის</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-semibold">#{r.order_number || "—"}</span>
                      <span className="px-2 py-0.5 text-xs rounded-full border border-border bg-secondary">{TYPE_LABEL[r.type]}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${STATUS_CLS[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{r.reason}</p>
                    {r.admin_note && <p className="text-xs text-muted-foreground mt-1">პასუხი: {r.admin_note}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.email || "—"} · {new Date(r.created_at).toLocaleString("ka-GE")}
                      {r.order_total != null && ` · ${r.order_total.toFixed(2)} ₾`}
                    </p>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <button disabled={busy === r.id} onClick={() => decide(r, "approved")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
                        <CheckCircle2 className="h-4 w-4" /> დამტკიცება
                      </button>
                      <button disabled={busy === r.id} onClick={() => decide(r, "rejected")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                        <XCircle className="h-4 w-4" /> უარყოფა
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminRequests;
