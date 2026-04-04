import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Plus, Pencil, Trash2, Upload, X, Save, ArrowLeft,
  Image as ImageIcon, Package, Search, Filter, Eye, ChevronDown,
  LayoutGrid, List, AlertTriangle, CheckCircle2, XCircle
} from "lucide-react";
import { Link } from "react-router-dom";

type DBProduct = {
  id: string;
  name_ka: string;
  name_en: string;
  desc_ka: string;
  desc_en: string;
  price: number;
  category: string;
  material: string;
  dimensions: string;
  images: string[];
  rating: number;
  reviews_count: number;
  in_stock: boolean;
  created_at: string;
};

const emptyProduct = {
  name_ka: "",
  name_en: "",
  desc_ka: "",
  desc_en: "",
  price: 0,
  category: "",
  material: "",
  dimensions: "",
  images: [] as string[],
  in_stock: true,
};

const categoryLabels: Record<string, { ka: string; en: string }> = {
  clocks: { ka: "საათები", en: "Clocks" },
  "cutting-boards": { ka: "საჭრელი დაფები", en: "Cutting Boards" },
  "cutting-board-sets": { ka: "დაფების ნაკრები", en: "Board Sets" },
  "gift-boxes": { ka: "საჩუქრის ყუთები", en: "Gift Boxes" },
  "photo-frames": { ka: "ფოტო ჩარჩოები", en: "Photo Frames" },
  "candle-holders": { ka: "სანთლის სადგრები", en: "Candle Holders" },
  kids: { ka: "საბავშვო", en: "Kids" },
  corporate: { ka: "კორპორატიული", en: "Corporate" },
  other: { ka: "სხვა", en: "Other" },
};

