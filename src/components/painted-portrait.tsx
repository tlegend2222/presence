import { useEffect, useRef } from "react";
import { drawPortrait, faceBackground } from "@/lib/draw-portrait";
import type { FaceAnim, FaceSpec } from "@/lib/face";
import { cn } from "@/lib/utils";

type Props = {
  spec: FaceSpec;
  alt: string;
  live?: boolean;
  speaking?: boolean;
  mouth?: number;
  className?: string;
};

export function PaintedPortrait({ spec, alt, live = false, speaking = false, mouth = 0, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const specRef = useRef(spec);
  specRef.current = spec;
  const mouthRef = useRef(mouth);
  mouthRef.current = mouth;
  const speakingRef = useRef(speaking);
  speakingRef.current = speaking;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let blink = 0;
    let nextBlink = 800 + Math.random() * 2400;
    let t0 = performance.now();
    let gazeX = 0;
    let gazeY = 0;
    let viseme = 0;

    const paint = (anim: FaceAnim) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w < 2 || h < 2) return;
      const pw = Math.round(w * dpr);
      const ph = Math.round(h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawPortrait(ctx, specRef.current, w, h, anim);
    };

    if (!live) {
      paint({ blink: 0, mouth: 0, gazeX: 0, gazeY: 0 });
      return;
    }

    const tick = (now: number) => {
      const dt = now - t0;
      t0 = now;
      nextBlink -= dt;
      if (nextBlink <= 0) {
        blink = 1;
        nextBlink = 1800 + Math.random() * 3200;
      }
      blink = Math.max(0, blink - dt / 140);
      gazeX += (Math.sin(now / 2400) * 0.22 - gazeX) * 0.04;
      gazeY += (Math.sin(now / 3100) * 0.12 - gazeY) * 0.04;
      const target = speakingRef.current
        ? Math.max(mouthRef.current, 0.18 + Math.abs(Math.sin(now / 90)) * 0.55)
        : mouthRef.current;
      viseme += (target - viseme) * 0.28;
      paint({ blink, mouth: viseme, gazeX, gazeY });
      raf = requestAnimationFrame(tick);
    };

    paint({ blink: 0, mouth: 0, gazeX: 0, gazeY: 0 });
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, spec]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className={cn("block h-full w-full", className)}
      style={{ background: faceBackground(spec) }}
    />
  );
}
