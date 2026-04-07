import { Link } from "react-router-dom";
import { ChevronLeft, BookOpen } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

const blogPosts = [
  {
    id: 1,
    img: "/placeholder.svg",
    titleKa: "ქართული ჩუქურთმა — ტრადიცია და თანამედროვეობა",
    titleEn: "Georgian Chukurtma — Tradition and Modernity",
    excerptKa: "ჩუქურთმა არის ქართული ხელოსნობის ერთ-ერთი უძველესი და ყველაზე ლამაზი ფორმა.",
    excerptEn: "Chukurtma is one of the oldest and most beautiful forms of Georgian craftsmanship.",
    date: "2025-01-15",
  },
  {
    id: 2,
    img: "/placeholder.svg",
    titleKa: "ხელნაკეთი საჩუქრის არჩევის გზამკვლევი",
    titleEn: "A Guide to Choosing Handmade Gifts",
    excerptKa: "ხელნაკეთი საჩუქარი ყოველთვის განსაკუთრებულია.",
    excerptEn: "A handmade gift is always special.",
    date: "2025-02-20",
  },
  {
    id: 3,
    img: "/placeholder.svg",
    titleKa: "ხის მოვლის რჩევები — როგორ შევინარჩუნოთ ხის ნაკეთობები",
    titleEn: "Wood Care Tips — How to Maintain Wooden Products",
    excerptKa: "ხის ნაკეთობები საჭიროებს სათანადო მოვლას.",
    excerptEn: "Wooden products need proper care to maintain their beauty.",
    date: "2025-03-10",
  },
];

const Blog = () => {
  const { lang, t } = useLanguage();
  const bt = t.blog;

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
          {blogPosts.map((post) => (
            <article key={post.id} className="bg-card rounded-xl border border-border overflow-hidden group">
              <div className="aspect-video overflow-hidden relative bg-secondary">
                <img src={post.img} alt={lang === "ka" ? post.titleKa : post.titleEn} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-5">
                <time className="text-xs text-muted-foreground">{post.date}</time>
                <h2 className="text-lg font-semibold text-foreground mt-2 mb-3 line-clamp-2">
                  {lang === "ka" ? post.titleKa : post.titleEn}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {lang === "ka" ? post.excerptKa : post.excerptEn}
                </p>
                <button className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />{bt.readMore}
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
      <div className="mt-auto"><Footer /></div>
      <CartDrawer />
    </div>
  );
};

export default Blog;
