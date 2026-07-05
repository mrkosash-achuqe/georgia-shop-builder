import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import AuthModal from "@/components/AuthModal";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const ProductDetail = lazy(() => import("./pages/ProductDetail.tsx"));
const Checkout = lazy(() => import("./pages/Checkout.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Delivery = lazy(() => import("./pages/Delivery.tsx"));
const Returns = lazy(() => import("./pages/Returns.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const Wishlist = lazy(() => import("./pages/Wishlist.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const AdminUsers = lazy(() => import("./pages/AdminUsers.tsx"));
const AdminOrders = lazy(() => import("./pages/AdminOrders.tsx"));
const AdminShipping = lazy(() => import("./pages/AdminShipping.tsx"));
const AdminPromoCodes = lazy(() => import("./pages/AdminPromoCodes.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const AdminReviews = lazy(() => import("./pages/AdminReviews.tsx"));
const AdminBlog = lazy(() => import("./pages/AdminBlog.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AuthModal />
              <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/delivery" element={<Delivery />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/shipping" element={<AdminShipping />} />
                <Route path="/admin/promo" element={<AdminPromoCodes />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
                <Route path="/admin/blog" element={<AdminBlog />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
