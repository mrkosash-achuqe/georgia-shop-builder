import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";

const CartDrawer = () => {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice, isOpen, setIsOpen } = useCart();
  const { lang, t } = useLanguage();
  const ct = t.cart;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {ct.title}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg mb-2">{ct.empty}</p>
              <button
                onClick={() => setIsOpen(false)}
                className="text-primary hover:underline text-sm"
              >
                {ct.continueShopping}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const name = lang === "ka" ? item.product.nameKa : item.product.nameEn;
                return (
                  <div
                    key={item.product.id}
                    className="flex gap-3 bg-card rounded-xl border border-border p-3"
                  >
                    <Link
                      to={`/product/${item.product.id}`}
                      onClick={() => setIsOpen(false)}
                      className="w-20 h-20 rounded-lg overflow-hidden shrink-0"
                    >
                      <img
                        src={item.product.img}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.product.id}`}
                        onClick={() => setIsOpen(false)}
                        className="text-sm font-medium text-foreground line-clamp-1 hover:text-primary transition-colors"
                      >
                        {name}
                      </Link>
                      <p className="text-primary font-bold text-sm mt-1">
                        {item.product.price} {t.products.currency}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-border rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 text-sm font-medium text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{ct.total}</span>
              <span className="text-xl font-bold text-foreground">
                {totalPrice} {t.products.currency}
              </span>
            </div>
            <button className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              {ct.checkout}
            </button>
            <button
              onClick={clearCart}
              className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              {ct.clearCart}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
