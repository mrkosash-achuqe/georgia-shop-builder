import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, BookOpen, Clock, User, Calendar } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const blogPosts = [
  {
    id: 1,
    img: "/placeholder.svg",
    titleKa: "ქართული ჩუქურთმა — ტრადიცია და თანამედროვეობა",
    titleEn: "Georgian Chukurtma — Tradition and Modernity",
    excerptKa: "ჩუქურთმა არის ქართული ხელოსნობის ერთ-ერთი უძველესი და ყველაზე ლამაზი ფორმა.",
    excerptEn: "Chukurtma is one of the oldest and most beautiful forms of Georgian craftsmanship.",
    contentKa: `ჩუქურთმა — ხეზე კვეთის უნიკალური ქართული ხელოვნებაა, რომელიც საუკუნეების განმავლობაში ვითარდებოდა. ის გვხვდება ძველ ეკლესიებზე, საცხოვრებელი სახლების ხის ვერანდებზე, ავეჯსა და საყოფაცხოვრებო ნივთებზე.\n\nტრადიციული ჩუქურთმის მოტივები მცენარეული, გეომეტრიული და სიმბოლური ხასიათისაა — ვაზის რქა, მზე, ჯვარი, წნული. თითოეული ელემენტი ატარებს კონკრეტულ მნიშვნელობას და გადაეცემა თაობიდან თაობას.\n\nთანამედროვე ოსტატები ცდილობენ ტრადიციული ფორმების შენარჩუნებას ინოვაციურ დიზაინთან ერთად. ხელნაკეთი ჩუქურთმიანი ნივთი დღეს არ არის უბრალო დეკორი — ის ცოცხალი კულტურული მემკვიდრეობაა, რომელსაც სახლში შემოიყვანთ.\n\nჩვენი მაღაზიის ყოველი ნაკეთობა ხელით არის დამუშავებული ქართველი ოსტატის მიერ, ხის ბუნებრივი ფაქტურისა და ჩუქურთმის ტრადიციული მოტივების პატივისცემით.`,
    contentEn: `Chukurtma — the unique Georgian art of wood carving — has evolved over centuries. It is found on ancient churches, wooden verandas of homes, furniture and household items.\n\nTraditional motifs are botanical, geometric and symbolic — grapevine, sun, cross, knotwork. Each element carries specific meaning passed from generation to generation.\n\nContemporary masters strive to preserve traditional forms while introducing innovative design. A handcrafted piece with chukurtma today is not just decor — it is living cultural heritage you bring into your home.\n\nEvery item in our store is handcrafted by Georgian masters with respect for the natural texture of wood and the traditional motifs of chukurtma.`,
    authorKa: "ნინო ხელაძე",
    authorEn: "Nino Kheladze",
    readTime: 5,
    categoryKa: "ტრადიცია",
    categoryEn: "Tradition",
    date: "2025-01-15",
  },
  {
    id: 2,
    img: "/placeholder.svg",
    titleKa: "ხელნაკეთი საჩუქრის არჩევის გზამკვლევი",
    titleEn: "A Guide to Choosing Handmade Gifts",
    excerptKa: "ხელნაკეთი საჩუქარი ყოველთვის განსაკუთრებულია.",
    excerptEn: "A handmade gift is always special.",
    contentKa: `ხელნაკეთი საჩუქარი — ეს არის გრძნობების, დროისა და ოსტატის შრომის ერთობლიობა. განსხვავებით მასობრივი წარმოებისგან, თითოეული ნივთი უნიკალურია.\n\nსაჩუქრის არჩევისას გაითვალისწინეთ:\n• ვისთვის ირჩევთ — მისი გემოვნება, ინტერიერის სტილი, ჰობი\n• ნივთის ფუნქცია — დეკორატიული თუ პრაქტიკული გამოყენება\n• მასალის ხარისხი — ბუნებრივი ხის ტიპი, დამუშავება, საფარი\n• პერსონალიზაციის შესაძლებლობა — გრავირება, საკუთარი წარწერა\n\nაჩუქის ასორტიმენტში ნახავთ ფოტო ჩარჩოებს ოჯახური სურათებისთვის, საათებს ოფისისა თუ მისაღები ოთახისთვის, შამფურების ნაკრებებს მოყვარულთათვის და სასაჩუქრე ყუთებს განსაკუთრებული შემთხვევებისთვის.\n\nთითოეული ნაკეთობა მზადდება შეკვეთით, ამიტომ წინასწარ დაგეგმეთ მიწოდების დრო — მითუმეტეს თუ პერსონალიზაციას ითხოვთ.`,
    contentEn: `A handmade gift is a combination of feelings, time and a craftsman's labor. Unlike mass production, every item is unique.\n\nWhen choosing a gift consider:\n• Recipient's taste, interior style, hobbies\n• Function — decorative or practical\n• Material quality — type of natural wood, finish, coating\n• Personalization options — engraving, custom text\n\nIn our catalog you'll find photo frames for family pictures, clocks for office or living room, skewer sets for grilling enthusiasts, and gift boxes for special occasions.\n\nEach item is made to order, so plan delivery time in advance — especially if you want personalization.`,
    authorKa: "გიორგი ბერიძე",
    authorEn: "Giorgi Beridze",
    readTime: 4,
    categoryKa: "გზამკვლევი",
    categoryEn: "Guide",
    date: "2025-02-20",
  },
  {
    id: 3,
    img: "/placeholder.svg",
    titleKa: "ხის მოვლის რჩევები — როგორ შევინარჩუნოთ ხის ნაკეთობები",
    titleEn: "Wood Care Tips — How to Maintain Wooden Products",
    excerptKa: "ხის ნაკეთობები საჭიროებს სათანადო მოვლას.",
    excerptEn: "Wooden products need proper care to maintain their beauty.",
    contentKa: `ხის ნაკეთობა ცოცხალი მასალაა — ის რეაგირებს ტენიანობაზე, ტემპერატურასა და სინათლეზე. სწორი მოვლით ის ათეულობით წელი შეინარჩუნებს ლამაზ იერსახეს.\n\nძირითადი წესები:\n• გასუფთავებისთვის გამოიყენეთ მშრალი ან ოდნავ ნოტიო რბილი ქსოვილი\n• არ გამოიყენოთ აგრესიული ქიმიური საშუალებები ან აბრაზიული ღრუბლები\n• თავი აარიდეთ პირდაპირ მზის სხივებს — ხე ქრება და ხმება\n• არ მოათავსოთ რადიატორთან ან გათბობის წყაროსთან ახლოს\n• წელიწადში ერთხელ გადაამუშავეთ ბუნებრივი ხის ზეთით (სელის, ხის ცვილი)\n\nთუ ნაკეთობაზე ლაქი ან ცვილია, არ დაგჭირდებათ დამატებითი დამუშავება — უბრალოდ შეინარჩუნეთ სისუფთავე.\n\nშამფურების ნაკრების შემთხვევაში, გამოყენების შემდეგ კარგად გაასუფთავეთ და ბოლომდე გააშრეთ — წინააღმდეგ შემთხვევაში ხე შეიძლება დაიხეთქოს.`,
    contentEn: `Wood is a living material — it reacts to humidity, temperature and light. With proper care it will keep its beauty for decades.\n\nBasic rules:\n• Clean with a dry or slightly damp soft cloth\n• Avoid harsh chemicals or abrasive sponges\n• Keep away from direct sunlight — wood fades and dries out\n• Don't place near radiators or heat sources\n• Once a year treat with natural wood oil (linseed, beeswax)\n\nIf the item is lacquered or waxed, no extra treatment is needed — just keep it clean.\n\nFor skewer sets, after use clean thoroughly and dry completely — otherwise the wood may crack.`,
    authorKa: "თამარ კვარაცხელია",
    authorEn: "Tamar Kvaratskhelia",
    readTime: 3,
    categoryKa: "მოვლა",
    categoryEn: "Care",
    date: "2025-03-10",
  },
];

