import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Phone } from "lucide-react";
import { PaintedPortrait } from "@/components/painted-portrait";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { companionById, FACE_STARTS, type Companion } from "@/lib/companions";
import {
  DEFAULT_FACE,
  HAIR_STYLES,
  HAIR_SWATCHES,
  LIGHTINGS,
  OUTFITS,
  OUTFIT_SWATCHES,
  SKIN_SWATCHES,
  type FaceSpec,
  type HairStyle,
  type Lighting,
  type OutfitStyle,
} from "@/lib/face";
import { usePresence } from "@/lib/store";
import { cn, uid } from "@/lib/utils";

function Swatches({
  values,
  value,
  onChange,
  label,
}: {
  values: string[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {values.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`${label} ${c}`}
            onClick={() => onChange(c)}
            className={cn(
              "size-8 rounded-full transition-transform duration-150 ease-out active:scale-[0.96]",
              value === c ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : "shadow-[var(--shadow-border)]",
            )}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}

function Chips<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "h-10 rounded-full px-3 text-sm transition-colors duration-150",
              value === item.id ? "bg-accent text-accent-fg" : "bg-raised text-muted hover:text-fg",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StudioView({ fromId }: { fromId?: string }) {
  const navigate = useNavigate();
  const custom = usePresence((s) => s.custom);
  const upsert = usePresence((s) => s.upsert);
  const existing = fromId ? companionById(fromId, custom) : undefined;

  const [name, setName] = useState(existing && !existing.builtIn ? existing.name : "");
  const [tagline, setTagline] = useState(existing && !existing.builtIn ? existing.tagline : "");
  const [persona, setPersona] = useState(
    existing && !existing.builtIn
      ? existing.persona
      : existing
        ? existing.persona
        : "You are a present, specific conversation partner on a live video call. Short turns. No markdown.",
  );
  const [face, setFace] = useState<FaceSpec>(existing ? { ...existing.face } : { ...DEFAULT_FACE });
  const [glasses, setGlasses] = useState(existing?.face.glasses ?? false);
  const [beard, setBeard] = useState(existing?.face.beard ?? 0);
  const [voiceId, setVoiceId] = useState(existing?.voiceId ?? "eve");
  const [voicePitch, setVoicePitch] = useState(existing?.voicePitch ?? 1);

  const preview: Companion = useMemo(
    () => ({
      id: existing && !existing.builtIn ? existing.id : "draft",
      name: name.trim() || "Someone new",
      tagline: tagline.trim() || "A presence you made.",
      greeting: `Hi — I'm ${name.trim() || "here"}. I can see you.`,
      persona,
      voiceId,
      voiceRate: existing?.voiceRate ?? 1,
      voicePitch,
      face: { ...face, glasses, beard },
      builtIn: false,
      createdAt: existing?.createdAt ?? Date.now(),
    }),
    [existing, name, tagline, persona, face, glasses, beard, voiceId, voicePitch],
  );

  function patch(p: Partial<FaceSpec>) {
    setFace((f) => ({ ...f, ...p }));
  }

  function save(thenCall: boolean) {
    const saved: Companion = {
      ...preview,
      id: existing && !existing.builtIn ? existing.id : uid(),
      name: name.trim() || "Untitled",
      greeting: `Hi — I'm ${name.trim() || "here"}. I can see you.`,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    upsert(saved);
    if (thenCall) void navigate({ to: "/call/$id", params: { id: saved.id } });
    else void navigate({ to: "/" });
  }

  return (
    <div className="bg-bg text-fg min-h-dvh">
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="rounded-full pl-3 pr-3.5">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <p className="font-serif text-lg italic text-muted">Studio</p>
        <span className="w-16" />
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-24 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="presence-enter">
          <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-border)]">
            <div className="aspect-[3/4] w-full">
              <PaintedPortrait spec={preview.face} alt="Avatar preview" live className="h-full w-full" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl tracking-tight">{preview.name}</p>
          <p className="text-sm text-muted">{preview.tagline}</p>
        </div>

        <form
          className="presence-enter presence-enter-delay-2 flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            save(true);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                className="mt-2"
                value={name}
                placeholder="Who are they?"
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="tagline">How they show up</Label>
              <Input
                id="tagline"
                className="mt-2"
                value={tagline}
                placeholder="One line you'd believe on a call"
                onChange={(e) => setTagline(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="persona">Who they are, on the call</Label>
              <Textarea
                id="persona"
                className="mt-2"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                maxLength={600}
              />
            </div>
          </div>

          {!existing || existing.builtIn ? (
            <div>
              <Label className="mb-2 block">Start from a face</Label>
              <div className="flex flex-wrap gap-1.5">
                {FACE_STARTS.map((start) => (
                  <button
                    key={start.id}
                    type="button"
                    onClick={() => {
                      setFace({ ...start.face });
                      setGlasses(start.face.glasses ?? false);
                      setBeard(start.face.beard ?? 0);
                      const src = companionById(start.id);
                      if (src) {
                        setVoiceId(src.voiceId);
                        setVoicePitch(src.voicePitch);
                        if (!name.trim()) setName(src.name + " · remixed");
                        if (!tagline.trim()) setTagline(src.tagline);
                      }
                    }}
                    className="h-10 rounded-full bg-raised px-3 text-sm text-muted transition-colors duration-150 hover:bg-surface hover:text-fg"
                  >
                    {start.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <Chips
            label="Voice"
            items={[
              { id: "eve", label: "Eve" },
              { id: "ara", label: "Ara" },
              { id: "sal", label: "Sal" },
              { id: "leo", label: "Leo" },
              { id: "rex", label: "Rex" },
            ]}
            value={voiceId}
            onChange={(id: string) => {
              setVoiceId(id);
              setVoicePitch(id === "leo" || id === "rex" ? 0.9 : 1.05);
            }}
          />

          <Chips
            label="Hair"
            items={HAIR_STYLES}
            value={face.hairStyle}
            onChange={(hairStyle: HairStyle) => patch({ hairStyle })}
          />
          <Swatches label="Hair color" values={HAIR_SWATCHES} value={face.hair} onChange={(hair) => patch({ hair })} />
          <Swatches label="Skin" values={SKIN_SWATCHES} value={face.skin} onChange={(skin) => patch({ skin })} />
          <Chips
            label="Clothes"
            items={OUTFITS}
            value={face.outfitStyle}
            onChange={(outfitStyle: OutfitStyle) => patch({ outfitStyle })}
          />
          <Swatches
            label="Clothes color"
            values={OUTFIT_SWATCHES}
            value={face.outfit}
            onChange={(outfit) => patch({ outfit })}
          />
          <Chips
            label="Light"
            items={LIGHTINGS}
            value={face.lighting}
            onChange={(lighting: Lighting) => patch({ lighting })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-muted">
              Smile
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={face.smile}
                onChange={(e) => patch({ smile: Number(e.target.value) })}
                className="h-11 accent-accent"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-muted">
              Jaw
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={face.jaw}
                onChange={(e) => patch({ jaw: Number(e.target.value) })}
                className="h-11 accent-accent"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-muted">
              Beard
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={beard}
                onChange={(e) => setBeard(Number(e.target.value))}
                className="h-11 accent-accent"
              />
            </label>
            <label className="flex h-11 items-center gap-3 self-end text-sm text-fg">
              <input
                type="checkbox"
                checked={glasses}
                onChange={(e) => setGlasses(e.target.checked)}
                className="size-5 accent-accent"
              />
              Glasses
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" size="lg" className="min-h-12 flex-1 rounded-full">
              <Phone className="size-4" />
              Save and call
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="min-h-12 rounded-full"
              onClick={() => save(false)}
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
