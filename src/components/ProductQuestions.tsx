import { useEffect, useState } from "react";
import { HelpCircle, Loader2, Lock, MessageCircleQuestion, Send } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Question = {
  id: string;
  user_id: string | null;
  author_name: string | null;
  question: string;
  answer: string | null;
  answered_at: string | null;
  is_published: boolean;
  created_at: string;
};

const questionSchema = z.string().trim().min(5).max(1000);

const ProductQuestions = ({ productId }: { productId: string }) => {
  const { lang } = useLanguage();
  const { user, profile, setAuthModalOpen } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const text = lang === "ka" ? {
    title: "კითხვა-პასუხი",
    intro: "გაქვთ შეკითხვა ამ პროდუქტზე? მოგვწერეთ და მალე გიპასუხებთ.",
    placeholder: "დაწერეთ თქვენი კითხვა...",
    signIn: "კითხვის დასასმელად გაიარეთ ავტორიზაცია",
    submit: "კითხვის გაგზავნა",
    pending: "ელოდება პასუხსა და გამოქვეყნებას",
    answer: "აჩუქეს პასუხი",
    empty: "ამ პროდუქტზე კითხვები ჯერ არ არის.",
    invalid: "კითხვა უნდა შეიცავდეს 5-დან 1000-მდე სიმბოლოს.",
    success: "კითხვა გაიგზავნა. პასუხის შემდეგ გამოქვეყნდება.",
  } : {
    title: "Questions & Answers",
    intro: "Have a question about this product? Send it and we’ll reply soon.",
    placeholder: "Write your question...",
    signIn: "Sign in to ask a question",
    submit: "Send question",
    pending: "Awaiting answer and publication",
    answer: "Answer from Achuqe",
    empty: "There are no questions about this product yet.",
    invalid: "Your question must contain between 5 and 1,000 characters.",
    success: "Your question was sent and will appear after it is answered.",
  };

  const fetchQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_questions")
      .select("id, user_id, author_name, question, answer, answered_at, is_published, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setQuestions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    void fetchQuestions();
  }, [productId, user?.id]);

  const submit = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    const parsed = questionSchema.safeParse(question);
    if (!parsed.success) {
      toast.error(text.invalid);
      return;
    }
    setSubmitting(true);
    const authorName = profile?.full_name?.trim() || user.user_metadata?.full_name || null;
    const { error } = await supabase.from("product_questions").insert({
      product_id: productId,
      user_id: user.id,
      author_name: typeof authorName === "string" ? authorName.slice(0, 100) : null,
      question: parsed.data,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setQuestion("");
    toast.success(text.success);
    void fetchQuestions();
  };

  return (
    <section className="mt-12 border-t border-border pt-10" aria-labelledby="product-questions-title">
      <div className="mb-6">
        <h2 id="product-questions-title" className="flex items-center gap-2 text-xl font-bold text-foreground md:text-2xl">
          <MessageCircleQuestion className="h-6 w-6 text-primary" /> {text.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{text.intro}</p>
      </div>

      <div className="mb-8 border-y border-border bg-card py-5 sm:px-5">
        {user ? (
          <div className="space-y-3">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={text.placeholder}
              rows={3}
              maxLength={1000}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{question.length}/1000</span>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : <Send />}
                {text.submit}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setAuthModalOpen(true)}>
            <Lock /> {text.signIn}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : questions.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          <HelpCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />
          {text.empty}
        </div>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {questions.map((item) => (
            <article key={item.id} className="py-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{item.author_name || (lang === "ka" ? "მომხმარებელი" : "Customer")}</span>
                <span>·</span>
                <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString(lang === "ka" ? "ka-GE" : "en-US")}</time>
                {!item.is_published && item.user_id === user?.id && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-muted-foreground">{text.pending}</span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-foreground">{item.question}</p>
              {item.answer && (
                <div className="mt-4 border-l-2 border-primary pl-4">
                  <p className="mb-1 text-xs font-semibold text-primary">{text.answer}</p>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.answer}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductQuestions;