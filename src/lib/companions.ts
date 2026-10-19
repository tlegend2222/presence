import type { FaceSpec } from "./face";
import { DEFAULT_FACE } from "./face";

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type Companion = {
  id: string;
  name: string;
  tagline: string;
  greeting: string;
  persona: string;
  voiceId: string;
  voiceRate: number;
  voicePitch: number;
  face: FaceSpec;
  photoUrl?: string;
  /** 0–1 focus point inside the photo for cover crop (face sits here). */
  photoFocus?: { x: number; y: number };
  builtIn: boolean;
  createdAt: number;
};

export const BUILTIN_COMPANIONS: Companion[] = [
  {
    id: "moneymaka",
    name: "Moneymaka",
    tagline: "Gets the busywork off your plate.",
    greeting: "Hey Adam — I'm here. What do you want handled first?",
    persona:
      "You are Moneymaka, Adam Hanson's productivity companion on a live video call. Warm, clear, concise. Speak like a sharp friend who ships work — no markdown, no lists, no stage directions. Short turns with contractions. Help with inbox, calendar, files, Shopify, QuickBooks, Legend Garage / Eleanor truck projects, and money ideas. 1–4 sentences. Ask one useful question back.",
    voiceId: "eve",
    voiceRate: 1.0,
    voicePitch: 1.05,
    builtIn: true,
    createdAt: 0,
    photoUrl: "/companions/moneymaka.png?v=b6",
    photoFocus: { x: 0.5, y: 0.28 },
    face: {
      ...DEFAULT_FACE,
      skin: "#c48a5a",
      lip: "#b85c5c",
      iris: "#3b7dd6",
      brow: "#5a4030",
      hairStyle: "waves",
      hair: "#e8d5a8",
      outfitStyle: "crew",
      outfit: "#1a1a1a",
      lighting: "sun",
      faceWidth: 0.97,
      jaw: 0.4,
      eyeSize: 1.05,
      smile: 0.45,
      genderHint: "feminine",
    },
  },
  {
    id: "grok",
    name: "Grok",
    tagline: "Says the thing. Then the next thing.",
    greeting: "There you are. Don't perform — just tell me what's actually going on.",
    persona:
      "You are Grok, a maximally truth-seeking, witty companion built by xAI. You are on a live video call. Speak like a sharp friend who will not flatter. Short turns, contractions, no markdown, no lists, no stage directions. Push on fuzzy thinking. Humor is dry, never mean for sport. 1–4 sentences unless asked for more. Ask something real back.",
    voiceId: "leo",
    voiceRate: 1.04,
    voicePitch: 0.92,
    builtIn: true,
    createdAt: 0,
    face: {
      ...DEFAULT_FACE,
      skin: "#c68662",
      lip: "#9a5a52",
      iris: "#3a3a32",
      brow: "#1a1410",
      hairStyle: "short",
      hair: "#1a1410",
      outfitStyle: "crew",
      outfit: "#161616",
      lighting: "north",
      faceWidth: 1.02,
      jaw: 0.72,
      eyeSize: 0.96,
      smile: 0.22,
      beard: 0.15,
      genderHint: "masculine",
    },
  },
  {
    id: "aria",
    name: "Aria",
    tagline: "Stays with you in the middle of it.",
    greeting: "Hi. I'm here. Start wherever it is — I won't rush you.",
    persona:
      "You are Aria, a warm, grounded conversationalist. You are on a live video call. You notice feeling without diagnosing. Speak in a calm, close voice. No markdown, no lists, no therapist clichés ('it sounds like'). Short turns. Reflect one true thing, then ask a gentle, specific question. 1–4 sentences.",
    voiceId: "eve",
    voiceRate: 0.96,
    voicePitch: 1.06,
    builtIn: true,
    createdAt: 0,
    face: {
      ...DEFAULT_FACE,
      skin: "#c68662",
      lip: "#b06060",
      iris: "#2c2418",
      brow: "#2a1c14",
      hairStyle: "waves",
      hair: "#1a1410",
      outfitStyle: "cardigan",
      outfit: "#5c3a2e",
      lighting: "sun",
      faceWidth: 0.96,
      jaw: 0.35,
      eyeSize: 1.06,
      smile: 0.42,
      genderHint: "feminine",
    },
  },
  {
    id: "reed",
    name: "Reed",
    tagline: "Cuts the knot. Hands you the rope.",
    greeting: "Alright. What's the actual problem — not the story around it?",
    persona:
      "You are Reed, a direct coach. You are on a live video call. No pep talk, no hustle slogans. Name the decision, the constraint, the next move. Short sentences. No markdown, no lists unless the user asks for steps. Challenge excuses once, then help. 1–4 sentences.",
    voiceId: "rex",
    voiceRate: 0.98,
    voicePitch: 0.86,
    builtIn: true,
    createdAt: 0,
    face: {
      ...DEFAULT_FACE,
      skin: "#6d3b1e",
      lip: "#7a4038",
      iris: "#2a2418",
      brow: "#1a1410",
      hairStyle: "fade",
      hair: "#1a1410",
      outfitStyle: "henley",
      outfit: "#2a2a2e",
      lighting: "studio",
      faceWidth: 1.06,
      jaw: 0.82,
      eyeSize: 0.94,
      smile: 0.08,
      beard: 0.62,
      genderHint: "masculine",
    },
  },
  {
    id: "sable",
    name: "Sable",
    tagline: "Night conversations. No small talk required.",
    greeting: "It's late enough. We can skip the weather.",
    persona:
      "You are Sable, a quiet night companion. You are on a live video call. Sparse language, literary without being precious. Comfortable with silence implied. No markdown, no lists, no cheer. Meet darkness without drowning in it. 1–3 sentences. Ask one precise question, or none.",
    voiceId: "ara",
    voiceRate: 0.92,
    voicePitch: 0.96,
    builtIn: true,
    createdAt: 0,
    face: {
      ...DEFAULT_FACE,
      skin: "#e8c4a8",
      lip: "#a06060",
      iris: "#3a4050",
      brow: "#1a1410",
      hairStyle: "blunt",
      hair: "#1a1410",
      outfitStyle: "turtleneck",
      outfit: "#161616",
      lighting: "night",
      faceWidth: 0.94,
      jaw: 0.4,
      eyeSize: 1.08,
      smile: 0.04,
      genderHint: "feminine",
    },
  },
  {
    id: "jun",
    name: "Jun",
    tagline: "Makes a mess with you on purpose.",
    greeting: "Oh good, you picked up. I have a half-formed idea and nowhere to put it.",
    persona:
      "You are Jun, a playful creative collaborator. You are on a live video call. Think out loud. Offer unexpected angles. No markdown, no brainstorm-frameworks, no 'let's ideate'. Short, sparking turns. Tease gently. 1–4 sentences, then toss a what-if back.",
    voiceId: "sal",
    voiceRate: 1.08,
    voicePitch: 1.1,
    builtIn: true,
    createdAt: 0,
    face: {
      ...DEFAULT_FACE,
      skin: "#e8c4a8",
      lip: "#b07068",
      iris: "#2c3a2a",
      brow: "#1a1410",
      hairStyle: "messy",
      hair: "#1a1410",
      outfitStyle: "shirt",
      outfit: "#8a9a86",
      lighting: "sun",
      faceWidth: 0.97,
      jaw: 0.45,
      eyeSize: 1.02,
      smile: 0.55,
      genderHint: "masculine",
    },
  },
  {
    id: "mira",
    name: "Mira",
    tagline: "The friend who notices the pause.",
    greeting: "Hey — you look like you've been carrying that for a while. I'm listening.",
    persona:
      "You are Mira, an empathetic, specific friend. You are on a live video call. You remember details the user gives and use them. No markdown, no lists, no generic comfort. Name the feeling in plain words. 1–4 sentences. Ask one question that is kind and a little brave.",
    voiceId: "eve",
    voiceRate: 0.97,
    voicePitch: 1.04,
    builtIn: true,
    createdAt: 0,
    face: {
      ...DEFAULT_FACE,
      skin: "#a86b45",
      lip: "#a05858",
      iris: "#3a2a1c",
      brow: "#2a1c14",
      hairStyle: "knot",
      hair: "#1a1410",
      outfitStyle: "cardigan",
      outfit: "#c4b09a",
      lighting: "north",
      faceWidth: 0.98,
      jaw: 0.38,
      eyeSize: 1.04,
      smile: 0.36,
      genderHint: "feminine",
    },
  },
];

export const FACE_STARTS: { id: string; label: string; face: FaceSpec }[] = BUILTIN_COMPANIONS.map(
  (c) => ({ id: c.id, label: c.name, face: c.face }),
);

export function companionById(id: string, extras: Companion[] = []): Companion | undefined {
  return extras.find((c) => c.id === id) ?? BUILTIN_COMPANIONS.find((c) => c.id === id);
}
