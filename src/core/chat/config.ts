export type ChatProviderName =
  | "cloudflare-workers-ai"
  | "openai-compatible";

interface CommonChatConfig {
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}

export type ChatConfig = CommonChatConfig &
  (
    | {
        provider: "cloudflare-workers-ai";
      }
    | {
        provider: "openai-compatible";
        baseUrl: string;
        apiKey?: string;
      }
  );

export type ChatRuntimeEnvironment = Record<string, unknown>;

const DEFAULT_SYSTEM_PROMPT = `You are the assistant for Nestor's professional website.
Answer questions about Nestor's experience, projects, skills, and writing.
Be concise and factual. If the available context does not contain the answer,
say that you do not know instead of inventing information.`;

export class ChatConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatConfigurationError";
  }
}

const serverEnv = {
  CHAT_PROVIDER: import.meta.env.CHAT_PROVIDER,
  CHAT_BASE_URL: import.meta.env.CHAT_BASE_URL,
  CHAT_API_KEY: import.meta.env.CHAT_API_KEY,
  CHAT_MODEL: import.meta.env.CHAT_MODEL,
  CHAT_SYSTEM_PROMPT: import.meta.env.CHAT_SYSTEM_PROMPT,
  CHAT_TEMPERATURE: import.meta.env.CHAT_TEMPERATURE,
  CHAT_MAX_TOKENS: import.meta.env.CHAT_MAX_TOKENS,
  CHAT_TIMEOUT_MS: import.meta.env.CHAT_TIMEOUT_MS,
};

type ChatEnvName = keyof typeof serverEnv;

const getEnv = (
  name: ChatEnvName,
  runtimeEnvironment?: ChatRuntimeEnvironment,
) => {
  const runtimeValue = runtimeEnvironment?.[name];
  const value =
    typeof runtimeValue === "string" ? runtimeValue : serverEnv[name];
  return typeof value === "string" ? value.trim() : "";
};

const getNumber = (
  name: ChatEnvName,
  fallback: number,
  limits: { min: number; max: number },
  runtimeEnvironment?: ChatRuntimeEnvironment,
) => {
  const value = getEnv(name, runtimeEnvironment);
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < limits.min || parsed > limits.max) {
    throw new ChatConfigurationError(
      `${name} must be between ${limits.min} and ${limits.max}.`,
    );
  }

  return parsed;
};

export const getChatConfig = (
  runtimeEnvironment?: ChatRuntimeEnvironment,
): ChatConfig => {
  const provider =
    getEnv("CHAT_PROVIDER", runtimeEnvironment) || "openai-compatible";
  if (
    provider !== "cloudflare-workers-ai" &&
    provider !== "openai-compatible"
  ) {
    throw new ChatConfigurationError(
      `Unsupported CHAT_PROVIDER "${provider}".`,
    );
  }

  const model = getEnv("CHAT_MODEL", runtimeEnvironment);

  if (!model) {
    throw new ChatConfigurationError("CHAT_MODEL is not configured.");
  }

  const commonConfig: CommonChatConfig = {
    model,
    systemPrompt:
      getEnv("CHAT_SYSTEM_PROMPT", runtimeEnvironment) ||
      DEFAULT_SYSTEM_PROMPT,
    temperature: getNumber(
      "CHAT_TEMPERATURE",
      0.2,
      { min: 0, max: 2 },
      runtimeEnvironment,
    ),
    maxTokens: getNumber(
      "CHAT_MAX_TOKENS",
      500,
      { min: 1, max: 4096 },
      runtimeEnvironment,
    ),
    timeoutMs: getNumber(
      "CHAT_TIMEOUT_MS",
      45_000,
      {
        min: 1_000,
        max: 120_000,
      },
      runtimeEnvironment,
    ),
  };

  if (provider === "cloudflare-workers-ai") {
    return { ...commonConfig, provider };
  }

  const baseUrl = getEnv("CHAT_BASE_URL", runtimeEnvironment);
  if (!baseUrl) {
    throw new ChatConfigurationError("CHAT_BASE_URL is not configured.");
  }

  try {
    new URL(baseUrl);
  } catch {
    throw new ChatConfigurationError("CHAT_BASE_URL must be a valid URL.");
  }

  return {
    ...commonConfig,
    provider,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey: getEnv("CHAT_API_KEY", runtimeEnvironment) || undefined,
  };
};
