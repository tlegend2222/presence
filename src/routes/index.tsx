import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { CompanionCard } from "@/components/companion-card";
import { Button } from "@/components/ui/button";
import { BUILTIN_COMPANIONS } from "@/lib/companions";
import { usePresence } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const custom = usePresence((s) => s.custom);
  const remove = usePresence((s) => s.remove);

  return (
    <main className="bg-bg text-fg min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <div>
          <p className="presence-enter text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Presence
          </p>
          <h1 className="presence-enter presence-enter-delay-1 mt-3 max-w-xl font-serif text-4xl leading-[1.1] tracking-tight sm:text-5xl">
            Face to face, not thread to thread.
          </h1>
          <p className="presence-enter presence-enter-delay-2 mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            Call someone into the room. They look back. Make a new face, or sit down with one already here.
          </p>
        </div>
        <Button asChild size="pill" className="shrink-0">
          <Link to="/studio" search={{ from: undefined }}>
            <Plus className="size-4" />
            Create
          </Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BUILTIN_COMPANIONS.map((c, i) => (
            <div
              key={c.id}
              className="presence-enter"
              style={{ animationDelay: `${120 + i * 40}ms` }}
            >
              <CompanionCard companion={c} />
            </div>
          ))}
          {custom.map((c, i) => (
            <div
              key={c.id}
              className="presence-enter"
              style={{ animationDelay: `${360 + i * 40}ms` }}
            >
              <CompanionCard companion={c} onRemove={() => remove(c.id)} />
            </div>
          ))}
          <Link
            to="/studio"
            search={{ from: undefined }}
            className="flex aspect-[3/4] min-h-[22rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border text-muted transition-colors duration-150 hover:bg-raised hover:text-fg"
          >
            <Plus className="size-6" />
            <span className="font-serif text-2xl tracking-tight">New presence</span>
            <span className="px-6 text-center text-sm">Design a face. Give it a voice. Call it.</span>
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-subtle sm:px-6">
        Calls work in demo mode without an API key. Live Grok voice &amp; chat turn on when{" "}
        <code className="text-muted">XAI_API_KEY</code> is available.
      </footer>
    </main>
  );
}
