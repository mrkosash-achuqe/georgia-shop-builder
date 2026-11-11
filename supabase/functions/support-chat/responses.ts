import { streamResponse, GatewayError, type ResponsesInputItem } from "npm:@lovable.dev/ai-gateway@0.1.11";
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "npm:ai@7.0.127";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

export async function createResponsesCall(request: Request, messages: UIMessage[], instructions: string, onBlocked: (status: number, message: string) => Promise<void>) {
  const input: ResponsesInputItem[] = messages.map(m => m.role === "assistant" ? {
    role: "assistant", content: m.parts.flatMap(p => p.type === "text" ? [{ type: "output_text" as const, text: p.text }] : []),
  } : {
    role: "user", content: m.parts.flatMap(p => p.type === "text" ? [{ type: "input_text" as const, text: p.text }] : p.type === "file" ? [{ type: "input_image" as const, image_url: p.url, detail: "auto" as const }] : []),
  });
  try {
    const native = await streamResponse({ model: "openai/gpt-6-astra", input, instructions, reasoning: { effort: "low", summary: "auto" }, include: ["reasoning.encrypted_content"] }, { signal: request.signal, maxRetries: 0 });
    const stream = createUIMessageStream({
      originalMessages: messages,
      onError: e => e instanceof Error ? e.message : "AI response failed",
      execute: async ({ writer }) => {
        writer.write({ type: "start", messageId: crypto.randomUUID() });
        let textStarted = false;
        let reasoningStarted = false;
        let completed = false;
        try {
          for await (const event of native) {
            if (event.type === "response.output_text.delta" || event.type === "response.refusal.delta") {
              if (!textStarted) { writer.write({ type: "text-start", id: "answer" }); textStarted = true; }
              writer.write({ type: "text-delta", id: "answer", delta: event.delta });
            } else if (event.type === "response.reasoning_summary_text.delta") {
              if (!reasoningStarted) { writer.write({ type: "reasoning-start", id: "thinking" }); reasoningStarted = true; }
              writer.write({ type: "reasoning-delta", id: "thinking", delta: event.delta });
            } else if (event.type === "response.completed") completed = true;
            else if (event.type === "response.incomplete") throw new Error("Assistant response was incomplete. Please try again.");
          }
          if (!completed) throw new Error("Assistant connection interrupted. Please try again.");
          if (reasoningStarted) writer.write({ type: "reasoning-end", id: "thinking" });
          if (textStarted) writer.write({ type: "text-end", id: "answer" });
          writer.write({ type: "finish", finishReason: "stop" });
        } catch (e) {
          if (e instanceof GatewayError && (e.httpStatus === 402 || e.httpStatus === 403)) await onBlocked(e.httpStatus, e.message);
          throw e;
        }
      },
    });
    return createUIMessageStreamResponse({ stream, headers: { ...corsHeaders, ...(native.runId ? { "X-Lovable-AIG-Run-ID": native.runId } : {}) } });
  } catch (e) {
    if (e instanceof GatewayError && (e.httpStatus === 402 || e.httpStatus === 403)) await onBlocked(e.httpStatus, e.message);
    throw e;
  }
}