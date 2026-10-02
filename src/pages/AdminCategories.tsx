import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminExtraNav from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Category, useSiteSettings } from "@/context/SiteSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/uploadImage";
import { toast } from "sonner";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `cat-${Date.now().toString(36)}`;

const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const AdminCategories = () => {
  const { isAdmin, checking } = useIsAdmin();
  const { categories, refresh } = useSiteSettings();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!editing?.name_ka?.trim() || !editing?.name_en?.trim()) {
      toast.error("შეავსეთ სახელი ქართულად და ინგლისურად");
      return;
    }
    setBusy(true);
    const payload = {
      name_ka: editing.name_ka.trim(),
      name_en: editing.name_en.trim(),
      image_url: editing.image_url || null,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert({
          ...payload,
          slug: editing.slug?.trim() || slugify(editing.name_en),
          sort_order: (categories.at(-1)?.sort_order ?? 0) + 1,
        });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("შენახულია");
    setEditing(null);
    refresh();
  };

  const remove = async (c: Category) => {
    const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category", c.slug);
    const msg = count ? `ამ კატეგორიაში ${count} პროდუქტია. მაინც წავშალოთ?` : `წავშალოთ "${c.name_ka}"?`;
    if (!confirm(msg)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("წაიშალა");
    refresh();
  };

  const move = async (i: number, dir: -1 | 1) => {
    const a = categories[i], b = categories[i + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    refresh();
  };

  const toggle = async (c: Category) => {
    await supabase.from("categories").update({ is_active: !c.is_active }).eq("id", c.id);
    refresh();
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      setBusy(true);
      const url = await uploadImage(f, "categories");
      setEditing((e) => ({ ...e, image_url: url }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">წვდომა აკრძალულია</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">
        <AdminExtraNav />
        <div className="flex items-center justify-between mb-4 gap-3">
          <h1 className="text-2xl font-bold text-foreground">კატეგორიები</h1>
          <Button onClick={() => setEditing({ is_active: true })}><Plus /> ახალი კატეგორია</Button>
        </div>

        {editing && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">{editing.id ? "რედაქტირება" : "ახალი კატეგორია"}</h2>
              <button onClick={() => setEditing(null)} aria-label="close"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-sm">სახელი (ქართ.)<input className={input} value={editing.name_ka || ""} onChange={(e) => setEditing({ ...editing, name_ka: e.target.value })} /></label>
              <label className="text-sm">Name (English)<input className={input} value={editing.name_en || ""} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} /></label>
              {!editing.id && (
                <label className="text-sm sm:col-span-2">ბმულის სახელი (არასავალდებულო, ლათინურად)
                  <input className={input} value={editing.slug || ""} placeholder="მაგ: wooden-toys" onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
                </label>
              )}
            </div>
            <div className="flex items-center gap-3">
              {editing.image_url && <img src={editing.image_url} alt="" className="h-16 w-16 rounded-md object-cover border border-border" />}
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer rounded-md border border-border px-3 py-2 hover:bg-secondary">
                <ImagePlus className="h-4 w-4" /> სურათის ატვირთვა
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
              {editing.image_url && <button className="text-sm text-destructive" onClick={() => setEditing({ ...editing, image_url: null })}>მოშორება</button>}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> საიტზე ჩანს
            </label>
            <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Save />} შენახვა</Button>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {categories.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <div className="h-12 w-12 rounded-md bg-secondary overflow-hidden shrink-0">
                {c.image_url && <img src={c.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${c.is_active ? "text-foreground" : "text-muted-foreground line-through"}`}>{c.name_ka}</p>
                <p className="text-xs text-muted-foreground truncate">{c.name_en} · {c.slug}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="up"><ArrowUp /></Button>
                <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === categories.length - 1} aria-label="down"><ArrowDown /></Button>
                <Button size="icon" variant="ghost" onClick={() => toggle(c)} aria-label="toggle">{c.is_active ? <Eye /> : <EyeOff />}</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(c)}>შეცვლა</Button>
                <Button size="icon" variant="ghost" onClick={() => remove(c)} aria-label="delete"><Trash2 className="text-destructive" /></Button>
              </div>
            </div>
          ))}
          {categories.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">კატეგორიები არ არის</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminCategories;
