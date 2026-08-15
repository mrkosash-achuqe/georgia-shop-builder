import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { orderNumber, contact } = await req.json().catch(() => ({}));
    const num = String(orderNumber || "").trim().toUpperCase();
    const cnt = String(contact || "").trim().toLowerCase();
    if (!num || !cnt) return json({ error: "missing" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, status, created_at, updated_at, first_name, last_name, email, phone, city, address, subtotal, shipping_fee, discount, total, payment_method")
      .eq("order_number", num)
      .maybeSingle();
    if (error) throw error;

    const digits = (v: string) => v.replace(/\D/g, "");
    const ok = order && (
      String(order.email || "").toLowerCase() === cnt ||
      (digits(cnt).length >= 6 && digits(String(order.phone || "")).endsWith(digits(cnt)))
    );
    if (!ok) return json({ error: "not_found" }, 404);

    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, product_image, quantity, unit_price")
      .eq("order_id", order.id);

    return json({
      order: {
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        customer: `${order.first_name} ${order.last_name}`,
        city: order.city,
        address: order.address,
        payment_method: order.payment_method,
        subtotal: order.subtotal,
        shipping_fee: order.shipping_fee,
        discount: order.discount,
        total: order.total,
      },
      items: items ?? [],
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
