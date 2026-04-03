"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VoicePersona } from "@/lib/api";

interface PersonaCardProps {
  persona: VoicePersona;
  selected?: boolean;
  onSelect?: (persona: VoicePersona) => void;
  onSetDefault?: (id: string) => void;
  className?: string;
}

const TONE_COLORS: Record<string, string> = {
  formal: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  casual: "bg-green-500/10 text-green-700 dark:text-green-400",
  authoritative: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  conversational: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  academic: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  journalistic: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function getToneColor(tone: string): string {
  const key = tone.toLowerCase();
  return TONE_COLORS[key] || "bg-muted text-muted-foreground";
}

function formatTTR(richness: number): string {
  return (richness * 100).toFixed(1) + "%";
}

export function PersonaCard({
  persona,
  selected,
  onSelect,
  onSetDefault,
  className,
}: PersonaCardProps) {
  const profile = persona.voice_profile;
  const tone = profile?.tone || "Unknown";
  const ttr = profile?.vocabulary_richness ?? 0;
  const corpusSize = persona.source_articles?.length ?? 0;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:ring-2 hover:ring-primary/30",
        selected && "ring-2 ring-primary",
        className
      )}
      onClick={() => onSelect?.(persona)}
      role="button"
      tabIndex={0}
      aria-label={`Voice profile: ${persona.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(persona);
        }
      }}
    >
      <CardContent className="space-y-3">
        {/* Header row */}
        <div className="flex flex-wrap items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">{persona.name}</h3>
          </div>
          {persona.is_default && (
            <Badge variant="default" className="shrink-0">
              Default
            </Badge>
          )}
        </div>

        {/* Tone badge */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", getToneColor(tone))}>
            {tone}
          </Badge>
          {profile?.formality && (
            <Badge variant="outline" className="text-xs">
              {profile.formality}
            </Badge>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-muted/50 p-2">
            <div className="text-muted-foreground">TTR</div>
            <div className="font-semibold tabular-nums">{formatTTR(ttr)}</div>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <div className="text-muted-foreground">Corpus</div>
            <div className="font-semibold tabular-nums">
              {corpusSize} {corpusSize === 1 ? "article" : "articles"}
            </div>
          </div>
        </div>

        {/* Readability */}
        {profile?.readability_grade != null && (
          <div className="text-xs text-muted-foreground">
            Readability: Grade {profile.readability_grade.toFixed(1)}
          </div>
        )}

        {/* Set as Default button */}
        {!persona.is_default && onSetDefault && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault(persona.id);
            }}
          >
            Set as Default
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function PersonaCardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
