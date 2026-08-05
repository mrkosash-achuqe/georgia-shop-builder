import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const productId: string | undefined = body.productId;
    const lang: string = body.lang === "en" ? "en" : "ka";
    const limit = Math.min(Number(body.limit) || 4, 8);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name_ka, name_en, category, material, price, in_stock, rating")
      .eq("in_stock", true)
      .limit(60);
    if (error) throw error;

    const pool = (products ?? []).filter((p) => p.id !== productId);
    if (pool.length === 0) {
      return new Response(JSON.stringify({ ids: [], reason: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const current = productId ? (products ?? []).find((p) => p.id === productId) : null;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const catalog = pool
      .map((p) => `${p.id} | ${p.name_ka} / ${p.name_en} | ${p.category} | ${p.material} | ${p.price} GEL | ★${p.rating}`)
      .join("\n");

    const context = current
      ? `The shopper is viewing: ${current.name_ka} / ${current.name_en} (category: ${current.category}, material: ${current.material}, ${current.price} GEL).`
      : `The shopper is browsing the store home page.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a merchandising assistant for a Georgian handmade wooden goods store. Pick complementary products the shopper is most likely to buy together with, or instead of, the product they are viewing. Prefer variety: complementary categories and a similar price range. Never pick the product being viewed. Reply ONLY through the tool.",
          },
          {
            role: "user",
            content: `${context}\n\nCatalog (id | name | category | material | price | rating):\n${catalog}\n\nPick exactly ${limit} product ids. Write the short reason in ${lang === "ka" ? "Georgian" : "English"}.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend",
              description: "Return recommended product ids",
              parameters: {
                type: "object",
                properties: {
                  ids: { type: "array", items: { type: "string" }, description: "Product ids, best first" },
                  reason: { type: "string", description: "One short sentence explaining the selection" },
                },
                required: ["ids", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recommend" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      // graceful fallback: same-category picks
      const fallback = pool
        .filter((p) => !current || p.category === current.category)
        .concat(pool)
        .slice(0, limit)
        .map((p) => p.id);
      return new Response(JSON.stringify({ ids: [...new Set(fallback)].slice(0, limit), reason: "" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { ids: [], reason: "" };
    const valid: string[] = (args.ids ?? []).filter((id: string) => pool.some((p) => p.id === id)).slice(0, limit);

    return new Response(JSON.stringify({ ids: valid, reason: args.reason ?? "" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});