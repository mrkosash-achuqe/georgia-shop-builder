import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, HelpCircle, Loader2, Save, Trash2, XCircle } from "lucide-react";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type QuestionRow = {
  id: string;
  product_id: string;
  author_name: string | null;
  question: string;
  answer: string | null;
  answered_at: string | null;
  is_published: boolean;
  created_at: string;
  product_name?: string;
};

type Filter = "all" | "unanswered" | "pending" | "published";
const answerSchema = z.string().trim().min(2).max(2000);

const AdminQuestions = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(Boolean(data));
      setChecking(false);
    });
  }, [authLoading, user]);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("product_questions").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const list = data || [];
    const productIds = Array.from(new Set(list.map((row) => row.product_id)));
    const { data: products } = productIds.length
      ? await supabase.from("products").select("id, name_ka").in("id", productIds)
      : { data: [] };
    const names = new Map((products || []).map((product) => [product.id, product.name_ka]));
    const enriched = list.map((row) => ({ ...row, product_name: names.get(row.product_id) || "—" }));
    setRows(enriched);
    setAnswers(Object.fromEntries(enriched.map((row) => [row.id, row.answer || ""])));
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) void fetchAll();
  }, [isAdmin]);

  const saveAnswer = async (row: QuestionRow, publish: boolean) => {
    const parsed = answerSchema.safeParse(answers[row.id] || "");
    if (!parsed.success) {
      toast.error("პასუხი უნდა შეიცავდეს 2-დან 2000-მდე სიმბოლოს");
      return;
    }
    setBusy(row.id);
    const { error } = await supabase.from("product_questions").update({
      answer: parsed.data,
      answered_at: new Date().toISOString(),
      is_published: publish,
    }).eq("id", row.id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(publish ? "პასუხი გამოქვეყნდა" : "პასუხი შენახულია");
    void fetchAll();
  };

  const toggleVisibility = async (row: QuestionRow) => {
    if (!row.answer?.trim() && !row.is_published) {
      toast.error("გამოქვეყნებამდე დაწერეთ პასუხი");
      return;
    }
    setBusy(row.id);
    const { error } = await supabase.from("product_questions").update({ is_published: !row.is_published }).eq("id", row.id);
    setBusy(null);
    if (error) toast.error(error.message);
    else void fetchAll();
  };

  const remove = async (id: string) => {
    if (!window.confirm("ნამდვილად გსურთ კითხვის წაშლა?")) return;
    setBusy(id);
    const { error } = await supabase.from("product_questions").delete().eq("id", id);
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("კითხვა წაიშალა");
      void fetchAll();
    }
  };

  if (authLoading || checking) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user || !isAdmin) return (
    <div className="min-h-screen bg-background"><Header /><main className="container mx-auto px-4 py-20 text-center"><XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" /><h1 className="text-2xl font-bold">წვდომა შეზღუდულია</h1></main><Footer /></div>
  );

  const filtered = rows.filter((row) => {
    if (filter === "unanswered") return !row.answer;
    if (filter === "pending") return Boolean(row.answer) && !row.is_published;
    if (filter === "published") return row.is_published;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <nav className="mb-6 flex gap-2 overflow-x-auto border-b border-border" aria-label="ადმინის ნავიგაცია">
          <Link to="/admin/dashboard" className="whitespace-nowrap px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">დაშბორდი</Link>
          <Link to="/admin" className="whitespace-nowrap px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">პროდუქტები</Link>
          <Link to="/admin/orders" className="whitespace-nowrap px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">შეკვეთები</Link>
          <Link to="/admin/reviews" className="whitespace-nowrap px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">მიმოხილვები</Link>
          <span className="-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 border-primary px-4 py-2.5 text-sm font-semibold text-primary"><HelpCircle className="h-4 w-4" /> კითხვები</span>
        </nav>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold">პროდუქტის კითხვები</h1><p className="mt-1 text-sm text-muted-foreground">უპასუხეთ მომხმარებლებს და მართეთ გამოქვეყნება</p></div>
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-md bg-muted p-1">
            {(["all", "unanswered", "pending", "published"] as Filter[]).map((value) => (
              <Button key={value} size="sm" variant={filter === value ? "default" : "ghost"} onClick={() => setFilter(value)}>
                {value === "all" ? "ყველა" : value === "unanswered" ? "უპასუხო" : value === "pending" ? "მოლოდინში" : "გამოქვეყნებული"}
              </Button>
            ))}
          </div>
        </div>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : filtered.length === 0 ? (
          <div className="border-y border-border py-20 text-center text-muted-foreground"><HelpCircle className="mx-auto mb-3 h-12 w-12 opacity-30" />კითხვები არ არის</div>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {filtered.map((row) => (
              <article key={row.id} className="py-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Link to={`/product/${row.product_id}`} className="text-sm font-semibold text-primary hover:underline">{row.product_name}</Link>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.is_published ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>{row.is_published ? "გამოქვეყნებული" : row.answer ? "მოლოდინში" : "უპასუხო"}</span>
                  <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString("ka-GE")}</span>
                </div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{row.author_name || "მომხმარებელი"}</p>
                <p className="mb-4 whitespace-pre-wrap text-sm font-medium text-foreground">{row.question}</p>
                <textarea value={answers[row.id] || ""} onChange={(event) => setAnswers((current) => ({ ...current, [row.id]: event.target.value }))} maxLength={2000} rows={3} placeholder="დაწერეთ პასუხი..." className="w-full resize-y rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Button variant="outline" size="sm" disabled={busy === row.id} onClick={() => saveAnswer(row, false)}><Save /> შენახვა</Button>
                  <Button size="sm" disabled={busy === row.id} onClick={() => saveAnswer(row, true)}><CheckCircle2 /> პასუხი და გამოქვეყნება</Button>
                  <Button variant="secondary" size="sm" disabled={busy === row.id} onClick={() => toggleVisibility(row)}>{row.is_published ? <EyeOff /> : <Eye />}{row.is_published ? "დამალვა" : "გამოქვეყნება"}</Button>
                  <Button variant="destructive" size="icon" aria-label="კითხვის წაშლა" disabled={busy === row.id} onClick={() => remove(row.id)}><Trash2 /></Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminQuestions;