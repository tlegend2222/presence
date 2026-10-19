import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Captions,
  CaptionsOff,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Video,
  VideoOff,
} from "lucide-react";
import { toast } from "sonner";
import { CompanionFace } from "@/components/companion-face";
import { Button } from "@/components/ui/button";
import { chatWithCompanion, getAiStatus, speakReply } from "@/lib/ai";
import type { ChatTurn, Companion } from "@/lib/companions";
import { localReply } from "@/lib/local-talk";
import { canListen, listenOnce, playBase64Audio, speakBrowser, stopSpeaking } from "@/lib/speech";
import { usePresence } from "@/lib/store";
import { cn, formatDuration } from "@/lib/utils";

type Phase = "ringing" | "live";

const EMPTY_HISTORY: ChatTurn[] = [];

export function CallView({ companion }: { companion: Companion }) {
  const navigate = useNavigate();
  const addTurn = usePresence((s) => s.addTurn);
  const captionsOn = usePresence((s) => s.captions);
  const setCaptions = usePresence((s) => s.setCaptions);
  const history = usePresence((s) => s.transcripts[companion.id]) ?? EMPTY_HISTORY;

  const [phase, setPhase] = useState<Phase>("ringing");
  const [seconds, setSeconds] = useState(0);
  const [draft, setDraft] = useState("");
  const [caption, setCaption] = useState(companion.greeting);
  const [userLine, setUserLine] = useState("");
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [mouth, setMouth] = useState(0);
  const [camOn, setCamOn] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const greetedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const historyRef = useRef(history);
  historyRef.current = history;

  useEffect(() => {
    let cancelled = false;
    void getAiStatus().then((status) => {
      if (!cancelled && status && !status.available) setLocalMode(true);
    }).catch(() => {
      if (!cancelled) setLocalMode(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setPhase("live"), 1400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "live") return;
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  // Keep the face alive while waiting on a reply.
  useEffect(() => {
    if (!busy || speaking) return;
    let raf = 0;
    const tick = (now: number) => {
      setMouth(0.12 + Math.abs(Math.sin(now / 160)) * 0.22);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setMouth(0);
    };
  }, [busy, speaking]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  async function toggleCam() {
    if (camOn) {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCamOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 480, height: 640 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamOn(true);
    } catch {
      toast("Camera isn't available. You can still talk.");
    }
  }

  async function speakLine(text: string) {
    setSpeaking(true);
    setMouth(0.35);
    let pump = 0;
    const drive = window.setInterval(() => {
      setMouth(0.25 + Math.random() * 0.7);
    }, 90);
    try {
      const tts = await speakReply({ data: { text, voiceId: companion.voiceId } });
      if (tts.ok) {
        await playBase64Audio(tts.audio, tts.mime, (n) => setMouth(Math.min(1, Math.max(0.2, n))));
        return;
      }
      await speakBrowser(text, {
        rate: companion.voiceRate,
        pitch: companion.voicePitch,
        onBoundary: () => setMouth(0.35 + Math.random() * 0.6),
      });
    } catch {
      /* captions still carry the line — keep pumping so the face still moves */
      await new Promise((r) => window.setTimeout(r, Math.min(4000, 40 * text.length)));
    } finally {
      window.clearInterval(drive);
      void pump;
      setMouth(0);
      setSpeaking(false);
    }
  }

  useEffect(() => {
    if (phase !== "live" || greetedRef.current) return;
    greetedRef.current = true;
    void speakLine(companion.greeting);
  }, [phase, companion.greeting]);

  async function send(text: string) {
    const trimmed = text.replace(/\s+/g, " ").trim().slice(0, 500);
    if (!trimmed || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setDraft("");
    setUserLine(trimmed);
    addTurn(companion.id, { role: "user", content: trimmed });
    const nextHistory = [...historyRef.current, { role: "user" as const, content: trimmed }];

    let reply = "";
    try {
      const res = await chatWithCompanion({
        data: {
          name: companion.name,
          persona: companion.persona,
          messages: nextHistory,
        },
      });
      if (res.ok) {
        reply = res.text;
        setLocalMode(false);
      } else {
        reply = localReply(companion, nextHistory);
        setLocalMode(true);
      }
    } catch {
      reply = localReply(companion, nextHistory);
      setLocalMode(true);
    }

    addTurn(companion.id, { role: "assistant", content: reply });
    setCaption(reply);
    setBusy(false);
    busyRef.current = false;
    await speakLine(reply);
  }

  async function onMic() {
    if (listening || busy) return;
    if (!canListen()) {
      toast("Voice input isn't available in this browser. Type instead.");
      return;
    }
    setListening(true);
    try {
      const text = await listenOnce((interim) => setDraft(interim));
      setListening(false);
      if (text) await send(text);
    } catch (err) {
      setListening(false);
      toast(err instanceof Error ? err.message : "Couldn't hear that.");
    }
  }

  function hangUp() {
    stopSpeaking();
    void navigate({ to: "/" });
  }

  return (
    <div className="bg-bg relative min-h-dvh overflow-hidden text-fg">
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {/* Phone-shaped stage on wide desktops so the face isn’t sliced and watches better from a phone. */}
        <div
          className={cn(
            "relative h-full w-full max-w-[min(100%,calc(100dvh*9/16))] overflow-hidden",
            phase === "live" && "portrait-ken",
          )}
        >
          <CompanionFace
            companion={companion}
            alt={companion.name}
            live
            speaking={speaking || busy}
            mouth={mouth}
            className="h-full w-full"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/40" />
      </div>

      {phase === "ringing" ? (
        <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
          <div className="portrait-ring relative size-28 overflow-hidden rounded-full shadow-[var(--shadow-border)]">
            <CompanionFace companion={companion} alt="" live speaking={false} mouth={0.08} className="h-full w-full" />
          </div>
          <p className="mt-6 font-serif text-3xl tracking-tight">{companion.name}</p>
          <p className="mt-2 text-sm text-muted">Calling…</p>
        </div>
      ) : (
        <>
          <header className="relative z-10 flex items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
            <div>
              <p className="font-serif text-xl leading-tight tracking-tight">{companion.name}</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted tabular-nums">
                <span className="bg-live inline-block size-1.5 rounded-full" />
                {formatDuration(seconds)}
                {localMode ? (
                  <span title="Live Grok replies need an xAI API key. Demo replies are on-device.">
                    Demo mode
                  </span>
                ) : null}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/">Leave</Link>
            </Button>
          </header>

          <div
            className={cn(
              "absolute top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] right-4 overflow-hidden rounded-xl",
              "shadow-[var(--shadow-border)] transition-opacity duration-200",
              camOn ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className="h-36 w-28 scale-x-[-1] object-cover"
            />
          </div>

          <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-7rem)] max-w-2xl flex-col justify-end px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
            {captionsOn ? (
              <div className="mb-4 space-y-2">
                {userLine ? (
                  <p className="text-sm text-muted">{userLine}</p>
                ) : null}
                <p className="font-serif text-2xl leading-snug tracking-tight text-fg sm:text-3xl">
                  {busy ? "…" : caption}
                </p>
              </div>
            ) : null}

            <form
              className="mb-3 flex items-end gap-2 rounded-2xl bg-surface/80 p-2 shadow-[var(--shadow-border)] backdrop-blur-sm"
              onSubmit={(e) => {
                e.preventDefault();
                void send(draft);
              }}
            >
              <label className="sr-only" htmlFor="say">
                Say something
              </label>
              <textarea
                id="say"
                rows={1}
                value={draft}
                disabled={busy}
                placeholder={listening ? "Listening…" : "Say something"}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(draft);
                  }
                }}
                className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-fg placeholder:text-subtle outline-none"
              />
              <Button
                type="submit"
                size="icon"
                variant="quiet"
                disabled={busy || !draft.trim()}
                aria-label="Send"
                className="rounded-full"
              >
                <Send />
              </Button>
            </form>

            <div className="flex items-center justify-center gap-2 rounded-full bg-surface/80 p-2 shadow-[var(--shadow-border)] backdrop-blur-sm">
              <Button
                type="button"
                variant={listening ? "primary" : "quiet"}
                size="icon"
                className="rounded-full"
                aria-label={listening ? "Listening" : "Speak"}
                onClick={() => void onMic()}
                disabled={busy}
              >
                {listening ? <MicOff /> : <Mic />}
              </Button>
              <Button
                type="button"
                variant={camOn ? "primary" : "quiet"}
                size="icon"
                className="rounded-full"
                aria-label={camOn ? "Camera on" : "Camera off"}
                onClick={() => void toggleCam()}
              >
                {camOn ? <Video /> : <VideoOff />}
              </Button>
              <Button
                type="button"
                variant={captionsOn ? "primary" : "quiet"}
                size="icon"
                className="rounded-full"
                aria-label={captionsOn ? "Captions on" : "Captions off"}
                onClick={() => setCaptions(!captionsOn)}
              >
                {captionsOn ? <Captions /> : <CaptionsOff />}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="icon"
                className="rounded-full"
                aria-label="End call"
                onClick={hangUp}
              >
                <PhoneOff />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
