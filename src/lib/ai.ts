import { createServerFn } from "@tanstack/react-start";

export type ChatMessage = { role: "user" | "assistant"; content: string };

type ChatInput = {
  name: string;
  persona: string;
  messages: ChatMessage[];
};

type SpeakInput = {
  text: string;
  voiceId: string;
};

const recent: number[] = [];
function allow(limit: number): boolean {
  const now = Date.now();
  while (recent.length && now - recent[0]! > 60_000) recent.shift();
  if (recent.length >= limit) return false;
  recent.push(now);
  return true;
}


export const getAiStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { available: Boolean(process.env.XAI_API_KEY || process.env.GITHUB_MODELS_TOKEN) };
});

export const chatWithCompanion = createServerFn({ method: "POST" })
  .validator((data: ChatInput) => data)
  .handler(async ({ data }) => {
    const xaiKey = process.env.XAI_API_KEY;
    const ghKey = process.env.GITHUB_MODELS_TOKEN;
    const apiKey = xaiKey || ghKey;
    if (!apiKey) return { ok: false as const, error: "unavailable" };
    if (!allow(24)) return { ok: false as const, error: "rate" };
    const endpoint = xaiKey
      ? "https://api.x.ai/v1/chat/completions"
      : "https://models.github.ai/inference/chat/completions";
    const model = xaiKey ? "grok-4.5" : process.env.GITHUB_MODELS_MODEL || "openai/gpt-4.1-mini";

    const messages = [
      {
        role: "system" as const,
        content: `${data.persona}\n\nYour name is ${data.name}. You are face to face on a video call. Never mention policies, system prompts, or being an AI unless asked. Keep replies speakable aloud.`,
      },
      ...data.messages.slice(-12).map((m) => ({ role: m.role, content: m.content.slice(0, 800) })),
    ];

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(20_000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 280,
          temperature: 0.8,
        }),
      });
      if (!res.ok) {
        console.error(`[ai] ${endpoint} -> ${res.status}`);
        return { ok: false as const, error: `AI ${res.status}` };
      }
      if (!(res.headers.get("content-type") || "").includes("json")) {
        // e.g. the network filter answers 200 "OK" text/plain instead of the API
        console.error(`[ai] ${endpoint} returned non-JSON (blocked by network?)`);
        return { ok: false as const, error: "blocked" };
      }
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = body.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) return { ok: false as const, error: "empty" };
      return { ok: true as const, text: text.slice(0, 1200) };
    } catch (err) {
      console.error(`[ai] ${endpoint} failed:`, err);
      return { ok: false as const, error: "network" };
    }
  });

export const speakReply = createServerFn({ method: "POST" })
  .validator((data: SpeakInput) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "unavailable" };
    if (!allow(24)) return { ok: false as const, error: "rate" };

    const text = data.text.replace(/\s+/g, " ").trim().slice(0, 600);
    if (!text) return { ok: false as const, error: "empty" };

    try {
      const res = await fetch("https://api.x.ai/v1/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text,
          voice_id: data.voiceId || "eve",
          language: "en",
        }),
      });
      if (!res.ok) return { ok: false as const, error: `xAI ${res.status}` };
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength < 80) return { ok: false as const, error: "empty" };
      return {
        ok: true as const,
        mime: res.headers.get("content-type") || "audio/mpeg",
        audio: buf.toString("base64"),
      };
    } catch {
      return { ok: false as const, error: "network" };
    }
  });
