import { useEffect, useRef } from "react";
import { PaintedPortrait } from "@/components/painted-portrait";
import type { Companion } from "@/lib/companions";
import { cn } from "@/lib/utils";

type Props = {
  companion: Companion;
  alt?: string;
  live?: boolean;
  speaking?: boolean;
  mouth?: number;
  className?: string;
};

/** B6 / 9:16 letterbox face layout — mouth sits mid-lower face. */
const MOUTH_CENTER_Y = 0.58;
const MOUTH_BAND_H = 0.14;
const MOUTH_ELLIPSE_RX = 0.16;
const MOUTH_ELLIPSE_RY = 0.09;
const JAW_BAND_TOP = 0.52;
const JAW_BAND_H = 0.22;
const EYE_CENTER_Y = 0.36;
const EYE_RX = 0.055;
const EYE_RY = 0.028;
const EYE_LEFT_X = 0.37;
const EYE_RIGHT_X = 0.63;

function TalkingPhoto({
  src,
  alt,
  live,
  speaking,
  mouth,
  focusX = 0.5,
  focusY = 0.5,
  className,
}: {
  src: string;
  alt: string;
  live: boolean;
  speaking: boolean;
  mouth: number;
  focusX?: number;
  focusY?: number;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouthRef = useRef(mouth);
  const speakingRef = useRef(speaking);
  mouthRef.current = mouth;
  speakingRef.current = speaking;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = src;
    const buffer = document.createElement("canvas");
    const bctx = buffer.getContext("2d");
    if (!bctx) return;

    let raf = 0;
    let blink = 0;
    let nextBlink = 900 + Math.random() * 1800;
    let ready = false;
    let lastW = 0;
    let lastH = 0;
    let viseme = 0;
    let lastNow = performance.now();

    const size = () => {
      const w = wrap.clientWidth || canvas.clientWidth;
      const h = wrap.clientHeight || canvas.clientHeight;
      return { w, h };
    };

    const drawBase = (w: number, h: number, now: number, open: number) => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) return;
      // Subtle live motion — small amplitudes so it feels natural, not woozy.
      const breath = live ? Math.sin(now / 1400) * 0.008 : 0;
      const sway = live ? Math.sin(now / 2200) * 0.004 : 0;
      const nod = live ? Math.sin(now / 1800) * 0.003 : 0;
      const talk = open * 0.012;
      // Wide desktop used cover-crop and sliced the face. Letterbox (contain) when
      // the viewport is wider than the photo so the full head stays visible.
      const viewAspect = w / h;
      const imageAspect = iw / ih;
      const cover = viewAspect <= imageAspect * 1.05;
      const baseScale = cover ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
      const zoom = (cover ? 1.02 : 1.0) + breath + talk;
      const zw = iw * baseScale * zoom;
      const zh = ih * baseScale * zoom;
      let dx: number;
      let dy: number;
      if (cover) {
        const targetX = w * 0.5 + sway * w;
        const targetY = h * 0.36 - talk * h * 0.35 + nod * h;
        dx = targetX - focusX * zw;
        dy = targetY - focusY * zh;
        dx = Math.min(0, Math.max(w - zw, dx));
        dy = Math.min(0, Math.max(h - zh, dy));
      } else {
        dx = (w - zw) / 2 + sway * w * 0.25;
        dy = (h - zh) / 2 + nod * h;
      }

      buffer.width = Math.max(1, Math.round(w));
      buffer.height = Math.max(1, Math.round(h));
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.fillStyle = "#050505";
      bctx.fillRect(0, 0, w, h);
      bctx.drawImage(img, dx, dy, zw, zh);
    };

    /** Soft elliptical mouth stretch + mild jaw drop (overlapping, no slice gaps). */
    const drawMouthMotion = (w: number, h: number, open: number) => {
      if (open < 0.02) return;

      const cx = w * 0.5;
      const cy = h * MOUTH_CENTER_Y;
      const rx = w * MOUTH_ELLIPSE_RX;
      const ry = h * MOUTH_ELLIPSE_RY * (0.85 + open * 0.35);

      // Mild jaw drop: lower-face band shifts down a little with feathered edges.
      const jawDrop = open * h * 0.018;
      if (jawDrop > 0.4) {
        const jy = h * JAW_BAND_TOP;
        const jh = h * JAW_BAND_H;
        const feather = Math.max(4, jh * 0.22);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, jy - 1, w, jh + 2);
        ctx.clip();
        // Overlapping strips with feathered alpha so jaw edges blend into the base frame.
        const strips = 14;
        for (let i = 0; i < strips; i++) {
          const t = i / (strips - 1);
          const sy = jy + t * jh;
          const sh = jh / strips + 1.5;
          const edge = Math.min(t, 1 - t) * 2;
          const featherT = Math.min(1, (edge * jh * 0.5) / Math.max(1, feather));
          const a = Math.min(1, featherT * 1.3) * Math.min(1, open * 1.5);
          if (a < 0.04) continue;
          ctx.globalAlpha = a;
          ctx.drawImage(buffer, 0, sy, w, sh, 0, sy + jawDrop, w, sh);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Mouth open: elliptical clip, vertically stretch mouth band from buffer.
      const bandY = cy - h * MOUTH_BAND_H * 0.5;
      const bandH = h * MOUTH_BAND_H;
      const stretch = 1 + open * 0.42;
      const destH = bandH * stretch;
      const destY = cy - destH * 0.45; // bias stretch downward (jaw opens down)

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy + jawDrop * 0.35, rx, ry * stretch * 0.95, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalCompositeOperation = "source-over";
      // Overlapping redraw of the mouth band — no gaps, covers base pixels.
      ctx.drawImage(buffer, 0, bandY, w, bandH, 0, destY + jawDrop * 0.25, w, destH);
      ctx.restore();
    };

    /** Soft blink: squash eye pixels inside small ellipses, optional thin lid tint. */
    const drawBlink = (w: number, h: number, amount: number) => {
      if (amount < 0.04) return;
      const squash = 1 - amount * 0.78;
      const lidAlpha = 0.18 * amount;

      for (const ex of [w * EYE_LEFT_X, w * EYE_RIGHT_X]) {
        const ey = h * EYE_CENTER_Y;
        const rx = w * EYE_RX;
        const ry = h * EYE_RY;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(ex, ey, rx * 1.15, ry * 1.35, 0, 0, Math.PI * 2);
        ctx.clip();

        // Vertical squash of the eye region from the clean buffer.
        const srcY = ey - ry * 1.4;
        const srcH = ry * 2.8;
        const destH = srcH * squash;
        const destY = ey - destH * 0.5;
        ctx.drawImage(buffer, ex - rx * 1.2, srcY, rx * 2.4, srcH, ex - rx * 1.2, destY, rx * 2.4, destH);

        // Thin soft lid tint (warm dark, low alpha) — never opaque black blobs.
        if (lidAlpha > 0.02) {
          const lidH = ry * (0.35 + amount * 0.9);
          const grad = ctx.createLinearGradient(ex, ey - lidH, ex, ey + lidH * 0.3);
          grad.addColorStop(0, `rgba(42, 28, 18, ${lidAlpha * 0.15})`);
          grad.addColorStop(0.45, `rgba(32, 20, 12, ${lidAlpha})`);
          grad.addColorStop(1, `rgba(42, 28, 18, 0)`);
          ctx.fillStyle = grad;
          ctx.fillRect(ex - rx * 1.2, ey - lidH, rx * 2.4, lidH * 1.4);
        }
        ctx.restore();
      }
    };

    const paint = (now: number) => {
      if (!ready) return;
      const { w, h } = size();
      if (w < 2 || h < 2) return;
      const dt = Math.min(48, Math.max(8, now - lastNow));
      lastNow = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.round(w * dpr);
      const ph = Math.round(h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      lastW = w;
      lastH = h;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Smooth viseme: speaking drives oscillating target; always lerp toward it.
      const target = speakingRef.current
        ? Math.max(mouthRef.current, 0.18 + Math.abs(Math.sin(now / 90)) * 0.55)
        : mouthRef.current;
      // Frame-rate independent-ish lerp (PaintedPortrait uses ~0.28 per frame @60fps).
      const lerp = 1 - Math.pow(1 - 0.28, dt / 16.67);
      viseme += (target - viseme) * lerp;
      if (viseme < 0.008) viseme = 0;

      drawBase(w, h, now, viseme);

      // Always paint the full clean buffer first — never leave holes to black clearRect.
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(buffer, 0, 0, w, h);

      if (live) {
        drawMouthMotion(w, h, viseme);

        nextBlink -= dt;
        if (nextBlink <= 0) {
          blink = 1;
          nextBlink = 1800 + Math.random() * 2800;
        }
        blink = Math.max(0, blink - dt / 150);
        drawBlink(w, h, blink);
      }
    };

    const markReady = () => {
      ready = img.naturalWidth > 0;
      paint(performance.now());
    };
    img.addEventListener("load", markReady);
    if (img.complete) markReady();

    const ro = new ResizeObserver(() => {
      const { w, h } = size();
      if (w !== lastW || h !== lastH) paint(performance.now());
    });
    ro.observe(wrap);

    // Always animate while mounted if live; otherwise paint on size/load only.
    if (live) {
      const tick = (now: number) => {
        paint(now);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } else {
      // Retry a few times in case layout isn't ready yet.
      let tries = 0;
      const retry = window.setInterval(() => {
        tries += 1;
        paint(performance.now());
        if ((lastW > 2 && lastH > 2) || tries > 20) window.clearInterval(retry);
      }, 50);
      return () => {
        window.clearInterval(retry);
        ro.disconnect();
        img.removeEventListener("load", markReady);
      };
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      img.removeEventListener("load", markReady);
    };
  }, [src, live, focusX, focusY]);

  return (
    <div ref={wrapRef} className={cn("relative h-full w-full overflow-hidden bg-black", className)}>
      {/* Fallback img so something always shows even if canvas fails */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-100 max-[900px]:object-cover bg-black"
        style={{ objectPosition: `${focusX * 100}% ${focusY * 100}%` }}
        draggable={false}
      />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={alt}
        className="absolute inset-0 block h-full w-full"
      />
    </div>
  );
}

export function CompanionFace({
  companion,
  alt,
  live = false,
  speaking = false,
  mouth = 0,
  className,
}: Props) {
  if (companion.photoUrl) {
    return (
      <TalkingPhoto
        src={companion.photoUrl}
        alt={alt ?? companion.name}
        live={live}
        speaking={speaking}
        mouth={mouth}
        focusX={companion.photoFocus?.x ?? 0.5}
        focusY={companion.photoFocus?.y ?? 0.5}
        className={className}
      />
    );
  }
  return (
    <PaintedPortrait
      spec={companion.face}
      alt={alt ?? companion.name}
      live={live}
      speaking={speaking}
      mouth={mouth}
      className={className}
    />
  );
}