const categories = Object.keys(categoryLabels);

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<DBProduct> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    const checkRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
      setChecking(false);
    };
    checkRole();
  }, [user, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchProducts();
  }, [isAdmin]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("პროდუქტების ჩატვირთვა ვერ მოხერხდა");
    } else {
      setProducts(data || []);
    }
    setLoadingProducts(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingImage(true);
    const files = Array.from(e.target.files);

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) {
        toast.error(`სურათის ატვირთვა ვერ მოხერხდა: ${file.name}`);
        continue;
      }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setEditingProduct(prev => ({
        ...prev,
        images: [...(prev?.images || []), urlData.publicUrl],
      }));
    }
    setUploadingImage(false);
    toast.success(`${files.length} სურათი აიტვირთა`);
  };

  const removeImage = (index: number) => {
    setEditingProduct(prev => ({
      ...prev,
      images: (prev?.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!editingProduct?.name_ka) {
      toast.error("სახელი (ქართული) სავალდებულოა");
      return;
    }
    if (!editingProduct?.price || editingProduct.price <= 0) {
      toast.error("ფასი უნდა იყოს 0-ზე მეტი");
      return;
    }
    setSaving(true);
    const payload = {
      name_ka: editingProduct.name_ka || "",
      name_en: editingProduct.name_en || "",
      desc_ka: editingProduct.desc_ka || "",
      desc_en: editingProduct.desc_en || "",
      price: Number(editingProduct.price) || 0,
      category: editingProduct.category || "",
      material: editingProduct.material || "",
      dimensions: editingProduct.dimensions || "",
      images: editingProduct.images || [],
      in_stock: editingProduct.in_stock ?? true,
    };

    if (isNew) {
      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        toast.error("დამატება ვერ მოხერხდა: " + error.message);
      } else {
        toast.success("✅ პროდუქტი წარმატებით დაემატა!");
        setEditingProduct(null);
        setIsNew(false);
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id!);
      if (error) {
        toast.error("განახლება ვერ მოხერხდა: " + error.message);
      } else {
        toast.success("✅ პროდუქტი განახლდა!");
        setEditingProduct(null);
        fetchProducts();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("წაშლა ვერ მოხერხდა");
    } else {
      toast.success("პროდუქტი წაიშალა");
      setDeleteConfirmId(null);
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery ||
      p.name_ka.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name_en.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.in_stock).length,
    outOfStock: products.filter(p => !p.in_stock).length,
  };

  // Loading
  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">იტვირთება...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">ავტორიზაცია საჭიროა</h1>
          <p className="text-muted-foreground mb-6">ამ გვერდზე წვდომისთვის გაიარეთ ავტორიზაცია.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
            <ArrowLeft className="h-4 w-4" /> მთავარ გვერდზე
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">წვდომა შეზღუდულია</h1>
          <p className="text-muted-foreground mb-6">ეს გვერდი მხოლოდ ადმინისტრატორებისთვისაა.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
            <ArrowLeft className="h-4 w-4" /> მთავარ გვერდზე
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Image preview modal
  const ImagePreviewModal = () => {
    if (!previewImage) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
        <div className="relative max-w-4xl max-h-[90vh]">
          <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white hover:text-white/80">
            <X className="h-6 w-6" />
          </button>
          <img src={previewImage} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
        </div>
      </div>
    );
  };

  // Delete confirmation modal
  const DeleteModal = () => {
    if (!deleteConfirmId) return null;
    const product = products.find(p => p.id === deleteConfirmId);
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-7 w-7 text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-center text-foreground mb-2">წაშლის დადასტურება</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            ნამდვილად გსურთ <strong>"{product?.name_ka}"</strong>-ის წაშლა? ეს მოქმედება შეუქცევადია.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              გაუქმება
            </button>
            <button
              onClick={() => handleDelete(deleteConfirmId)}
              className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              წაშლა
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Product editing form
  if (editingProduct) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <ImagePreviewModal />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => { setEditingProduct(null); setIsNew(false); }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">უკან</span>
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingProduct(null); setIsNew(false); }}
                className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                გაუქმება
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/25"
              >
                <Save className="h-4 w-4" />
                {saving ? "ინახება..." : isNew ? "დამატება" : "შენახვა"}
              </button>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isNew ? "🆕 ახალი პროდუქტი" : "✏️ პროდუქტის რედაქტირება"}
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            {isNew ? "შეავსეთ ინფორმაცია ახალი პროდუქტის დასამატებლად" : "შეცვალეთ პროდუქტის ინფორმაცია"}
          </p>

          <div className="space-y-8">
            {/* Images Section */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                სურათები
              </h2>
              <p className="text-xs text-muted-foreground mb-4">ატვირთეთ პროდუქტის სურათები (მინიმუმ 1 რეკომენდებული)</p>
              <div className="flex flex-wrap gap-4">
                {(editingProduct.images || []).map((url, i) => (
                  <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-border group cursor-pointer hover:border-primary transition-colors">
                    <img src={url} alt="" className="w-full h-full object-cover" onClick={() => setPreviewImage(url)} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewImage(url)}
                        className="p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-3.5 w-3.5 text-foreground" />
                      </button>
                      <button
                        onClick={() => removeImage(i)}
                        className="p-1.5 bg-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5 text-destructive-foreground" />
                      </button>
                    </div>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md font-medium">
                        მთავარი
                      </span>
                    )}
                  </div>
                ))}
                <label className="w-28 h-28 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-1 transition-colors" />
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">ატვირთვა</span>
                    </>
                  )}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                ძირითადი ინფორმაცია
              </h2>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      სახელი (ქართ.) <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={editingProduct.name_ka || ""}
                      onChange={e => setEditingProduct({ ...editingProduct, name_ka: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      placeholder="მაგ: ხის საათი"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">სახელი (ინგ.)</label>
                    <input
                      value={editingProduct.name_en || ""}
                      onChange={e => setEditingProduct({ ...editingProduct, name_en: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      placeholder="e.g: Wooden Clock"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">აღწერა (ქართ.)</label>
                    <textarea
                      value={editingProduct.desc_ka || ""}
                      onChange={e => setEditingProduct({ ...editingProduct, desc_ka: e.target.value })}
                      rows={4}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                      placeholder="პროდუქტის აღწერა ქართულად..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">აღწერა (ინგ.)</label>
                    <textarea
                      value={editingProduct.desc_en || ""}
                      onChange={e => setEditingProduct({ ...editingProduct, desc_en: e.target.value })}
                      rows={4}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                      placeholder="Product description in English..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                დეტალები
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    ფასი (₾) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    value={editingProduct.price || ""}
                    onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">კატეგორია</label>
                  <div className="relative">
                    <select
                      value={editingProduct.category || ""}
                      onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none"
                    >
                      <option value="">აირჩიეთ კატეგორია</option>
                      {categories.map(c => (
                        <option key={c} value={c}>{categoryLabels[c]?.ka || c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">მასალა</label>
                  <input
                    value={editingProduct.material || ""}
                    onChange={e => setEditingProduct({ ...editingProduct, material: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="მაგ: კაკლის ხე"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">ზომები</label>
                  <input
                    value={editingProduct.dimensions || ""}
                    onChange={e => setEditingProduct({ ...editingProduct, dimensions: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="მაგ: 30 × 30 × 3 სმ"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <div className={`relative w-12 h-7 rounded-full transition-colors ${editingProduct.in_stock ? "bg-green-500" : "bg-muted"}`}>
                      <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${editingProduct.in_stock ? "translate-x-5" : ""}`} />
                    </div>
                    <input
                      type="checkbox"
                      checked={editingProduct.in_stock ?? true}
                      onChange={e => setEditingProduct({ ...editingProduct, in_stock: e.target.checked })}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {editingProduct.in_stock ? "✅ მარაგშია" : "❌ არ არის მარაგში"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom save */}
            <div className="flex justify-end gap-3 pb-8">
              <button
                onClick={() => { setEditingProduct(null); setIsNew(false); }}
                className="px-6 py-3 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                გაუქმება
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/25"
              >
                <Save className="h-4 w-4" />
                {saving ? "ინახება..." : isNew ? "პროდუქტის დამატება" : "ცვლილებების შენახვა"}
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Products list view
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ImagePreviewModal />
      <DeleteModal />

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">სულ პროდუქტი</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inStock}</p>
                <p className="text-xs text-muted-foreground">მარაგშია</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.outOfStock}</p>
                <p className="text-xs text-muted-foreground">ამოწურულია</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">📦 პროდუქტების მართვა</h1>
            <p className="text-muted-foreground text-sm mt-1">დაამატეთ, შეცვალეთ ან წაშალეთ პროდუქტები</p>
          </div>
          <button
            onClick={() => { setEditingProduct({ ...emptyProduct }); setIsNew(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
          >
            <Plus className="h-5 w-5" />
            ახალი პროდუქტი
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="პროდუქტის ძიება..."
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none pr-10 min-w-[160px]"
            >
              <option value="">ყველა კატეგორია</option>
              {categories.map(c => (
                <option key={c} value={c}>{categoryLabels[c]?.ka || c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loadingProducts ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">იტვირთება...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">
              {searchQuery || filterCategory ? "პროდუქტი ვერ მოიძებნა" : "პროდუქტები ჯერ არ არის"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery || filterCategory ? "სცადეთ სხვა ძიების პარამეტრები" : "დაიწყეთ პირველი პროდუქტის დამატებით"}
            </p>
            {!searchQuery && !filterCategory && (
              <button
                onClick={() => { setEditingProduct({ ...emptyProduct }); setIsNew(true); }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                პირველი პროდუქტის დამატება
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="aspect-square bg-secondary relative overflow-hidden">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingProduct({ ...p }); setIsNew(false); }}
                      className="p-2 bg-card/90 backdrop-blur-sm rounded-lg hover:bg-card shadow-md"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="p-2 bg-destructive/90 backdrop-blur-sm text-destructive-foreground rounded-lg hover:bg-destructive shadow-md"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {!p.in_stock && (
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[10px] bg-destructive text-destructive-foreground px-2 py-1 rounded-md font-medium">
                        ამოწურულია
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-foreground truncate">{lang === "ka" ? p.name_ka : p.name_en || p.name_ka}</h3>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="font-bold text-primary">{p.price}₾</span>
                    <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {categoryLabels[p.category]?.ka || p.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:shadow-md transition-all group"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt=""
                      className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => setPreviewImage(p.images[0])}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {lang === "ka" ? p.name_ka : p.name_en || p.name_ka}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="font-bold text-primary text-sm">{p.price}₾</span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {categoryLabels[p.category]?.ka || p.category}
                    </span>
                    {p.material && <span className="text-xs text-muted-foreground">• {p.material}</span>}
                    <span className={`text-xs font-medium ${p.in_stock ? "text-green-600" : "text-destructive"}`}>
                      {p.in_stock ? "✅ მარაგშია" : "❌ ამოწურულია"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingProduct({ ...p }); setIsNew(false); }}
                    className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="რედაქტირება"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(p.id)}
                    className="p-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="წაშლა"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results count */}
        {!loadingProducts && filteredProducts.length > 0 && (
          <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">
              ნაჩვენებია {filteredProducts.length} / {products.length} პროდუქტი
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
