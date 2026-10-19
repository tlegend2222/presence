import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CallView } from "@/components/call-view";
import { Button } from "@/components/ui/button";
import { companionById } from "@/lib/companions";
import { usePresence } from "@/lib/store";

export const Route = createFileRoute("/call/$id")({
  component: CallPage,
});

function CallPage() {
  const { id } = Route.useParams();
  const custom = usePresence((s) => s.custom);
  const companion = companionById(id, custom);
  const [ready, setReady] = useState(() =>
    typeof window === "undefined" ? true : usePresence.persist.hasHydrated(),
  );

  useEffect(() => {
    if (usePresence.persist.hasHydrated()) {
      setReady(true);
      return;
    }
    return usePresence.persist.onFinishHydration(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <main className="bg-bg text-fg flex min-h-dvh items-center justify-center px-6">
        <p className="text-sm text-muted">Connecting…</p>
      </main>
    );
  }

  if (!companion) {
    return (
      <main className="bg-bg text-fg flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-serif text-3xl tracking-tight">They already hung up.</h1>
        <p className="max-w-sm text-sm text-muted">
          That presence isn&apos;t here. Make a new one, or call someone waiting.
        </p>
        <Button asChild className="rounded-full">
          <Link to="/">Back to the room</Link>
        </Button>
      </main>
    );
  }

  return <CallView companion={companion} />;
}
