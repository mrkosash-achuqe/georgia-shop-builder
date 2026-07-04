import { useEffect, useState } from "react";
import { Star, Loader2, ShieldCheck, Trash2, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

type Review = {
  id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  photo_urls: string[];
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  author_name?: string | null;
  author_avatar?: string | null;
};

type Props = { productId: string };

const StarRow = ({
  value,
  onChange,
  size = "md",
  interactive = false,
}: { value: number; onChange?: (v: number) => void; size?: "sm" | "md" | "lg"; interactive?: boolean }) => {
  const cls = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={interactive ? "hover:scale-110 transition-transform" : "cursor-default"}
            aria-label={`${i + 1} stars`}
          >
            <Star className={`${cls} ${filled ? "fill-star text-star" : "text-border"}`} />
          </button>
        );
      })}
    </div>
  );
};

const ProductReviews = ({ productId }: Props) => {
  const { lang } = useLanguage();
  const { user, setAuthModalOpen } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const T = {
    heading: lang === "ka" ? "შეფასებები და მიმოხილვები" : "Ratings & Reviews",
    writeReview: lang === "ka" ? "დაწერე მიმოხილვა" : "Write a review",
    editReview: lang === "ka" ? "შენი მიმოხილვის რედაქტირება" : "Edit your review",
    yourRating: lang === "ka" ? "შენი შეფასება" : "Your rating",
    titlePh: lang === "ka" ? "სათაური (არასავალდებულო)" : "Title (optional)",
    commentPh: lang === "ka" ? "დაწერე შენი გამოცდილება..." : "Share your experience...",
    addPhotos: lang === "ka" ? "ფოტოების დამატება" : "Add photos",
    submit: lang === "ka" ? "გამოქვეყნება" : "Publish",
    update: lang === "ka" ? "განახლება" : "Update",
    cancel: lang === "ka" ? "გაუქმება" : "Cancel",
    signIn: lang === "ka" ? "მიმოხილვისთვის გაიარეთ ავტორიზაცია" : "Sign in to write a review",
    verified: lang === "ka" ? "დადასტურებული შეძენა" : "Verified purchase",
    delete: lang === "ka" ? "წაშლა" : "Delete",
    edit: lang === "ka" ? "რედაქტირება" : "Edit",
    pending: lang === "ka" ? "მოლოდინში" : "Pending approval",
    empty: lang === "ka" ? "ჯერ არაფერი მიმოხილვა. იყავი პირველი!" : "No reviews yet. Be the first!",
    based: lang === "ka" ? "-ის საფუძველზე" : "based on",
    reviews: lang === "ka" ? "მიმოხილვა" : "reviews",
    photoLimit: lang === "ka" ? "მაქსიმუმ 4 ფოტო" : "Max 4 photos",
    deleteConfirm: lang === "ka" ? "დარწმუნებული ხართ?" : "Are you sure?",
  };

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const rows: Review[] = data || [];
    // fetch profiles
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    let profiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (userIds.length) {
      const { data: pdata } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      (pdata || []).forEach((p: any) => {
        profiles[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
      });
    }
    const enriched = rows.map((r) => ({
      ...r,
      author_name: profiles[r.user_id]?.full_name || null,
      author_avatar: profiles[r.user_id]?.avatar_url || null,
    }));
    setReviews(enriched);
    const mine = user ? enriched.find((r) => r.user_id === user.id) : null;
    setMyReview(mine || null);
    if (mine) {
      setRating(mine.rating);
      setTitle(mine.title || "");
      setComment(mine.comment || "");
    }
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); /* eslint-disable-next-line */ }, [productId, user?.id]);

  const visibleReviews = reviews.filter((r) => r.is_approved || r.user_id === user?.id);
  const approved = reviews.filter((r) => r.is_approved);
  const avg = approved.length
    ? approved.reduce((s, r) => s + r.rating, 0) / approved.length
    : 0;
  const dist = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: approved.filter((r) => r.rating === s).length,
  }));

  const uploadPhotos = async (): Promise<string[]> => {
    if (!photos.length || !user) return [];
    const urls: string[] = [];
    for (const file of photos) {
      const path = `reviews/${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const submit = async () => {
    if (!user) { setAuthModalOpen(true); return; }
    setSubmitting(true);
    const newUrls = await uploadPhotos();
    const photo_urls = [...(myReview?.photo_urls || []), ...newUrls];
    const payload = {
      product_id: productId,
      user_id: user.id,
      rating,
      title: title.trim() || null,
      comment: comment.trim() || null,
      photo_urls,
    };
    const { error } = myReview
      ? await (supabase as any).from("product_reviews").update(payload).eq("id", myReview.id)
      : await (supabase as any).from("product_reviews").insert(payload);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === "ka" ? "მადლობა შეფასებისთვის!" : "Thanks for your review!");
    setPhotos([]);
    setShowForm(false);
    fetchReviews();
  };

  const deleteReview = async (id: string) => {
    if (!confirm(T.deleteConfirm)) return;
    const { error } = await (supabase as any).from("product_reviews").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === "ka" ? "წაშლილია" : "Deleted");
    setMyReview(null);
    setRating(5); setTitle(""); setComment("");
    fetchReviews();
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files].slice(0, 4));
  };

  return (
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">{T.heading}</h2>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card rounded-2xl border border-border p-5 mb-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-5xl font-bold text-foreground">{avg.toFixed(1)}</div>
          <StarRow value={Math.round(avg)} size="lg" />
          <p className="text-xs text-muted-foreground mt-1">
            {approved.length} {T.reviews}
          </p>
        </div>
        <div className="md:col-span-2 space-y-1.5">
          {dist.map(({ stars, count }) => {
            const pct = approved.length ? (count / approved.length) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground">{stars}</span>
                <Star className="h-3 w-3 fill-star text-star shrink-0" />
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-star" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action bar */}
      <div className="mb-6">
        {!user ? (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary"
          >
            {T.signIn}
          </button>
        ) : !showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
          >
            {myReview ? T.editReview : T.writeReview}
          </button>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{T.yourRating}</label>
              <StarRow value={rating} onChange={setRating} interactive />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={T.titlePh}
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={T.commentPh}
              rows={4}
              maxLength={1000}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            />
            <div>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-sm cursor-pointer hover:bg-secondary">
                <Upload className="h-4 w-4" /> {T.addPhotos}
                <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
              </label>
              <span className="ml-2 text-xs text-muted-foreground">{T.photoLimit}</span>
              {photos.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {photos.map((f, i) => (
                    <div key={i} className="relative">
                      <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                      <button
                        onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowForm(false); setPhotos([]); }}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary"
              >
                {T.cancel}
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {myReview ? T.update : T.submit}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : visibleReviews.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">{T.empty}</p>
      ) : (
        <div className="space-y-4">
          {visibleReviews.map((r) => (
            <div key={r.id} className="bg-card rounded-2xl border border-border p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
                  {r.author_avatar ? (
                    <img src={r.author_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (r.author_name?.[0] || "U").toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{r.author_name || (lang === "ka" ? "მომხმარებელი" : "User")}</span>
                    {r.is_verified_purchase && (
                      <span className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                        <ShieldCheck className="h-2.5 w-2.5" /> {T.verified}
                      </span>
                    )}
                    {!r.is_approved && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">{T.pending}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRow value={r.rating} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString(lang === "ka" ? "ka-GE" : "en-US")}
                    </span>
                  </div>
                  {r.title && <h4 className="font-semibold text-sm mt-2">{r.title}</h4>}
                  {r.comment && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{r.comment}</p>}
                  {r.photo_urls?.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {r.photo_urls.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noreferrer">
                          <img src={u} alt="" className="w-20 h-20 rounded-lg object-cover border border-border hover:opacity-80" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                {user?.id === r.user_id && (
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    aria-label={T.delete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductReviews;