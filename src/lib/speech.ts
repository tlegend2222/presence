export type BrowserVoice = {
  uri: string;
  name: string;
  lang: string;
};

type Recog = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
};

function SR(): (new () => Recog) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recog; webkitSpeechRecognition?: new () => Recog };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canListen(): boolean {
  return SR() !== null;
}

export function listenOnce(onInterim: (t: string) => void): Promise<string> {
  const Ctor = SR();
  if (!Ctor) return Promise.reject(new Error("Voice input is not available here."));

  return new Promise((resolve, reject) => {
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    let finalText = "";
    rec.onresult = (ev) => {
      let interim = "";
      for (let i = 0; i < ev.results.length; i++) {
        const row = ev.results[i];
        if (!row) continue;
        if (row.isFinal) finalText += row[0].transcript;
        else interim += row[0].transcript;
      }
      onInterim((finalText + " " + interim).trim());
    };
    rec.onerror = (ev) => {
      reject(new Error(ev.error === "not-allowed" ? "Microphone permission is off." : "Couldn't hear that."));
    };
    rec.onend = () => resolve(finalText.trim());
    rec.start();
  });
}

export function listVoices(): BrowserVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices().map((v) => ({
    uri: v.voiceURI,
    name: v.name,
    lang: v.lang,
  }));
}

export function pickVoice(hint: { pitch: number; gender?: string }): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (!voices.length) return window.speechSynthesis.getVoices()[0] ?? null;
  const feminine = /female|samantha|victoria|karen|moira|tessa|fiona|zira|susan|siri|eve/i;
  const masculine = /male|daniel|david|alex|fred|tom|daniel|george|gordon|reed/i;
  const wantF = hint.pitch >= 1;
  const ranked = voices.filter((v) => (wantF ? feminine.test(v.name) : masculine.test(v.name)));
  return ranked[0] ?? voices[0] ?? null;
}

export function speakBrowser(
  text: string,
  opts: { rate: number; pitch: number; onBoundary?: () => void },
): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.reject(new Error("Speech is not available."));
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate;
  u.pitch = opts.pitch;
  const voice = pickVoice({ pitch: opts.pitch });
  if (voice) u.voice = voice;
  u.onboundary = () => opts.onBoundary?.();
  return new Promise((resolve, reject) => {
    u.onend = () => resolve();
    u.onerror = () => reject(new Error("Speech failed."));
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
}

export async function playBase64Audio(
  audio: string,
  mime: string,
  onLevel?: (n: number) => void,
): Promise<void> {
  const url = `data:${mime};base64,${audio}`;
  const el = new Audio(url);
  el.preload = "auto";

  let ctx: AudioContext | null = null;
  let raf = 0;
  try {
    ctx = new AudioContext();
    const src = ctx.createMediaElementSource(el);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i]!;
      onLevel?.((sum / data.length / 255) * 1.8);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  } catch {
    ctx = null;
  }

  await new Promise<void>((resolve, reject) => {
    el.onended = () => resolve();
    el.onerror = () => reject(new Error("Audio failed."));
    void el.play().catch(reject);
  }).finally(() => {
    cancelAnimationFrame(raf);
    onLevel?.(0);
    void ctx?.close();
  });
}
