// 通用 OpenAI 相容 client：OpenRouter 與本地代理（如 127.0.0.1:8765）共用同一份。
// 用 env 切換，不再為每家各寫一個 client。
export interface ChatMsg { role: "system" | "user" | "assistant" | "tool"; content: string; tool_calls?: any[]; tool_call_id?: string; name?: string }

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  /** openrouter | custom | none：只用來打 log 與錯誤訊息，不進 prompt */
  provider: "openrouter" | "custom" | "none";
}

export function resolveLlmConfig(): LlmConfig {
  const customBase = (process.env.LLM_BASE_URL ?? "").trim();
  const baseUrl = customBase || "https://openrouter.ai/api/v1";
  const provider = customBase ? "custom" : (process.env.OPENROUTER_API_KEY ? "openrouter" : "none");
  const apiKey = (process.env.LLM_API_KEY ?? "").trim() || (process.env.OPENROUTER_API_KEY ?? "").trim();
  const model = (process.env.LLM_MODEL ?? "").trim() || (process.env.OPENROUTER_MODEL ?? "").trim();
  return {
    baseUrl,
    apiKey,
    model,
    maxTokens: Number(process.env.LLM_MAX_TOKENS ?? 2048),
    temperature: Number(process.env.LLM_TEMPERATURE ?? 0.5),
    provider: apiKey ? provider : "none",
  };
}

export async function chatWithTools(args: {
  config: LlmConfig; messages: ChatMsg[]; tools: unknown; toolChoice?: string;
}): Promise<any> {
  const { config } = args;
  if (!config.model) throw new Error("有端點但沒設模型：請設 LLM_MODEL（本地代理如 webchat/auto）");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };
  if (config.baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "http://localhost:5173";
    headers["X-Title"] = "MIDIstudio";
  }
  const res = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: args.messages,
      tools: args.tools,
      tool_choice: args.toolChoice ?? "auto",
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`${config.provider} ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (!data.choices?.[0]) throw new Error(`${config.provider} 回傳無 choices`);
  return data.choices[0].message;
}
