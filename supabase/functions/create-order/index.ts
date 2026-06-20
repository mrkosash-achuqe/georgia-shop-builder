import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, service);

    const body = await req.json().catch(() => null);
    if (!body?.order || !Array.isArray(body.items) || body.items.length === 0) {
      return json({ error: "Invalid order payload" }, 400);
    }

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert(body.order)
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      return json({ error: orderErr?.message || "Failed to create order" }, 500);
    }

    const itemsPayload = body.items.map((item: Record<string, unknown>) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsErr } = await admin.from("order_items").insert(itemsPayload);
    if (itemsErr) {
      await admin.from("orders").delete().eq("id", order.id);
      return json({ error: itemsErr.message }, 500);
    }

    if (body.promoId) {
      const { data: promo } = await admin
        .from("promo_codes")
        .select("used_count")
        .eq("id", body.promoId)
        .single();

      if (promo) {
        await admin
          .from("promo_codes")
          .update({ used_count: (promo.used_count ?? 0) + 1 })
          .eq("id", body.promoId);
      }
    }

    return json({ id: order.id, order_number: order.order_number });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
