import type { ChatTurn, Companion } from "./companions";

function lastUser(history: ChatTurn[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]?.role === "user") return history[i]!.content.trim();
  }
  return "";
}

function clip(text: string, n = 90): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n).replace(/\s+\S*$/, "")}…`;
}

function isQuestion(text: string): boolean {
  return /[?]|^(who|what|why|how|when|where|do|does|did|can|could|would|is|are|am|should)\b/i.test(
    text,
  );
}

function isGreeting(text: string): boolean {
  return /^(hi|hey|hello|yo|sup|good (morning|afternoon|evening)|howdy)\b/i.test(text);
}

function isFeeling(text: string): boolean {
  return /(sad|anxious|stress|tired|lonely|angry|lost|overwhelm|scared|empty|excited|happy|stuck)/i.test(
    text,
  );
}

export function localReply(companion: Companion, history: ChatTurn[]): string {
  const user = lastUser(history);
  const name = companion.name;
  const bit = clip(user, 72);

  if (!user) return companion.greeting;

  if (isGreeting(user)) {
    const map: Record<string, string> = {
      grok: "Hey. Skip the warm-up if you want — I'm already here.",
      aria: "Hi. Take a breath. I'm not going anywhere.",
      reed: "Hey. Clock's running either way. What's the move?",
      sable: "Hello. We don't have to start at the beginning.",
      jun: "Hi — I was just spinning something. Want in, or do you have your own mess?",
      mira: "Hey. I heard you. Come in.",
      moneymaka: "Hey. Skip the small talk if you want — what are we clearing?",
    };
    return map[companion.id] ?? `Hi. I'm ${name}. I'm here.`;
  }

  if (/who are you|your name|what are you/i.test(user)) {
    return `${companion.tagline} I'm ${name}. That's enough biography — what do you need from this call?`;
  }

  if (isFeeling(user)) {
    const map: Record<string, string> = {
      grok: `Don't sand that down. "${bit}" is the honest version. What happens if you stop managing it for one minute?`,
      aria: `That's a heavy thing to be walking around with. Stay with "${bit}" for a second — where does it sit?`,
      reed: `Name it, then we work it. What's the smallest action that doesn't ignore "${bit}"?`,
      sable: `Yes. That. We can sit next to "${bit}" without turning the lights all the way up.`,
      jun: `Ugly feelings are still material. What would "${bit}" look like if we made something from it instead of hiding it?`,
      mira: `I heard the pause in that. "${bit}" — you don't have to make it prettier for me.`,
      moneymaka: `"${bit}" is real. Want to talk it through, or pick one next action and I'll help execute?`,
    };
    return map[companion.id] ?? `I'm with you on that. Tell me the part you usually skip.`;
  }

  if (isQuestion(user)) {
    const map: Record<string, string> = {
      grok: `I'd rather not fake a perfect answer. The interesting part of "${bit}" is what you already suspect. Say that out loud.`,
      aria: `That's a real question. Before we chase an answer — what would a kind one even look like for you?`,
      reed: `Treat it as a decision, not a riddle. If you had to choose tonight on "${bit}", which way do you lean?`,
      sable: `Some questions are better held than solved. What would it cost you to leave "${bit}" unanswered until morning?`,
      jun: `Wrong question, maybe. Flip it: if "${bit}" were a dare, what's the funniest serious answer?`,
      mira: `I won't rush you to a tidy answer. What's the version of "${bit}" you haven't asked anyone else?`,
      moneymaka: `For "${bit}" — I can brainstorm or I can do. Which do you want first?`,
    };
    return map[companion.id] ?? `Tell me what you already think, and I'll push on it.`;
  }

  const map: Record<string, string> = {
    grok: `Alright — "${bit}". That's either truer than you meant or vaguer than you think. Which is it?`,
    aria: `I'm with you. Say a little more about "${bit}" — the part under the first sentence.`,
    reed: `Got it. "${bit}" is the situation. What's the constraint you keep leaving out?`,
    sable: `I heard that. We can stay on "${bit}" without turning it into a project.`,
    jun: `"${bit}" — okay, that's a spark. Want to wreck it into something weirder, or keep it close?`,
    mira: `Thank you for saying it. "${bit}" — do you want company with that, or a push?`,
    moneymaka: `Got "${bit}". Tell me the outcome you want and I'll move toward it.`,
  };

  return (
    map[companion.id] ??
    `I'm here with that. Tell me the next true sentence about "${bit}".`
  );
}
