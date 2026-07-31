import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  ChatConfigurationError,
  getChatConfig,
} from "../../core/chat/config";
import { createChatProvider } from "../../core/chat/provider";
import { ChatProviderError } from "../../core/chat/errors";
import type { WorkersAiBinding } from "../../core/chat/providers/cloudflare-workers-ai";
import type {
  ChatApiError,
  ChatApiRequest,
  ChatApiResponse,
  ChatMessage,
} from "../../core/chat/types";

export const prerender = false;

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_TOTAL_LENGTH = 12_000;

const json = (
  body: ChatApiResponse | ChatApiError,
  status = 200,
): Response =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });

const isChatMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== "object") return false;

  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    message.content.length <= MAX_MESSAGE_LENGTH
  );
};

const parseMessages = (body: unknown): ChatMessage[] | null => {
  if (!body || typeof body !== "object") return null;

  const messages = (body as Partial<ChatApiRequest>).messages;
  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    !messages.every(isChatMessage)
  ) {
    return null;
  }

  const totalLength = messages.reduce(
    (length, message) => length + message.content.length,
    0,
  );

  if (
    totalLength > MAX_TOTAL_LENGTH ||
    messages[messages.length - 1]?.role !== "user"
  ) {
    return null;
  }

  return messages.map((message) => ({
    role: message.role,
    content: message.content.trim(),
  }));
};

const rejectWhenAborted = (signal: AbortSignal) =>
  new Promise<never>((_, reject) => {
    signal.addEventListener(
      "abort",
      () => reject(new DOMException("The request timed out.", "AbortError")),
      { once: true },
    );
  });

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const messages = parseMessages(body);

  if (!messages) {
    return json(
      {
        error:
          "Send 1–20 valid messages, ending with a user message. Each message may contain up to 2,000 characters.",
      },
      400,
    );
  }

  try {
    const runtimeEnvironment = env as unknown as Record<string, unknown>;
    const config = getChatConfig(runtimeEnvironment);
    const provider = createChatProvider(config, {
      cloudflareAi: runtimeEnvironment.AI as WorkersAiBinding | undefined,
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const completion = await Promise.race([
        provider.complete({
          messages,
          systemPrompt: config.systemPrompt,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          signal: controller.signal,
        }),
        rejectWhenAborted(controller.signal),
      ]);

      return json({
        answer: completion.content,
        model: completion.model,
        provider: provider.name,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error instanceof ChatConfigurationError) {
      console.error(`[chat] ${error.message}`);
      return json({ error: "The chat service is not configured." }, 503);
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      return json({ error: "The model took too long to respond." }, 504);
    }

    if (error instanceof ChatProviderError) {
      console.error(`[chat] Provider error: ${error.message}`);
      return json(
        { error: "The model provider could not complete the request." },
        502,
      );
    }

    console.error("[chat] Unexpected error:", error);
    return json({ error: "The chat service is temporarily unavailable." }, 500);
  }
};
