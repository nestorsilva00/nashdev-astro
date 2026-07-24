import { ChatProviderError } from "../errors";
import type {
  ChatCompletion,
  ChatCompletionInput,
  ChatProvider,
} from "../types";

interface WorkersAiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface WorkersAiInput {
  messages: WorkersAiMessage[];
  stream: false;
  temperature?: number;
  max_tokens?: number;
}

export interface WorkersAiBinding {
  run(model: string, input: WorkersAiInput): Promise<unknown>;
}

interface WorkersAiResponse {
  response?: string;
}

export class CloudflareWorkersAiProvider implements ChatProvider {
  readonly name = "cloudflare-workers-ai";

  constructor(
    private readonly ai: WorkersAiBinding,
    private readonly model: string,
  ) {}

  async complete(input: ChatCompletionInput): Promise<ChatCompletion> {
    let result: unknown;

    try {
      result = await this.ai.run(this.model, {
        messages: [
          { role: "system", content: input.systemPrompt },
          ...input.messages,
        ],
        stream: false,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
      });
    } catch (error) {
      if (input.signal?.aborted) throw error;

      throw new ChatProviderError(
        error instanceof Error
          ? error.message
          : "Workers AI could not complete the request.",
      );
    }

    const response = result as WorkersAiResponse | null;
    const content =
      typeof response?.response === "string" ? response.response.trim() : "";

    if (!content) {
      throw new ChatProviderError("Workers AI returned an empty response.");
    }

    return {
      content,
      model: this.model,
    };
  }
}
