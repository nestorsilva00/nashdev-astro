export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatCompletionInput {
  messages: ChatMessage[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ChatCompletion {
  content: string;
  model: string;
  finishReason?: string;
}

export interface ChatProvider {
  readonly name: string;
  complete(input: ChatCompletionInput): Promise<ChatCompletion>;
}

export interface ChatApiRequest {
  messages: ChatMessage[];
}

export interface ChatApiResponse {
  answer: string;
  model: string;
  provider: string;
}

export interface ChatApiError {
  error: string;
}
