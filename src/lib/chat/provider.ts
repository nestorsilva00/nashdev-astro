import { ChatConfigurationError, type ChatConfig } from "./config";
import {
  CloudflareWorkersAiProvider,
  type WorkersAiBinding,
} from "./providers/cloudflare-workers-ai";
import { OpenAiCompatibleProvider } from "./providers/openai-compatible";
import type { ChatProvider } from "./types";

interface ChatProviderBindings {
  cloudflareAi?: WorkersAiBinding;
}

export const createChatProvider = (
  config: ChatConfig,
  bindings: ChatProviderBindings = {},
): ChatProvider => {
  switch (config.provider) {
    case "cloudflare-workers-ai":
      if (!bindings.cloudflareAi) {
        throw new ChatConfigurationError(
          "The Cloudflare Workers AI binding is unavailable.",
        );
      }

      return new CloudflareWorkersAiProvider(
        bindings.cloudflareAi,
        config.model,
      );

    case "openai-compatible":
      return new OpenAiCompatibleProvider({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        model: config.model,
      });
  }
};
