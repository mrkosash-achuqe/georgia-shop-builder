import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Plus, Pencil, Trash2, Save, ArrowLeft, Tag, Percent, X,
  Package, Users as UsersIcon, ShoppingBag, Truck, CheckCircle2, XCircle, AlertTriangle,, BarChart3 } from "lucide-react";

type PromoCode = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

const empty: Partial<PromoCode> = {
  code: "",
  discount_type: "percent",
  discount_value: 10,
  min_order_amount: 0,
  max_uses: null,
  starts_at: null,
  expires_at: null,
  is_active: true,
};

const AdminPromoCodes = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PromoCode> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); setChecking(false); });
  }, [user, authLoading]);

  useEffect(() => { if (isAdmin) fetchCodes(); }, [isAdmin]);

  const fetchCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    if (error) toast.error("ჩატვირთვა ვერ მოხერხდა");
    else setCodes((data || []) as PromoCode[]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editing?.code?.trim()) { toast.error("კოდი სავალდებულოა"); return; }
    if (!editing.discount_value || Number(editing.discount_value) <= 0) { toast.error("ფასდაკლება უნდა იყოს 0-ზე მეტი"); return; }
    if (editing.discount_type === "percent" && Number(editing.discount_value) > 100) { toast.error("პროცენტი არ შეიძლება იყოს 100-ზე მეტი"); return; }
    setSaving(true);
    const payload = {
      code: editing.code.trim().toUpperCase(),
      discount_type: editing.discount_type || "percent",
      discount_value: Number(editing.discount_value),
      min_order_amount: Number(editing.min_order_amount || 0),
      max_uses: editing.max_uses ? Number(editing.max_uses) : null,
      starts_at: editing.starts_at || null,
      expires_at: editing.expires_at || null,
      is_active: editing.is_active ?? true,
    };
    if (isNew) {
      const { error } = await supabase.from("promo_codes").insert(payload);
      if (error) toast.error("დამატება ვერ მოხერხდა: " + error.message);
      else { toast.success("✅ პრომო კოდი დაემატა"); setEditing(null); setIsNew(false); fetchCodes(); }
    } else {
      const { error } = await supabase.from("promo_codes").update(payload).eq("id", editing.id!);
      if (error) toast.error("განახლება ვერ მოხერხდა: " + error.message);
      else { toast.success("✅ განახლდა"); setEditing(null); fetchCodes(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) toast.error("წაშლა ვერ მოხერხდა");
    else { toast.success("წაიშალა"); setDeleteId(null); fetchCodes(); }
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-3">წვდომა შეზღუდულია</h1>
          <Link to="/" className="text-primary hover:underline">მთავარზე</Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <button onClick={() => { setEditing(null); setIsNew(false); }} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> უკან
          </button>
          <h1 className="text-2xl font-bold mb-6">{isNew ? "🎟️ ახალი პრომო კოდი" : "✏️ რედაქტირება"}</h1>

          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">კოდი *</label>
                <input
                  value={editing.code || ""}
                  onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER2026"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">სტატუსი</label>
                <label className="flex items-center gap-3 cursor-pointer h-[46px]">
                  <div className={`relative w-12 h-7 rounded-full transition-colors ${editing.is_active ? "bg-green-500" : "bg-muted"}`}>
                    <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${editing.is_active ? "translate-x-5" : ""}`} />
                  </div>
                  <input type="checkbox" checked={editing.is_active ?? true} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} className="sr-only" />
                  <span className="text-sm">{editing.is_active ? "აქტიური" : "გათიშული"}</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">ფასდაკლების ტიპი</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setEditing({ ...editing, discount_type: "percent" })}
                    className={`p-3 rounded-xl border-2 text-sm font-medium flex items-center justify-center gap-2 ${editing.discount_type === "percent" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                    <Percent className="h-4 w-4" /> პროცენტი
                  </button>
                  <button type="button" onClick={() => setEditing({ ...editing, discount_type: "fixed" })}
                    className={`p-3 rounded-xl border-2 text-sm font-medium ${editing.discount_type === "fixed" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                    ₾ ფიქსირებული
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  ფასდაკლების მნიშვნელობა * {editing.discount_type === "percent" ? "(%)" : "(₾)"}
                </label>
                <input type="number" value={editing.discount_value || ""} onChange={e => setEditing({ ...editing, discount_value: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" min={0} step="0.01" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">მინ. შეკვეთის თანხა (₾)</label>
                <input type="number" value={editing.min_order_amount ?? 0} onChange={e => setEditing({ ...editing, min_order_amount: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" min={0} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">მაქს. გამოყენება (ცარიელი = ულიმიტო)</label>
                <input type="number" value={editing.max_uses ?? ""} onChange={e => setEditing({ ...editing, max_uses: e.target.value ? Number(e.target.value) : null })}
                  placeholder="ულიმიტო"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" min={1} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">დაწყების თარიღი</label>
                <input type="datetime-local" value={editing.starts_at ? editing.starts_at.slice(0, 16) : ""} onChange={e => setEditing({ ...editing, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">დასრულების თარიღი</label>
                <input type="datetime-local" value={editing.expires_at ? editing.expires_at.slice(0, 16) : ""} onChange={e => setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="px-6 py-3 border border-border rounded-xl text-sm font-medium hover:bg-secondary">გაუქმება</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/25">
                <Save className="h-4 w-4" /> {saving ? "..." : "შენახვა"}
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const now = new Date();
  const stats = {
    total: codes.length,
    active: codes.filter(c => c.is_active && (!c.expires_at || new Date(c.expires_at) > now)).length,
    used: codes.reduce((acc, c) => acc + (c.used_count || 0), 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-7 w-7 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">წაშლის დადასტურება</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">დარწმუნებული ხართ?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary">გაუქმება</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium">წაშლა</button>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          <Link to="/admin" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap">
            <Package className="h-4 w-4" /> პროდუქტები
          </Link>
          <Link to="/admin/dashboard" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap"><BarChart3 className="h-4 w-4" /> დაშბორდი</Link>
                    <Link to="/admin/users" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap">
            <UsersIcon className="h-4 w-4" /> მომხმარებლები
          </Link>
          <Link to="/admin/orders" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap">
            <ShoppingBag className="h-4 w-4" /> შეკვეთები
          </Link>
          <Link to="/admin/shipping" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap">
            <Truck className="h-4 w-4" /> მიწოდება
          </Link>
          <span className="px-4 py-2.5 text-sm font-semibold text-primary border-b-2 border-primary flex items-center gap-2 whitespace-nowrap -mb-px">
            <Tag className="h-4 w-4" /> პრომო კოდები
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">სულ</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground">აქტიური</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-2xl font-bold">{stats.used}</p>
            <p className="text-xs text-muted-foreground">სულ გამოყენება</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">🎟️ პრომო კოდები</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">შექმენით და მართეთ ფასდაკლების კოდები</p>
          </div>
          <button onClick={() => { setEditing({ ...empty }); setIsNew(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 shadow-lg shadow-primary/25">
            <Plus className="h-5 w-5" /> ახალი კოდი
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : codes.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">ჯერ არ გაქვთ პრომო კოდები</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {codes.map(c => {
                const expired = c.expires_at && new Date(c.expires_at) < now;
                const exhausted = c.max_uses !== null && c.used_count >= c.max_uses;
                const active = c.is_active && !expired && !exhausted;
                return (
                  <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Tag className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-foreground">{c.code}</span>
                        {active ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">აქტიური</span>
                          : expired ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">ვადაგასული</span>
                          : exhausted ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">ამოწურული</span>
                          : <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">გათიშული</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.discount_type === "percent" ? `${c.discount_value}% ფასდაკლება` : `${c.discount_value}₾ ფასდაკლება`}
                        {c.min_order_amount > 0 && ` · მინ. ${c.min_order_amount}₾`}
                        {` · ${c.used_count}${c.max_uses ? `/${c.max_uses}` : ""} გამოყენება`}
                        {c.expires_at && ` · ${new Date(c.expires_at).toLocaleDateString("ka-GE")}-მდე`}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditing(c); setIsNew(false); }} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="რედაქტირება">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors" title="წაშლა">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminPromoCodes;