import { createOpenAI } from "npm:@ai-sdk/openai@4.0.83";
import { streamText, type ModelMessage } from "npm:ai@7.0.127";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id.ts";

export function createResponsesCall(
  request: Request,
  config: { baseURL: string; apiKey: string; model: string },
  messages: ModelMessage[],
  instructions?: string,
  onBlocked?: (status: number, message: string) => Promise<void>,
) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  let resolveStatus: (value: { status: number; message: string } | null) => void = () => {};
  const statusReady = new Promise<{ status: number; message: string } | null>(resolve => { resolveStatus = resolve; });
  const provider = createOpenAI({
    baseURL: `${config.baseURL.replace(/\/+$/, "").replace(/\/v1$/, "")}/v1`,
    apiKey: config.apiKey,
    headers: { "Lovable-API-Key": config.apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      try {
        const response = await runIdFetch.fetch(input, init);
        if (!response.ok) {
          const body = await response.clone().json().catch(() => ({}));
          const message = body.message || body.error?.message || `AI request failed (${response.status})`;
          if (response.status === 402 || response.status === 403) await onBlocked?.(response.status, message);
          resolveStatus({ status: response.status, message });
        } else resolveStatus(null);
        return response;
      } catch (error) { resolveStatus({ status: 503, message: "AI connection unavailable" }); throw error; }
    },
  });
  const reasoning = config.model !== "openai/chat-latest";
  const result = streamText({
    model: provider.responses(config.model),
    // AI SDK 6 lacks `instructions`: rename this key to `system` there.
    ...(instructions ? { instructions } : {}),
    messages,
    maxRetries: 0,
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        store: false,
        ...(reasoning
          ? {
              forceReasoning: true,
               reasoningEffort: "low",
              reasoningSummary: "auto",
              include: ["reasoning.encrypted_content"],
            }
          : {}),
      },
    },
  });
  return {
    result,
    response: async (options: Parameters<typeof result.toUIMessageStreamResponse>[0], headers: HeadersInit) => {
      const stream = withLovableAiGatewayRunIdHeader(result.toUIMessageStreamResponse(options), runIdFetch, headers);
      const failure = await statusReady;
      if (failure) {
        const unused = await stream;
        await unused.body?.cancel().catch(() => {});
        return new Response(JSON.stringify({ error: failure.message }), { status: failure.status, headers: { ...Object.fromEntries(new Headers(headers)), "Content-Type": "application/json" } });
      }
      return stream;
    },
  };
}
