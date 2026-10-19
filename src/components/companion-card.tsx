import { Link } from "@tanstack/react-router";
import { Pencil, Phone, Trash2 } from "lucide-react";
import { CompanionFace } from "@/components/companion-face";
import { Button } from "@/components/ui/button";
import type { Companion } from "@/lib/companions";
import { cn } from "@/lib/utils";

export function CompanionCard({
  companion,
  onRemove,
  className,
}: {
  companion: Companion;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative isolate flex aspect-[3/4] min-h-[22rem] w-full flex-col overflow-hidden rounded-2xl",
        "shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-200 ease-out",
        "hover:shadow-[var(--shadow-border-hover)]",
        className,
      )}
    >
      <CompanionFace
        companion={companion}
        alt={`${companion.name}, listening`}
        className="absolute inset-0 h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
      <div className="relative mt-auto flex flex-col gap-3 p-4">
        <div>
          <h2 className="font-serif text-2xl leading-tight tracking-tight text-fg">
            {companion.name}
          </h2>
          <p className="mt-1 text-sm leading-snug text-muted">{companion.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="min-h-11 flex-1 rounded-full">
            <Link to="/call/$id" params={{ id: companion.id }}>
              <Phone className="size-4" />
              Call
            </Link>
          </Button>
          {!companion.builtIn ? (
            <>
              <Button asChild variant="quiet" size="icon" className="rounded-full">
                <Link to="/studio" search={{ from: companion.id }} aria-label={`Edit ${companion.name}`}>
                  <Pencil />
                </Link>
              </Button>
              <Button
                type="button"
                variant="quiet"
                size="icon"
                className="rounded-full"
                aria-label={`Remove ${companion.name}`}
                onClick={onRemove}
              >
                <Trash2 />
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
