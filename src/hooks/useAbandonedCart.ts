import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

/**
 * Persists a signed-in shopper's cart to the database so it can be restored
 * on another device and used for abandoned-cart follow-ups.
 */
export const useAbandonedCart = () => {
  const { user } = useAuth();
  const { items, totalPrice } = useCart();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    if (timer.current) window.clearTimeout(timer.current);

    timer.current = window.setTimeout(async () => {
      try {
        if (items.length === 0) {
          await supabase.from("abandoned_carts").delete().eq("user_id", user.id);
          return;
        }
        const payload = {
          user_id: user.id,
          email: user.email ?? "",
          items: items.map((it) => ({
            id: it.product.id,
            name: it.product.nameKa,
            price: it.product.price,
            quantity: it.quantity,
            image: it.product.img,
          })),
          total: totalPrice,
          recovered_at: null,
        };
        await supabase.from("abandoned_carts").upsert(payload as any, { onConflict: "user_id" });
      } catch {
        /* non-critical */
      }
    }, 2000);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [user, items, totalPrice]);
};

export const markCartRecovered = async (userId: string) => {
  try {
    await supabase
      .from("abandoned_carts")
      .update({ recovered_at: new Date().toISOString() })
      .eq("user_id", userId);
  } catch {
    /* non-critical */
  }
};