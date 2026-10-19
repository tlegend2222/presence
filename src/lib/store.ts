import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BUILTIN_COMPANIONS, type ChatTurn, type Companion } from "./companions";

type PresenceState = {
  custom: Companion[];
  transcripts: Record<string, ChatTurn[]>;
  captions: boolean;
  upsert: (c: Companion) => void;
  remove: (id: string) => void;
  addTurn: (id: string, turn: ChatTurn) => void;
  clearTranscript: (id: string) => void;
  setCaptions: (on: boolean) => void;
};

export const usePresence = create<PresenceState>()(
  persist(
    (set) => ({
      custom: [],
      transcripts: {},
      captions: true,
      upsert: (c) =>
        set((s) => ({
          custom: s.custom.some((x) => x.id === c.id)
            ? s.custom.map((x) => (x.id === c.id ? c : x))
            : [...s.custom, c].slice(-12),
        })),
      remove: (id) =>
        set((s) => {
          const transcripts = { ...s.transcripts };
          delete transcripts[id];
          return { custom: s.custom.filter((c) => c.id !== id), transcripts };
        }),
      addTurn: (id, turn) =>
        set((s) => {
          const prev = s.transcripts[id] ?? [];
          return { transcripts: { ...s.transcripts, [id]: [...prev, turn].slice(-40) } };
        }),
      clearTranscript: (id) =>
        set((s) => {
          const transcripts = { ...s.transcripts };
          delete transcripts[id];
          return { transcripts };
        }),
      setCaptions: (on) => set({ captions: on }),
    }),
    { name: "presence-v1" },
  ),
);

export function allCompanions(custom: Companion[]): Companion[] {
  return [...BUILTIN_COMPANIONS, ...custom];
}
