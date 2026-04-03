import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus, Pencil, Trash2, Upload, X, Save, ArrowLeft, Image as ImageIcon } from "lucide-react";
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

const categories = [
  "clocks", "cutting-boards", "cutting-board-sets", "gift-boxes",
  "photo-frames", "candle-holders", "kids", "corporate", "other"
];

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<DBProduct> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Check admin role
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }
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

  // Fetch products
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
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file);

    if (error) {
      toast.error("სურათის ატვირთვა ვერ მოხერხდა");
      setUploadingImage(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(path);

    setEditingProduct(prev => ({
      ...prev,
      images: [...(prev?.images || []), urlData.publicUrl],
    }));
    setUploadingImage(false);
    toast.success("სურათი აიტვირთა");
  };

  const removeImage = (index: number) => {
    setEditingProduct(prev => ({
      ...prev,
      images: (prev?.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!editingProduct?.name_ka) {
      toast.error("სახელი სავალდებულოა");
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
        toast.success("პროდუქტი დაემატა");
        setEditingProduct(null);
        setIsNew(false);
        fetchProducts();
      }
    } else {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingProduct.id!);
      if (error) {
        toast.error("განახლება ვერ მოხერხდა: " + error.message);
      } else {
        toast.success("პროდუქტი განახლდა");
        setEditingProduct(null);
        fetchProducts();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ნამდვილად გსურთ წაშლა?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("წაშლა ვერ მოხერხდა");
    } else {
      toast.success("პროდუქტი წაიშალა");
      fetchProducts();
    }
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">ავტორიზაცია საჭიროა</h1>
          <p className="text-muted-foreground">ამ გვერდზე წვდომისთვის გაიარეთ ავტორიზაცია.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">წვდომა შეზღუდულია</h1>
          <p className="text-muted-foreground">ეს გვერდი მხოლოდ ადმინისტრატორებისთვისაა.</p>
          <Link to="/" className="inline-block mt-6 text-primary hover:underline">
            <ArrowLeft className="inline h-4 w-4 mr-1" />
            მთავარ გვერდზე დაბრუნება
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Product editing form
  if (editingProduct) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <button
            onClick={() => { setEditingProduct(null); setIsNew(false); }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            უკან
          </button>

          <h1 className="text-2xl font-bold text-foreground mb-8">
            {isNew ? "ახალი პროდუქტი" : "პროდუქტის რედაქტირება"}
          </h1>

          <div className="space-y-6">
            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">სურათები</label>
              <div className="flex flex-wrap gap-3 mb-3">
                {(editingProduct.images || []).map((url, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">ატვირთვა</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Name KA/EN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">სახელი (ქართ.)</label>
                <input
                  value={editingProduct.name_ka || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, name_ka: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="პროდუქტის სახელი"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">სახელი (ინგ.)</label>
                <input
                  value={editingProduct.name_en || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, name_en: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Product name"
                />
              </div>
            </div>

            {/* Description KA/EN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">აღწერა (ქართ.)</label>
                <textarea
                  value={editingProduct.desc_ka || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, desc_ka: e.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="აღწერა"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">აღწერა (ინგ.)</label>
                <textarea
                  value={editingProduct.desc_en || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, desc_en: e.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Description"
                />
              </div>
            </div>

            {/* Price, Category, Material */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">ფასი (₾)</label>
                <input
                  type="number"
                  value={editingProduct.price || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="0"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">კატეგორია</label>
                <select
                  value={editingProduct.category || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">აირჩიეთ</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">მასალა</label>
                <input
                  value={editingProduct.material || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, material: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="მაგ: კაკალი / Walnut"
                />
              </div>
            </div>

            {/* Dimensions, In Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">ზომები</label>
                <input
                  value={editingProduct.dimensions || ""}
                  onChange={e => setEditingProduct({ ...editingProduct, dimensions: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="მაგ: 30 × 30 × 3 სმ"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.in_stock ?? true}
                    onChange={e => setEditingProduct({ ...editingProduct, in_stock: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary h-5 w-5"
                  />
                  <span className="text-sm font-medium text-foreground">მარაგშია</span>
                </label>
              </div>
            </div>

            {/* Save */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "ინახება..." : "შენახვა"}
              </button>
              <button
                onClick={() => { setEditingProduct(null); setIsNew(false); }}
                className="px-6 py-3 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                გაუქმება
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Products list
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ადმინ პანელი</h1>
            <p className="text-muted-foreground text-sm mt-1">პროდუქტების მართვა</p>
          </div>
          <button
            onClick={() => { setEditingProduct({ ...emptyProduct }); setIsNew(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            ახალი პროდუქტი
          </button>
        </div>

        {loadingProducts ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">პროდუქტები ჯერ არ არის დამატებული</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {lang === "ka" ? p.name_ka : p.name_en || p.name_ka}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{p.price}₾</span>
                    <span>{p.category}</span>
                    <span className={p.in_stock ? "text-green-600" : "text-destructive"}>
                      {p.in_stock ? "მარაგშია" : "არ არის მარაგში"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingProduct({ ...p }); setIsNew(false); }}
                    className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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

export default Admin;
