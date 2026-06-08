import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import AuthModal from "@/components/AuthModal";
import Index from "./pages/Index.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import Checkout from "./pages/Checkout.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import Delivery from "./pages/Delivery.tsx";
import Returns from "./pages/Returns.tsx";
import Blog from "./pages/Blog.tsx";
import Wishlist from "./pages/Wishlist.tsx";
import Admin from "./pages/Admin.tsx";
import AdminUsers from "./pages/AdminUsers.tsx";
import AdminOrders from "./pages/AdminOrders.tsx";
import AdminShipping from "./pages/AdminShipping.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

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
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/shipping" element={<AdminShipping />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
