export type HairStyle =
  | "short"
  | "curly"
  | "waves"
  | "bob"
  | "blunt"
  | "messy"
  | "knot"
  | "long"
  | "pixie"
  | "fade"
  | "hijab"
  | "bun";

export type OutfitStyle = "crew" | "henley" | "turtleneck" | "cardigan" | "hoodie" | "shirt";

export type Lighting = "north" | "sun" | "lamp" | "night" | "studio";

export type FaceSpec = {
  skin: string;
  lip: string;
  iris: string;
  brow: string;
  hairStyle: HairStyle;
  hair: string;
  outfitStyle: OutfitStyle;
  outfit: string;
  lighting: Lighting;
  faceWidth: number;
  jaw: number;
  eyeSize: number;
  eyeSpacing: number;
  smile: number;
  beard: number;
  glasses: boolean;
  genderHint: "feminine" | "masculine" | "androgynous";
};

export type FaceAnim = {
  blink: number;
  mouth: number;
  gazeX: number;
  gazeY: number;
};

export const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: "short", label: "Short" },
  { id: "curly", label: "Curly" },
  { id: "waves", label: "Waves" },
  { id: "bob", label: "Bob" },
  { id: "blunt", label: "Blunt" },
  { id: "messy", label: "Messy" },
  { id: "knot", label: "Knot" },
  { id: "long", label: "Long" },
  { id: "pixie", label: "Pixie" },
  { id: "fade", label: "Fade" },
  { id: "bun", label: "Bun" },
  { id: "hijab", label: "Hijab" },
];

export const OUTFITS: { id: OutfitStyle; label: string }[] = [
  { id: "crew", label: "Crew" },
  { id: "henley", label: "Henley" },
  { id: "turtleneck", label: "Turtleneck" },
  { id: "cardigan", label: "Cardigan" },
  { id: "hoodie", label: "Hoodie" },
  { id: "shirt", label: "Shirt" },
];

export const LIGHTINGS: { id: Lighting; label: string }[] = [
  { id: "north", label: "Window" },
  { id: "sun", label: "Afternoon" },
  { id: "studio", label: "Studio" },
  { id: "lamp", label: "Lamp" },
  { id: "night", label: "Night" },
];

export const SKIN_SWATCHES = [
  "#f3d7c4",
  "#e8c4a8",
  "#d4a07a",
  "#c68662",
  "#a86b45",
  "#8d5524",
  "#6d3b1e",
  "#4a2914",
];

export const HAIR_SWATCHES = [
  "#1a1410",
  "#2a1c14",
  "#4a2c12",
  "#6b3a1a",
  "#8a4a24",
  "#c4a574",
  "#d8c8b0",
  "#c8ccd4",
  "#3a1010",
  "#0f1418",
];

export const OUTFIT_SWATCHES = [
  "#161616",
  "#2a2a2e",
  "#3d2a22",
  "#5c3a2e",
  "#6b4f3a",
  "#c4b09a",
  "#8a9a86",
  "#2c3a48",
  "#1e2430",
  "#4a1c1c",
];

export const DEFAULT_FACE: FaceSpec = {
  skin: "#d4a07a",
  lip: "#b07070",
  iris: "#3d4a3a",
  brow: "#2a1c14",
  hairStyle: "waves",
  hair: "#1a1410",
  outfitStyle: "crew",
  outfit: "#2a2a2e",
  lighting: "north",
  faceWidth: 1,
  jaw: 0.5,
  eyeSize: 1,
  eyeSpacing: 1,
  smile: 0.28,
  beard: 0,
  glasses: false,
  genderHint: "androgynous",
};

export function cloneFace(face: FaceSpec): FaceSpec {
  return { ...face };
}
