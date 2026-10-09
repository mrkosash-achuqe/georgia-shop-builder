import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, Boxes, Tags, ShoppingBag, RotateCcw, Truck,
  Users, Tag, FileText, MessageSquare, HelpCircle, Palette, Store,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Counts = Record<string, number>;

const GROUPS: { title: string; links: { to: string; label: string; icon: typeof Package; badge?: string }[] }[] = [
  { title: "მიმოხილვა", links: [{ to: "/admin/dashboard", label: "დაფა", icon: LayoutDashboard }] },
  { title: "გაყიდვები", links: [
    { to: "/admin/orders", label: "შეკვეთები", icon: ShoppingBag, badge: "orders" },
    { to: "/admin/requests", label: "მოთხოვნები", icon: RotateCcw, badge: "requests" },
    { to: "/admin/shipping", label: "მიწოდება", icon: Truck },
  ] },
  { title: "კატალოგი", links: [
    { to: "/admin", label: "პროდუქტები", icon: Package },
    { to: "/admin/inventory", label: "მარაგი", icon: Boxes, badge: "stock" },
    { to: "/admin/categories", label: "კატეგორიები", icon: Tags },
  ] },
  { title: "მომხმარებლები", links: [
    { to: "/admin/users", label: "მომხმარებლები", icon: Users },
    { to: "/admin/reviews", label: "მიმოხილვები", icon: MessageSquare, badge: "reviews" },
    { to: "/admin/questions", label: "კითხვები", icon: HelpCircle, badge: "questions" },
  ] },
  { title: "მარკეტინგი", links: [
    { to: "/admin/promo", label: "პრომო კოდები", icon: Tag },
    { to: "/admin/blog", label: "ბლოგი", icon: FileText },
  ] },
  { title: "პარამეტრები", links: [{ to: "/admin/settings", label: "დიზაინი და AI", icon: Palette }] },
];

let cache: { at: number; counts: Counts } | null = null;

const loadCounts = async (): Promise<Counts> => {
  if (cache && Date.now() - cache.at < 30_000) return cache.counts;
  const head = { count: "exact" as const, head: true };
  const [o, r, s, rv, q] = await Promise.all([
    supabase.from("orders").select("id", head).eq("status", "pending"),
    (supabase as any).from("order_requests").select("id", head).eq("status", "pending"),
    supabase.from("products").select("id", head).lte("stock_quantity", 3),
    supabase.from("product_reviews").select("id", head).eq("is_approved", false),
    supabase.from("product_questions").select("id", head).is("answer", null),
  ]);
  const counts = { orders: o.count || 0, requests: r.count || 0, stock: s.count || 0, reviews: rv.count || 0, questions: q.count || 0 };
  cache = { at: Date.now(), counts };
  return counts;
};

/** Unified admin navigation with grouped sections and live attention badges. */
const AdminExtraNav = () => {
  const { pathname } = useLocation();
  const [counts, setCounts] = useState<Counts>(cache?.counts || {});

  useEffect(() => {
    let active = true;
    loadCounts().then((c) => active && setCounts(c)).catch(() => {});
    return () => { active = false; };
  }, [pathname]);

  return (
    <nav className="mb-6 rounded-2xl border border-border bg-card p-2" aria-label="ადმინის მენიუ">
      <div className="flex items-center justify-between gap-2 px-2 pb-2 border-b border-border mb-2">
        <span className="text-sm font-semibold text-foreground">ადმინ პანელი</span>
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
          <Store className="h-3.5 w-3.5" /> მაღაზიის ნახვა
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {GROUPS.map((g) => (
          <div key={g.title} className="shrink-0">
            <p className="px-2 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{g.title}</p>
            <div className="flex gap-1">
              {g.links.map(({ to, label, icon: Icon, badge }) => {
                const active = pathname === to;
                const n = badge ? counts[badge] || 0 : 0;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                    {n > 0 && (
                      <span className={`ml-0.5 min-w-5 rounded-full px-1.5 text-center text-[10px] font-bold leading-5 ${active ? "bg-primary-foreground text-primary" : "bg-destructive text-destructive-foreground"}`}>
                        {n > 99 ? "99+" : n}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
};

export default AdminExtraNav;
