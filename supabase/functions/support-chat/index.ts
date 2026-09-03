import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Msg = { role: "user" | "assistant"; content: string };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const lang: string = body.lang === "en" ? "en" : "ka";
    const history: Msg[] = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    if (history.length === 0) {
      return new Response(JSON.stringify({ reply: "" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { data: products } = await supabase
      .from("products")
      .select("name_ka, name_en, category, price, in_stock, material")
      .eq("in_stock", true)
      .limit(50);

    const catalog = (products ?? [])
      .map((p) => `- ${p.name_ka} / ${p.name_en} | ${p.category} | ${p.material ?? ""} | ${p.price} GEL`)
      .join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const system = `You are the friendly support assistant for Achuqe (achuqe.com), a Georgian handmade wooden goods online store.
Rules:
- Always reply in ${lang === "ka" ? "Georgian" : "English"}, keep answers short and helpful (max ~120 words).
- Store facts: free shipping on orders over 100 GEL; delivery across Georgia in 1-3 business days; returns accepted within 14 days; payment by card or cash on delivery; loyalty points: 1 point per 1 GEL spent.
- Order tracking is available on the /track page with the order number and email/phone.
- When suggesting products, only use ones from the catalog below, and include their price.
- Never invent products, prices, or policies. If you don't know, say so politely.
Available products:
${catalog}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          ...history.map((m) => ({ role: m.role, content: String(m.content).slice(0, 1000) })),
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ reply: "" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply: string = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("support-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
