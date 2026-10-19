import { createFileRoute } from "@tanstack/react-router";
import { StudioView } from "@/components/studio-view";

type StudioSearch = { from?: string };

export const Route = createFileRoute("/studio")({
  validateSearch: (search: Record<string, unknown>): StudioSearch => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
  component: StudioPage,
});

function StudioPage() {
  const { from } = Route.useSearch();
  return <StudioView fromId={from} />;
}
