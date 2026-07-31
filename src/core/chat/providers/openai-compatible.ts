import type {
  ChatCompletion,
  ChatCompletionInput,
  ChatProvider,
} from "../types";
import { ChatProviderError } from "../errors";

interface OpenAiCompatibleConfig {
  baseUrl: string;
  apiKey?: string;
  model: string;
}

type OpenAiContent =
  | string
  | Array<{ type?: string; text?: string }>
  | null
  | undefined;

interface OpenAiCompatibleResponse {
  model?: string;
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      content?: OpenAiContent;
    };
  }>;
  error?: {
    message?: string;
  };
}

const readContent = (content: OpenAiContent) => {
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("")
      .trim();
  }

  return "";
};

export class OpenAiCompatibleProvider implements ChatProvider {
  readonly name = "openai-compatible";

  constructor(private readonly config: OpenAiCompatibleConfig) {}

  async complete(input: ChatCompletionInput): Promise<ChatCompletion> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.config.apiKey
          ? { Authorization: `Bearer ${this.config.apiKey}` }
          : {}),
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: "system", content: input.systemPrompt },
          ...input.messages,
        ],
        stream: false,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
      }),
      signal: input.signal,
    });

    const payload = (await response.json().catch(() => null)) as
      | OpenAiCompatibleResponse
      | null;

    if (!response.ok) {
      throw new ChatProviderError(
        payload?.error?.message ||
          `The model provider returned HTTP ${response.status}.`,
        response.status,
      );
    }

    const choice = payload?.choices?.[0];
    const content = readContent(choice?.message?.content);

    if (!content) {
      throw new ChatProviderError(
        "The model provider returned an empty response.",
        response.status,
      );
    }

    return {
      content,
      model: payload?.model || this.config.model,
      finishReason: choice?.finish_reason || undefined,
    };
  }
}
