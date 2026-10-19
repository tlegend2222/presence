import type { FaceAnim, FaceSpec, HairStyle, Lighting } from "./face";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgb(r: number, g: number, b: number, a = 1): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgb(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

function shade(hex: string, t: number): string {
  return mix(hex, "#09090b", t);
}

function tint(hex: string, t: number): string {
  return mix(hex, "#fff7ee", t);
}

type Geo = {
  w: number;
  h: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

function geo(w: number, h: number, spec: FaceSpec): Geo {
  const cx = w * 0.5;
  const cy = h * 0.38;
  const rx = w * 0.27 * spec.faceWidth;
  const ry = rx * (1.16 + spec.jaw * 0.08);
  return { w, h, cx, cy, rx, ry };
}

function fillEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string | CanvasGradient,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function lightKey(lighting: Lighting): { x: number; y: number; color: string; ambient: string; dark: number } {
  switch (lighting) {
    case "sun":
      return { x: -0.35, y: -0.4, color: "#ffe2b8", ambient: "#2a1c10", dark: 0.18 };
    case "lamp":
      return { x: 0.45, y: 0.15, color: "#ffc078", ambient: "#0a0806", dark: 0.42 };
    case "night":
      return { x: 0.3, y: 0.2, color: "#d4a574", ambient: "#050508", dark: 0.55 };
    case "studio":
      return { x: -0.1, y: -0.55, color: "#f0f0f2", ambient: "#141416", dark: 0.12 };
    default:
      return { x: -0.4, y: -0.35, color: "#dce6f2", ambient: "#101218", dark: 0.22 };
  }
}

function drawAtmosphere(ctx: CanvasRenderingContext2D, g: Geo, spec: FaceSpec) {
  const key = lightKey(spec.lighting);
  const bg = ctx.createLinearGradient(0, 0, 0, g.h);
  bg.addColorStop(0, mix(key.ambient, key.color, 0.12));
  bg.addColorStop(0.45, key.ambient);
  bg.addColorStop(1, mix(key.ambient, "#000000", 0.4));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, g.w, g.h);

  const window = ctx.createRadialGradient(
    g.w * (0.5 + key.x * 0.4),
    g.h * 0.18,
    g.w * 0.02,
    g.w * (0.5 + key.x * 0.4),
    g.h * 0.2,
    g.w * 0.72,
  );
  window.addColorStop(0, rgb(...hexToRgb(key.color), 0.28));
  window.addColorStop(0.45, rgb(...hexToRgb(key.color), 0.06));
  window.addColorStop(1, rgb(0, 0, 0, 0));
  ctx.fillStyle = window;
  ctx.fillRect(0, 0, g.w, g.h);

  for (let i = 0; i < 7; i++) {
    const bx = g.w * (0.12 + (i * 0.13) % 0.8);
    const by = g.h * (0.08 + ((i * 37) % 20) / 100);
    const br = g.w * (0.04 + (i % 3) * 0.02);
    const bokeh = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    bokeh.addColorStop(0, rgb(...hexToRgb(key.color), 0.07));
    bokeh.addColorStop(1, rgb(0, 0, 0, 0));
    ctx.fillStyle = bokeh;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawClothes(ctx: CanvasRenderingContext2D, g: Geo, spec: FaceSpec) {
  const shoulderY = g.cy + g.ry * 1.55;
  const cloth = shade(spec.outfit, 0.08);
  const clothDark = shade(spec.outfit, 0.35);

  const body = ctx.createLinearGradient(g.cx, shoulderY - g.ry, g.cx, g.h);
  body.addColorStop(0, tint(cloth, 0.08));
  body.addColorStop(0.45, cloth);
  body.addColorStop(1, clothDark);
  ctx.beginPath();
  ctx.moveTo(g.cx - g.rx * 2.35, g.h);
  ctx.quadraticCurveTo(g.cx - g.rx * 2.1, shoulderY, g.cx - g.rx * 1.15, shoulderY + g.ry * 0.15);
  ctx.quadraticCurveTo(g.cx, shoulderY - g.ry * 0.2, g.cx + g.rx * 1.15, shoulderY + g.ry * 0.15);
  ctx.quadraticCurveTo(g.cx + g.rx * 2.1, shoulderY, g.cx + g.rx * 2.35, g.h);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();

  if (spec.outfitStyle === "turtleneck") {
    fillEllipse(ctx, g.cx, g.cy + g.ry * 1.12, g.rx * 0.72, g.ry * 0.42, shade(spec.outfit, 0.12));
  } else if (spec.outfitStyle === "hoodie") {
    ctx.beginPath();
    ctx.moveTo(g.cx - g.rx * 1.05, g.cy + g.ry * 0.85);
    ctx.quadraticCurveTo(g.cx, g.cy + g.ry * 0.55, g.cx + g.rx * 1.05, g.cy + g.ry * 0.85);
    ctx.lineTo(g.cx + g.rx * 1.2, g.cy + g.ry * 1.5);
    ctx.lineTo(g.cx - g.rx * 1.2, g.cy + g.ry * 1.5);
    ctx.closePath();
    ctx.fillStyle = shade(spec.outfit, 0.18);
    ctx.fill();
  } else if (spec.outfitStyle === "cardigan") {
    ctx.fillStyle = tint(cloth, 0.1);
    ctx.fillRect(g.cx - g.rx * 0.08, shoulderY, g.rx * 0.16, g.h - shoulderY);
  } else if (spec.outfitStyle === "henley") {
    ctx.strokeStyle = tint(cloth, 0.2);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(g.cx, g.cy + g.ry * 1.22);
    ctx.lineTo(g.cx, g.cy + g.ry * 1.85);
    ctx.stroke();
  }

  const neck = ctx.createLinearGradient(g.cx, g.cy + g.ry * 0.7, g.cx, g.cy + g.ry * 1.5);
  neck.addColorStop(0, shade(spec.skin, 0.12));
  neck.addColorStop(1, shade(spec.skin, 0.28));
  const neckW = g.rx * (0.42 + spec.jaw * 0.08);
  ctx.beginPath();
  ctx.moveTo(g.cx - neckW, g.cy + g.ry * 0.75);
  ctx.quadraticCurveTo(g.cx, g.cy + g.ry * 1.55, g.cx + neckW, g.cy + g.ry * 0.75);
  ctx.closePath();
  ctx.fillStyle = neck;
  ctx.fill();
}

function hairBack(ctx: CanvasRenderingContext2D, g: Geo, spec: FaceSpec) {
  const c = spec.hair;
  const dark = shade(c, 0.35);
  const style: HairStyle = spec.hairStyle;

  if (style === "hijab") {
    const wrap = ctx.createLinearGradient(g.cx, g.cy - g.ry, g.cx, g.cy + g.ry * 2);
    wrap.addColorStop(0, tint(c, 0.12));
    wrap.addColorStop(0.5, c);
    wrap.addColorStop(1, dark);
    ctx.beginPath();
    ctx.ellipse(g.cx, g.cy + g.ry * 0.15, g.rx * 1.28, g.ry * 1.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = wrap;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(g.cx - g.rx * 1.15, g.cy + g.ry * 0.6);
    ctx.quadraticCurveTo(g.cx, g.cy + g.ry * 2.4, g.cx + g.rx * 1.15, g.cy + g.ry * 0.6);
    ctx.lineTo(g.cx + g.rx * 1.5, g.h);
    ctx.lineTo(g.cx - g.rx * 1.5, g.h);
    ctx.closePath();
    ctx.fill();
    return;
  }

  ctx.fillStyle = dark;
  if (style === "short" || style === "fade" || style === "pixie") {
    fillEllipse(ctx, g.cx, g.cy - g.ry * 0.15, g.rx * 1.08, g.ry * 1.12, dark);
  } else if (style === "curly") {
    for (const [dx, dy, s] of [
      [-0.85, -0.2, 0.55],
      [0.85, -0.18, 0.55],
      [-0.55, -0.85, 0.5],
      [0.55, -0.88, 0.52],
      [0, -1.05, 0.58],
      [-1.05, 0.25, 0.42],
      [1.05, 0.28, 0.42],
    ] as const) {
      fillEllipse(ctx, g.cx + g.rx * dx, g.cy + g.ry * dy, g.rx * s, g.ry * s, mix(c, dark, 0.4));
    }
  } else if (style === "waves" || style === "long") {
    fillEllipse(ctx, g.cx, g.cy + g.ry * 0.2, g.rx * 1.25, g.ry * 1.45, dark);
    fillEllipse(ctx, g.cx - g.rx * 1.05, g.cy + g.ry * 0.9, g.rx * 0.45, g.ry * 1.1, c);
    fillEllipse(ctx, g.cx + g.rx * 1.05, g.cy + g.ry * 0.95, g.rx * 0.45, g.ry * 1.15, c);
  } else if (style === "bob" || style === "blunt") {
    fillEllipse(ctx, g.cx, g.cy + g.ry * 0.15, g.rx * 1.22, g.ry * 1.28, dark);
  } else if (style === "messy") {
    fillEllipse(ctx, g.cx, g.cy - g.ry * 0.05, g.rx * 1.18, g.ry * 1.22, dark);
    fillEllipse(ctx, g.cx - g.rx * 0.7, g.cy - g.ry * 1.05, g.rx * 0.4, g.ry * 0.38, c);
    fillEllipse(ctx, g.cx + g.rx * 0.55, g.cy - g.ry * 1.12, g.rx * 0.32, g.ry * 0.42, c);
  } else if (style === "knot" || style === "bun") {
    fillEllipse(ctx, g.cx, g.cy - g.ry * 0.05, g.rx * 1.1, g.ry * 1.12, dark);
    fillEllipse(
      ctx,
      g.cx + (style === "bun" ? 0 : g.rx * 0.15),
      g.cy - g.ry * 1.22,
      g.rx * 0.42,
      g.ry * 0.38,
      c,
    );
  }
}

function hairFront(ctx: CanvasRenderingContext2D, g: Geo, spec: FaceSpec) {
  const c = spec.hair;
  const lite = tint(c, 0.18);
  const style = spec.hairStyle;
  if (style === "hijab") {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(g.cx, g.cy + g.ry * 0.02, g.rx * 1.02, g.ry * 1.08, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.clearRect = ctx.clearRect;
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(g.cx, g.cy + g.ry * 0.02, g.rx * 1.02, g.ry * 1.08, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.clearRect = ctx.clearRect;
    ctx.restore();
    fillEllipse(ctx, g.cx, g.cy - g.ry * 0.72, g.rx * 1.05, g.ry * 0.42, shade(c, 0.1));
    ctx.beginPath();
    ctx.moveTo(g.cx - g.rx * 0.92, g.cy + g.ry * 0.15);
    ctx.quadraticCurveTo(g.cx, g.cy + g.ry * 0.55, g.cx + g.rx * 0.92, g.cy + g.ry * 0.15);
    ctx.quadraticCurveTo(g.cx, g.cy + g.ry * 0.02, g.cx - g.rx * 0.92, g.cy + g.ry * 0.15);
    ctx.fillStyle = shade(c, 0.2);
    ctx.fill();
    return;
  }

  ctx.fillStyle = c;
  if (style === "waves") {
    ctx.beginPath();
    ctx.moveTo(g.cx - g.rx * 0.95, g.cy - g.ry * 0.15);
    ctx.quadraticCurveTo(g.cx - g.rx * 0.2, g.cy - g.ry * 0.05, g.cx + g.rx * 0.15, g.cy - g.ry * 0.55);
    ctx.quadraticCurveTo(g.cx - g.rx * 0.7, g.cy - g.ry * 1.15, g.cx - g.rx * 1.05, g.cy - g.ry * 0.2);
    ctx.fill();
    fillEllipse(ctx, g.cx + g.rx * 0.72, g.cy + g.ry * 0.35, g.rx * 0.28, g.ry * 0.7, c);
  } else if (style === "blunt") {
    ctx.beginPath();
    ctx.moveTo(g.cx - g.rx * 1.05, g.cy - g.ry * 0.1);
    ctx.lineTo(g.cx - g.rx * 1.02, g.cy - g.ry * 0.85);
    ctx.quadraticCurveTo(g.cx, g.cy - g.ry * 1.22, g.cx + g.rx * 1.02, g.cy - g.ry * 0.85);
    ctx.lineTo(g.cx + g.rx * 1.05, g.cy - g.ry * 0.1);
    ctx.quadraticCurveTo(g.cx, g.cy - g.ry * 0.42, g.cx - g.rx * 1.05, g.cy - g.ry * 0.1);
    ctx.fill();
  } else if (style === "bob") {
    fillEllipse(ctx, g.cx - g.rx * 0.55, g.cy - g.ry * 0.55, g.rx * 0.5, g.ry * 0.28, c);
    fillEllipse(ctx, g.cx + g.rx * 0.2, g.cy - g.ry * 0.62, g.rx * 0.55, g.ry * 0.24, c);
  } else if (style === "messy" || style === "pixie") {
    ctx.beginPath();
    ctx.moveTo(g.cx - g.rx * 0.8, g.cy - g.ry * 0.35);
    ctx.quadraticCurveTo(g.cx - g.rx * 0.1, g.cy - g.ry * 0.15, g.cx + g.rx * 0.35, g.cy - g.ry * 0.5);
    ctx.quadraticCurveTo(g.cx, g.cy - g.ry * 1.15, g.cx - g.rx * 0.85, g.cy - g.ry * 0.45);
    ctx.fill();
  } else if (style === "knot") {
    ctx.beginPath();
    ctx.moveTo(g.cx - g.rx * 0.7, g.cy - g.ry * 0.25);
    ctx.quadraticCurveTo(g.cx, g.cy - g.ry * 0.02, g.cx + g.rx * 0.55, g.cy - g.ry * 0.4);
    ctx.quadraticCurveTo(g.cx - g.rx * 0.1, g.cy - g.ry * 0.7, g.cx - g.rx * 0.7, g.cy - g.ry * 0.25);
    ctx.fill();
  } else if (style === "short" || style === "fade") {
    ctx.beginPath();
    ctx.ellipse(g.cx, g.cy - g.ry * 0.55, g.rx * 0.95, g.ry * 0.55, 0, Math.PI, 0);
    ctx.fill();
  } else if (style === "long") {
    fillEllipse(ctx, g.cx - g.rx * 0.45, g.cy - g.ry * 0.45, g.rx * 0.4, g.ry * 0.22, c);
  }

  const sheen = ctx.createRadialGradient(
    g.cx - g.rx * 0.25,
    g.cy - g.ry * 0.7,
    0,
    g.cx,
    g.cy - g.ry * 0.4,
    g.rx,
  );
  sheen.addColorStop(0, rgb(...hexToRgb(lite), 0.28));
  sheen.addColorStop(1, rgb(0, 0, 0, 0));
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.ellipse(g.cx, g.cy - g.ry * 0.5, g.rx * 0.8, g.ry * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHead(ctx: CanvasRenderingContext2D, g: Geo, spec: FaceSpec, anim: FaceAnim) {
  const key = lightKey(spec.lighting);
  const skin = spec.skin;
  const shadow = shade(skin, 0.28 + key.dark * 0.2);
  const lit = tint(skin, 0.22);

  fillEllipse(ctx, g.cx - g.rx * 0.95, g.cy, g.rx * 0.22, g.ry * 0.32, shade(skin, 0.15));
  fillEllipse(ctx, g.cx + g.rx * 0.95, g.cy, g.rx * 0.22, g.ry * 0.32, shade(skin, 0.15));

  const face = ctx.createRadialGradient(
    g.cx + key.x * g.rx,
    g.cy + key.y * g.ry,
    g.rx * 0.1,
    g.cx,
    g.cy + g.ry * 0.1,
    g.rx * 1.25,
  );
  face.addColorStop(0, lit);
  face.addColorStop(0.45, skin);
  face.addColorStop(1, shadow);
  ctx.beginPath();
  const jaw = 0.92 + spec.jaw * 0.16;
  ctx.ellipse(g.cx, g.cy + g.ry * 0.04, g.rx, g.ry * jaw, 0, 0, Math.PI * 2);
  ctx.fillStyle = face;
  ctx.fill();

  const cheek = ctx.createRadialGradient(
    g.cx - g.rx * 0.42,
    g.cy + g.ry * 0.28,
    0,
    g.cx - g.rx * 0.42,
    g.cy + g.ry * 0.28,
    g.rx * 0.32,
  );
  cheek.addColorStop(0, rgb(...hexToRgb(spec.lip), 0.18));
  cheek.addColorStop(1, rgb(0, 0, 0, 0));
  ctx.fillStyle = cheek;
  ctx.beginPath();
  ctx.arc(g.cx - g.rx * 0.42, g.cy + g.ry * 0.28, g.rx * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(g.cx + g.rx * 0.42, g.cy + g.ry * 0.28, g.rx * 0.32, 0, Math.PI * 2);
  ctx.fill();

  drawFeatures(ctx, g, spec, anim);

  if (spec.beard > 0.05) {
    ctx.fillStyle = rgb(...hexToRgb(spec.hair), 0.18 + spec.beard * 0.35);
    ctx.beginPath();
    ctx.ellipse(g.cx, g.cy + g.ry * 0.62, g.rx * 0.72, g.ry * 0.38 * spec.beard + g.ry * 0.18, 0, 0, Math.PI);
    ctx.fill();
    if (spec.beard > 0.4) {
      ctx.beginPath();
      ctx.ellipse(g.cx, g.cy + g.ry * 0.18, g.rx * 0.55, g.ry * 0.28, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgb(...hexToRgb(spec.hair), 0.12 * spec.beard);
      ctx.fill();
    }
  }
}

function drawFeatures(ctx: CanvasRenderingContext2D, g: Geo, spec: FaceSpec, anim: FaceAnim) {
  const eyeY = g.cy - g.ry * 0.08;
  const spread = g.rx * 0.4 * spec.eyeSpacing;
  const erx = g.rx * 0.16 * spec.eyeSize;
  const ery = g.ry * 0.095 * spec.eyeSize * (1 - anim.blink * 0.92);
  const gazeX = anim.gazeX * erx * 0.35;
  const gazeY = anim.gazeY * ery * 0.35;

  ctx.fillStyle = shade(spec.brow, 0.1);
  const browY = eyeY - ery * 2.1;
  ctx.lineCap = "round";
  ctx.strokeStyle = spec.brow;
  ctx.lineWidth = Math.max(1.6, g.rx * 0.045);
  ctx.beginPath();
  ctx.moveTo(g.cx - spread - erx * 1.1, browY + g.ry * 0.02);
  ctx.quadraticCurveTo(g.cx - spread, browY - g.ry * 0.04, g.cx - spread + erx * 1.05, browY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(g.cx + spread + erx * 1.1, browY + g.ry * 0.02);
  ctx.quadraticCurveTo(g.cx + spread, browY - g.ry * 0.04, g.cx + spread - erx * 1.05, browY);
  ctx.stroke();

  const drawEye = (x: number) => {
    if (ery < 0.6) {
      ctx.strokeStyle = shade(spec.skin, 0.45);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x - erx, eyeY);
      ctx.quadraticCurveTo(x, eyeY + 1.2, x + erx, eyeY);
      ctx.stroke();
      return;
    }
    fillEllipse(ctx, x, eyeY + 2, erx * 1.05, ery * 0.7, rgb(0, 0, 0, 0.1));
    fillEllipse(ctx, x, eyeY, erx, ery, "#f4f1ea");
    fillEllipse(ctx, x + gazeX, eyeY + gazeY, erx * 0.55, ery * 0.85, spec.iris);
    fillEllipse(ctx, x + gazeX, eyeY + gazeY, erx * 0.28, ery * 0.48, "#12100e");
    fillEllipse(ctx, x + gazeX - erx * 0.18, eyeY + gazeY - ery * 0.25, erx * 0.12, ery * 0.14, rgb(255, 255, 255, 0.85));
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, eyeY, erx, ery, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = rgb(...hexToRgb(spec.skin), 0.35);
    ctx.beginPath();
    ctx.ellipse(x, eyeY - ery * 1.15, erx * 1.1, ery * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawEye(g.cx - spread);
  drawEye(g.cx + spread);

  const nx = g.cx + anim.gazeX * 1.5;
  const ny = g.cy + g.ry * 0.18;
  ctx.fillStyle = rgb(0, 0, 0, 0.1);
  ctx.beginPath();
  ctx.moveTo(nx, g.cy + g.ry * 0.02);
  ctx.quadraticCurveTo(nx + g.rx * 0.12, ny, nx - g.rx * 0.02, ny + g.ry * 0.12);
  ctx.quadraticCurveTo(nx - g.rx * 0.16, ny, nx, g.cy + g.ry * 0.02);
  ctx.fill();
  fillEllipse(ctx, nx - g.rx * 0.07, ny + g.ry * 0.08, g.rx * 0.07, g.ry * 0.045, shade(spec.skin, 0.22));
  fillEllipse(ctx, nx + g.rx * 0.06, ny + g.ry * 0.08, g.rx * 0.055, g.ry * 0.04, shade(spec.skin, 0.18));

  const mouthY = g.cy + g.ry * 0.52;
  const smile = spec.smile;
  const open = anim.mouth;
  const mw = g.rx * (0.28 + smile * 0.12);
  const curve = g.ry * (0.04 + smile * 0.08);

  if (open > 0.08) {
    const oh = g.ry * (0.04 + open * 0.16);
    ctx.fillStyle = "#2a1518";
    ctx.beginPath();
    ctx.ellipse(g.cx, mouthY + oh * 0.15, mw * 0.85, oh, 0, 0, Math.PI * 2);
    ctx.fill();
    if (open > 0.35) {
      ctx.fillStyle = rgb(240, 232, 224, 0.8);
      ctx.beginPath();
      ctx.ellipse(g.cx, mouthY - oh * 0.25, mw * 0.62, oh * 0.28, 0, 0, Math.PI);
      ctx.fill();
    }
    ctx.strokeStyle = spec.lip;
    ctx.lineWidth = Math.max(1.5, g.rx * 0.04);
    ctx.beginPath();
    ctx.ellipse(g.cx, mouthY + oh * 0.15, mw * 0.85, oh, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = spec.lip;
    ctx.lineWidth = Math.max(1.8, g.rx * 0.048);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(g.cx - mw, mouthY);
    ctx.quadraticCurveTo(g.cx, mouthY + curve, g.cx + mw, mouthY);
    ctx.stroke();
    ctx.strokeStyle = rgb(...hexToRgb(spec.lip), 0.45);
    ctx.lineWidth = Math.max(1, g.rx * 0.03);
    ctx.beginPath();
    ctx.moveTo(g.cx - mw * 0.7, mouthY + 2.2);
    ctx.quadraticCurveTo(g.cx, mouthY + curve + 2.4, g.cx + mw * 0.7, mouthY + 2.2);
    ctx.stroke();
  }

  if (spec.glasses) {
    ctx.strokeStyle = rgb(220, 220, 224, 0.55);
    ctx.lineWidth = Math.max(1.4, g.rx * 0.04);
    const gx = spread;
    const gy = eyeY;
    ctx.beginPath();
    ctx.ellipse(g.cx - gx, gy, erx * 1.45, ery * 1.8 + 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(g.cx + gx, gy, erx * 1.45, ery * 1.8 + 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(g.cx - gx + erx * 1.45, gy);
    ctx.lineTo(g.cx + gx - erx * 1.45, gy);
    ctx.stroke();
  }
}

function drawGrade(ctx: CanvasRenderingContext2D, g: Geo, spec: FaceSpec) {
  const key = lightKey(spec.lighting);
  const rim = ctx.createRadialGradient(
    g.cx - key.x * g.w * 0.4,
    g.cy,
    g.rx * 0.4,
    g.cx,
    g.cy,
    g.w * 0.7,
  );
  rim.addColorStop(0, rgb(0, 0, 0, 0));
  rim.addColorStop(1, rgb(0, 0, 0, 0.18 + key.dark * 0.25));
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, g.w, g.h);

  const vignette = ctx.createRadialGradient(g.cx, g.cy, g.w * 0.2, g.cx, g.cy + g.h * 0.1, g.w * 0.78);
  vignette.addColorStop(0, rgb(0, 0, 0, 0));
  vignette.addColorStop(1, rgb(0, 0, 0, 0.45));
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, g.w, g.h);
}

const REST: FaceAnim = { blink: 0, mouth: 0, gazeX: 0, gazeY: 0 };

export function drawPortrait(
  ctx: CanvasRenderingContext2D,
  spec: FaceSpec,
  w: number,
  h: number,
  anim: FaceAnim = REST,
) {
  ctx.clearRect(0, 0, w, h);
  const g = geo(w, h, spec);
  drawAtmosphere(ctx, g, spec);
  drawClothes(ctx, g, spec);
  hairBack(ctx, g, spec);
  drawHead(ctx, g, spec, anim);
  hairFront(ctx, g, spec);
  drawGrade(ctx, g, spec);
}

export function faceBackground(spec: FaceSpec): string {
  return lightKey(spec.lighting).ambient;
}
