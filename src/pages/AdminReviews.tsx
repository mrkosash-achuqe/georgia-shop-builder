import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Star, CheckCircle2, XCircle, Trash2, Package, Users as UsersIcon,
  ShoppingBag, Truck, MessageSquare, AlertTriangle, BarChart3, Tag, Loader2,
} from "lucide-react";

type ReviewRow = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  photo_urls: string[];
  is_approved: boolean;
  is_verified_purchase: boolean;
  created_at: string;
  product_name?: string;
  author_name?: string | null;
  author_email?: string | null;
};

const AdminReviews = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); setChecking(false); });
  }, [user, authLoading]);

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("product_reviews")
      .select("*")
      .order("created_at", { ascending: false });
    const rows: ReviewRow[] = data || [];
    const pids = Array.from(new Set(rows.map((r) => r.product_id)));
    const uids = Array.from(new Set(rows.map((r) => r.user_id)));
    const [{ data: prods }, { data: profs }] = await Promise.all([
      pids.length
        ? supabase.from("products").select("id, name_ka").in("id", pids)
        : Promise.resolve({ data: [] as any[] }),
      uids.length
        ? supabase.from("profiles").select("id, full_name").in("id", uids)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const pMap: Record<string, string> = {};
    (prods || []).forEach((p: any) => (pMap[p.id] = p.name_ka));
    const uMap: Record<string, string> = {};
    (profs || []).forEach((p: any) => (uMap[p.id] = p.full_name));
    setReviews(rows.map((r) => ({
      ...r,
      product_name: pMap[r.product_id] || "—",
      author_name: uMap[r.user_id] || null,
    })));
    setLoading(false);
  };

  const toggleApproval = async (r: ReviewRow) => {
    const { error } = await (supabase as any)
      .from("product_reviews")
      .update({ is_approved: !r.is_approved })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("✅");
    fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm("დარწმუნებული ხართ?")) return;
    const { error } = await (supabase as any).from("product_reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("წაშლილია");
    fetchAll();
  };

  const filtered = reviews.filter((r) =>
    filter === "all" ? true : filter === "pending" ? !r.is_approved : r.is_approved
  );

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">წვდომა შეზღუდულია</h1>
          <Link to="/" className="text-primary hover:underline">მთავარზე დაბრუნება</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => !r.is_approved).length,
    avg: reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          <Link to="/admin/dashboard" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><BarChart3 className="h-4 w-4" /> დაშბორდი</Link>
          <Link to="/admin" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><Package className="h-4 w-4" /> პროდუქტები</Link>
          <Link to="/admin/users" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><UsersIcon className="h-4 w-4" /> მომხმარებლები</Link>
          <Link to="/admin/orders" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><ShoppingBag className="h-4 w-4" /> შეკვეთები</Link>
          <Link to="/admin/shipping" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><Truck className="h-4 w-4" /> მიწოდება</Link>
          <Link to="/admin/promo" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><Tag className="h-4 w-4" /> პრომო</Link>
          <span className="px-4 py-2.5 text-sm font-semibold text-primary border-b-2 border-primary flex items-center gap-2 whitespace-nowrap -mb-px"><MessageSquare className="h-4 w-4" /> მიმოხილვები</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground">სულ</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground">მოლოდინში</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground">საშ. რეიტინგი</p>
            <p className="text-2xl font-bold flex items-center gap-1">{stats.avg} <Star className="h-5 w-5 fill-star text-star" /></p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/70"
              }`}
            >
              {f === "all" ? "ყველა" : f === "pending" ? "მოლოდინში" : "დამტკიცებული"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">მიმოხილვები არ არის</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-card rounded-2xl border border-border p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link to={`/product/${r.product_id}`} className="font-semibold text-sm text-primary hover:underline truncate">{r.product_name}</Link>
                      {r.is_approved ? (
                        <span className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">დამტკიცებული</span>
                      ) : (
                        <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">მოლოდინში</span>
                      )}
                      {r.is_verified_purchase && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">დადასტურებული</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-star text-star" : "text-border"}`} />
                        ))}
                      </div>
                      <span>·</span>
                      <span>{r.author_name || "მომხმარებელი"}</span>
                      <span>·</span>
                      <span>{new Date(r.created_at).toLocaleDateString("ka-GE")}</span>
                    </div>
                    {r.title && <h4 className="font-semibold text-sm">{r.title}</h4>}
                    {r.comment && <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{r.comment}</p>}
                    {r.photo_urls?.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {r.photo_urls.map((u, i) => (
                          <a key={i} href={u} target="_blank" rel="noreferrer">
                            <img src={u} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => toggleApproval(r)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 ${
                        r.is_approved
                          ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                          : "bg-green-500/10 text-green-700 hover:bg-green-500/20"
                      }`}
                    >
                      {r.is_approved ? <><AlertTriangle className="h-3.5 w-3.5" /> დამალვა</> : <><CheckCircle2 className="h-3.5 w-3.5" /> დამტკიცება</>}
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> წაშლა
                    </button>
                  </div>
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

export default AdminReviews;