type Post = (typeof blogPosts)[number];

const Blog = () => {
  const { lang, t } = useLanguage();
  const bt = t.blog;
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [dbPosts, setDbPosts] = useState<Post[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (!data) return;
      const mapped: Post[] = data.map((p: any) => ({
        id: p.id,
        img: p.cover_image || "/placeholder.svg",
        titleKa: p.title_ka,
        titleEn: p.title_en || p.title_ka,
        excerptKa: p.excerpt_ka || "",
        excerptEn: p.excerpt_en || p.excerpt_ka || "",
        contentKa: p.content_ka || "",
        contentEn: p.content_en || p.content_ka || "",
        authorKa: "აჩუქე",
        authorEn: "Achuqe",
        readTime: Math.max(1, Math.round((p.content_ka || "").length / 800)),
        categoryKa: p.category || "ბლოგი",
        categoryEn: p.category || "Blog",
        date: (p.published_at || p.created_at || "").slice(0, 10),
      }));
      setDbPosts(mapped);
    })();
  }, []);

  const posts: Post[] = dbPosts.length > 0 ? dbPosts : blogPosts;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" />{t.productDetail.backToHome}
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2">{bt.title}</h1>
        <p className="text-muted-foreground mb-8">{bt.subtitle}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article key={post.id} className="bg-card rounded-xl border border-border overflow-hidden group flex flex-col">
              <div className="aspect-video overflow-hidden relative bg-secondary flex items-center justify-center">
                <img src={post.img} alt={lang === "ka" ? post.titleKa : post.titleEn} className={post.img && post.img !== "/placeholder.svg" ? "w-full h-full object-cover" : "max-w-[60%] max-h-[60%] object-contain opacity-30"} />
                <Badge className="absolute top-3 left-3" variant="secondary">
                  {lang === "ka" ? post.categoryKa : post.categoryEn}
                </Badge>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime} {bt.readTime}</span>
                </div>
                <h2 className="text-lg font-semibold text-foreground mt-2 mb-3 line-clamp-2">
                  {lang === "ka" ? post.titleKa : post.titleEn}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                  {lang === "ka" ? post.excerptKa : post.excerptEn}
                </p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />{lang === "ka" ? post.authorKa : post.authorEn}
                  </span>
                  <button
                    onClick={() => setOpenPost(post)}
                    className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <BookOpen className="h-3.5 w-3.5" />{bt.readMore}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <Dialog open={!!openPost} onOpenChange={(o) => !o && setOpenPost(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {openPost && (
              <>
                <DialogHeader>
                  <Badge variant="secondary" className="w-fit mb-2">
                    {lang === "ka" ? openPost.categoryKa : openPost.categoryEn}
                  </Badge>
                  <DialogTitle className="text-2xl text-left">
                    {lang === "ka" ? openPost.titleKa : openPost.titleEn}
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
                    <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{lang === "ka" ? openPost.authorKa : openPost.authorEn}</span>
                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{bt.publishedOn} {openPost.date}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{openPost.readTime} {bt.readTime}</span>
                  </div>
                </DialogHeader>
                <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center my-2">
                  <img src={openPost.img} alt="" className="max-w-[40%] max-h-[60%] object-contain opacity-30" />
                </div>
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-line leading-relaxed">
                  {lang === "ka" ? openPost.contentKa : openPost.contentEn}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <div className="mt-auto"><Footer /></div>
      <CartDrawer />
    </div>
  );
};

export default Blog;
