import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Package, Users as UsersIcon, Truck, ShoppingBag, Plus, Trash2, Save, ArrowLeft, XCircle, BarChart3 } from "lucide-react";

type Zone = {
  id: string;
  name_ka: string;
  name_en: string;
  fee: number;
  free_threshold: number | null;
  sort_order: number;
  is_active: boolean;
};

const emptyZone = (): Partial<Zone> => ({ name_ka: "", name_en: "", fee: 0, free_threshold: 100, sort_order: 0, is_active: true });

const AdminShipping = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Partial<Zone> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); setChecking(false); });
  }, [user, authLoading]);

  useEffect(() => { if (isAdmin) fetchZones(); }, [isAdmin]);

  const fetchZones = async () => {
    setLoading(true);
    const { data } = await supabase.from("shipping_zones").select("*").order("sort_order", { ascending: true });
    setZones(data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!draft?.name_ka) { toast.error("ქართული სახელი სავალდებულოა"); return; }
    setSaving(true);
    const payload = {
      name_ka: draft.name_ka || "",
      name_en: draft.name_en || draft.name_ka || "",
      fee: Number(draft.fee) || 0,
      free_threshold: draft.free_threshold === null || draft.free_threshold === undefined ? null : Number(draft.free_threshold),
      sort_order: Number(draft.sort_order) || 0,
      is_active: draft.is_active ?? true,
    };
    const { error } = draft.id
      ? await supabase.from("shipping_zones").update(payload).eq("id", draft.id)
      : await supabase.from("shipping_zones").insert(payload);
    if (error) toast.error("შენახვა ვერ მოხერხდა: " + error.message);
    else { toast.success("ზონა შენახულია"); setDraft(null); fetchZones(); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("გავაუქმოთ ეს ზონა?")) return;
    const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
    if (error) toast.error("წაშლა ვერ მოხერხდა");
    else { toast.success("წაიშალა"); fetchZones(); }
  };

  if (authLoading || checking) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <XCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-3">წვდომა შეზღუდულია</h1>
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-medium"><ArrowLeft className="h-4 w-4" /> მთავარ გვერდზე</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          <Link to="/admin" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><Package className="h-4 w-4" /> პროდუქტები</Link>
          <Link to="/admin/dashboard" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 whitespace-nowrap"><BarChart3 className="h-4 w-4" /> დაშბორდი</Link>
                    <Link to="/admin/users" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><UsersIcon className="h-4 w-4" /> მომხმარებლები</Link>
          <Link to="/admin/orders" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><ShoppingBag className="h-4 w-4" /> შეკვეთები</Link>
          <span className="px-4 py-2.5 text-sm font-semibold text-primary border-b-2 border-primary flex items-center gap-2 whitespace-nowrap -mb-px"><Truck className="h-4 w-4" /> მიწოდება</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">🚚 მიწოდების ზონები</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">ფასები ქალაქ/რეგიონების მიხედვით</p>
          </div>
          <button onClick={() => setDraft(emptyZone())} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90"><Plus className="h-4 w-4" /> დამატება</button>
        </div>

        {loading ? <div className="text-center py-10 text-muted-foreground">იტვირთება...</div> : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border">
            {zones.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">ზონები ჯერ არ არის</div>}
            {zones.map((z) => (
              <div key={z.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{z.name_ka} <span className="text-muted-foreground font-normal">/ {z.name_en}</span></p>
                  <p className="text-xs text-muted-foreground">
                    ფასი: <strong>{Number(z.fee).toFixed(0)} ₾</strong>
                    {z.free_threshold && <> · უფასო {Number(z.free_threshold).toFixed(0)} ₾-ზე ზემოთ</>}
                    {!z.is_active && <span className="text-destructive ml-2">გათიშული</span>}
                  </p>
                </div>
                <button onClick={() => setDraft(z)} className="text-xs text-primary hover:underline">რედაქტ.</button>
                <button onClick={() => remove(z.id)} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="h-4 w-4 text-destructive" /></button>
              </div>
            ))}
          </div>
        )}

        {draft && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDraft(null)}>
            <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold">{draft.id ? "ზონის რედაქტირება" : "ახალი ზონა"}</h3>
              <div>
                <label className="block text-xs font-medium mb-1.5">სახელი (ქართ.) *</label>
                <input value={draft.name_ka || ""} onChange={(e) => setDraft({ ...draft, name_ka: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">სახელი (ინგ.)</label>
                <input value={draft.name_en || ""} onChange={(e) => setDraft({ ...draft, name_en: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5">ფასი (₾)</label>
                  <input type="number" min={0} value={draft.fee ?? 0} onChange={(e) => setDraft({ ...draft, fee: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">უფასო ზღვარი</label>
                  <input type="number" min={0} placeholder="არცერთი = ცარიელი" value={draft.free_threshold ?? ""} onChange={(e) => setDraft({ ...draft, free_threshold: e.target.value === "" ? null : Number(e.target.value) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5">თანმიმდევრობა</label>
                  <input type="number" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <label className="flex items-end gap-2 pb-2 cursor-pointer">
                  <input type="checkbox" checked={draft.is_active ?? true} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="h-4 w-4 accent-primary" />
                  <span className="text-sm">აქტიური</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDraft(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium">გაუქმება</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? "ინახება..." : "შენახვა"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminShipping;