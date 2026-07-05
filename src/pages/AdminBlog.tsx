import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  FileText, Package, Users as UsersIcon, ShoppingBag, Truck, MessageSquare,
  BarChart3, Tag, Loader2, Plus, Pencil, Trash2, Eye, EyeOff, XCircle, Upload, X,
} from "lucide-react";

type Post = {
  id: string;
  slug: string;
  title_ka: string;
  title_en: string;
  excerpt_ka: string;
  excerpt_en: string;
  content_ka: string;
  content_en: string;
  cover_image: string | null;
  category: string;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const empty: Partial<Post> = {
  slug: "", title_ka: "", title_en: "", excerpt_ka: "", excerpt_en: "",
  content_ka: "", content_en: "", cover_image: "", category: "general",
  tags: [], seo_title: "", seo_description: "", is_published: false,
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

const AdminBlog = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); setChecking(false); });
  }, [user, authLoading]);

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setPosts(data || []);
    setLoading(false);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title_ka || !editing.slug) {
      toast.error("სათაური და slug აუცილებელია");
      return;
    }
    setSaving(true);
    const payload: any = {
      slug: editing.slug,
      title_ka: editing.title_ka,
      title_en: editing.title_en || "",
      excerpt_ka: editing.excerpt_ka || "",
      excerpt_en: editing.excerpt_en || "",
      content_ka: editing.content_ka || "",
      content_en: editing.content_en || "",
      cover_image: editing.cover_image || null,
      category: editing.category || "general",
      tags: editing.tags || [],
      seo_title: editing.seo_title || null,
      seo_description: editing.seo_description || null,
      is_published: !!editing.is_published,
      published_at: editing.is_published ? (editing.published_at || new Date().toISOString()) : null,
      author_id: user?.id || null,
    };
    const { error } = editing.id
      ? await (supabase as any).from("blog_posts").update(payload).eq("id", editing.id)
      : await (supabase as any).from("blog_posts").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("შენახულია");
    setEditing(null);
    fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm("დარწმუნებული ხართ?")) return;
    const { error } = await (supabase as any).from("blog_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("წაშლილია");
    fetchAll();
  };

  const togglePublish = async (p: Post) => {
    const { error } = await (supabase as any)
      .from("blog_posts")
      .update({
        is_published: !p.is_published,
        published_at: !p.is_published ? new Date().toISOString() : p.published_at,
      })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    fetchAll();
  };

  const uploadCover = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setEditing((e) => ({ ...(e || {}), cover_image: data.publicUrl }));
    setUploading(false);
  };

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
          <Link to="/admin/reviews" className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap"><MessageSquare className="h-4 w-4" /> მიმოხილვები</Link>
          <span className="px-4 py-2.5 text-sm font-semibold text-primary border-b-2 border-primary flex items-center gap-2 whitespace-nowrap -mb-px"><FileText className="h-4 w-4" /> ბლოგი</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">ბლოგის მართვა</h1>
            <p className="text-sm text-muted-foreground">სულ {posts.length} სტატია</p>
          </div>
          <button
            onClick={() => setEditing({ ...empty })}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> ახალი სტატია
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">სტატია არ არის — დაამატეთ პირველი</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {posts.map((p) => (
              <div key={p.id} className="bg-card rounded-2xl border border-border p-4 flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden bg-secondary shrink-0 flex items-center justify-center">
                  {p.cover_image
                    ? <img src={p.cover_image} alt="" className="w-full h-full object-cover" />
                    : <FileText className="h-8 w-8 text-muted-foreground/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-secondary text-muted-foreground">{p.category}</span>
                    {p.is_published ? (
                      <span className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">გამოქვეყნებული</span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">გადადებული</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">/{p.slug}</span>
                  </div>
                  <h3 className="font-semibold text-sm truncate">{p.title_ka}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.excerpt_ka}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => togglePublish(p)} title={p.is_published ? "დამალვა" : "გამოქვეყნება"} className="p-2 rounded-lg bg-secondary hover:bg-secondary/70">
                    {p.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setEditing(p)} className="p-2 rounded-lg bg-secondary hover:bg-secondary/70">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(p.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing.id ? "სტატიის რედაქტირება" : "ახალი სტატია"}</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-secondary rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">სათაური (KA) *</label>
                  <input
                    value={editing.title_ka || ""}
                    onChange={(e) => setEditing({
                      ...editing,
                      title_ka: e.target.value,
                      slug: editing.slug && editing.id ? editing.slug : slugify(e.target.value),
                    })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Title (EN)</label>
                  <input value={editing.title_en || ""} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Slug *</label>
                  <input value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">კატეგორია</label>
                  <input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">ტეგები (მძიმეებით)</label>
                <input
                  value={(editing.tags || []).join(", ")}
                  onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">ქავერ სურათი</label>
                <div className="mt-1 flex items-center gap-3">
                  {editing.cover_image && (
                    <img src={editing.cover_image} alt="" className="w-20 h-14 rounded-lg object-cover border border-border" />
                  )}
                  <label className="cursor-pointer px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/70 text-xs inline-flex items-center gap-2">
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    ატვირთვა
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
                  </label>
                  {editing.cover_image && (
                    <button onClick={() => setEditing({ ...editing, cover_image: "" })} className="text-xs text-destructive">წაშლა</button>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">მოკლე აღწერა (KA)</label>
                  <textarea rows={2} value={editing.excerpt_ka || ""} onChange={(e) => setEditing({ ...editing, excerpt_ka: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Excerpt (EN)</label>
                  <textarea rows={2} value={editing.excerpt_en || ""} onChange={(e) => setEditing({ ...editing, excerpt_en: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">კონტენტი (KA) — მარკდაუნი/ტექსტი</label>
                <textarea rows={8} value={editing.content_ka || ""} onChange={(e) => setEditing({ ...editing, content_ka: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Content (EN)</label>
                <textarea rows={8} value={editing.content_en || ""} onChange={(e) => setEditing({ ...editing, content_en: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono" />
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SEO</p>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">SEO Title</label>
                  <input value={editing.seo_title || ""} onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">SEO Description</label>
                  <textarea rows={2} value={editing.seo_description || ""} onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!editing.is_published} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} className="h-4 w-4" />
                <span className="text-sm">გამოქვეყნებული</span>
              </label>
            </div>
            <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg text-sm bg-secondary hover:bg-secondary/70">გაუქმება</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground inline-flex items-center gap-2 disabled:opacity-50">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                შენახვა
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminBlog;