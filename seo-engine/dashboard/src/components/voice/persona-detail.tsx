"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VoicePersona } from "@/lib/api";

interface PersonaDetailProps {
  persona: VoicePersona;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClose?: () => void;
}

interface SignalDef {
  key: keyof NonNullable<VoicePersona["voice_profile"]>;
  label: string;
  format: (v: number) => string;
  tooltip: string;
}

const SIGNALS: SignalDef[] = [
  {
    key: "avg_sentence_length",
    label: "Avg Sentence Length",
    format: (v) => v.toFixed(1) + " words",
    tooltip: "Average number of words per sentence",
  },
  {
    key: "vocabulary_richness",
    label: "Type-Token Ratio",
    format: (v) => (v * 100).toFixed(1) + "%",
    tooltip: "Ratio of unique words to total words (higher = richer vocabulary)",
  },
  {
    key: "readability_grade",
    label: "Readability Grade",
    format: (v) => "Grade " + v.toFixed(1),
    tooltip: "Flesch-Kincaid grade level",
  },
  {
    key: "passive_voice_ratio",
    label: "Passive Voice",
    format: (v) => (v * 100).toFixed(1) + "%",
    tooltip: "Percentage of sentences using passive voice",
  },
  {
    key: "contraction_usage",
    label: "Contractions",
    format: (v) => (v * 100).toFixed(1) + "%",
    tooltip: "Rate of contraction usage (higher = more informal)",
  },
  {
    key: "question_frequency",
    label: "Questions",
    format: (v) => (v * 100).toFixed(1) + "%",
    tooltip: "Percentage of sentences that are questions",
  },
  {
    key: "exclamation_frequency",
    label: "Exclamations",
    format: (v) => (v * 100).toFixed(1) + "%",
    tooltip: "Percentage of sentences with exclamation marks",
  },
  {
    key: "paragraph_length",
    label: "Paragraph Length",
    format: (v) => v.toFixed(1) + " sentences",
    tooltip: "Average sentences per paragraph",
  },
  {
    key: "transition_density",
    label: "Transition Density",
    format: (v) => (v * 100).toFixed(1) + "%",
    tooltip: "Rate of transitional phrases per sentence",
  },
  {
    key: "personal_pronoun_ratio",
    label: "Personal Pronouns",
    format: (v) => (v * 100).toFixed(1) + "%",
    tooltip: "Rate of personal pronoun usage",
  },
];

function getBarWidth(value: number, maxExpected: number): number {
  return Math.min(100, Math.max(0, (value / maxExpected) * 100));
}

const MAX_VALUES: Partial<Record<string, number>> = {
  avg_sentence_length: 30,
  vocabulary_richness: 1,
  readability_grade: 18,
  passive_voice_ratio: 1,
  contraction_usage: 1,
  question_frequency: 1,
  exclamation_frequency: 1,
  paragraph_length: 10,
  transition_density: 1,
  personal_pronoun_ratio: 1,
};

export function PersonaDetail({
  persona,
  onSetDefault,
  onDelete,
  onClose,
}: PersonaDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [defaultLoading, setDefaultLoading] = useState(false);

  const profile = persona.voice_profile;

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleteLoading(true);
    try {
      await onDelete?.(persona.id);
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(false);
    }
  }

  async function handleSetDefault() {
    setDefaultLoading(true);
    try {
      await onSetDefault?.(persona.id);
    } finally {
      setDefaultLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold truncate">{persona.name}</h2>
            {persona.is_default && (
              <Badge variant="default">Default</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Created {new Date(persona.created_at).toLocaleDateString()}
            {persona.updated_at && (
              <> &middot; Updated {new Date(persona.updated_at).toLocaleDateString()}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!persona.is_default && onSetDefault && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSetDefault}
              disabled={defaultLoading}
            >
              {defaultLoading ? "Setting..." : "Set as Default"}
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant={confirmDelete ? "destructive" : "ghost"}
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading
                ? "Deleting..."
                : confirmDelete
                  ? "Confirm Delete"
                  : "Delete"}
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Voice Profile Signals */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Voice Profile</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {profile?.tone && (
            <Badge variant="secondary">{profile.tone}</Badge>
          )}
          {profile?.formality && (
            <Badge variant="outline">{profile.formality}</Badge>
          )}
        </div>

        <div className="space-y-2">
          {SIGNALS.map((signal) => {
            const value = profile?.[signal.key];
            if (value == null || typeof value !== "number") return null;
            const maxVal = MAX_VALUES[signal.key as string] ?? 1;
            const barPct = getBarWidth(value, maxVal);

            return (
              <Tooltip key={signal.key}>
                <TooltipTrigger asChild>
                  <div className="group" role="meter" aria-label={signal.label} aria-valuenow={value}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{signal.label}</span>
                      <span className="font-medium tabular-nums">
                        {signal.format(value)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{signal.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Representative Sentences */}
      {persona.representative_sentences && persona.representative_sentences.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-3">Sample Sentences</h3>
            <div className="space-y-2">
              {persona.representative_sentences.map((sentence, i) => (
                <blockquote
                  key={i}
                  className="border-s-2 border-primary/30 ps-3 text-sm text-muted-foreground italic leading-relaxed"
                >
                  {sentence}
                </blockquote>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Source Articles */}
      {persona.source_articles && persona.source_articles.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-3">
              Source Articles
              <span className="ms-1.5 text-xs text-muted-foreground font-normal">
                ({persona.source_articles.length})
              </span>
            </h3>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {persona.source_articles.map((article, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md bg-muted/50 p-2 text-xs"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-muted-foreground"
                  >
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  </svg>
                  <span className="truncate flex-1" title={article.url}>
                    {article.title || article.url}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Cluster info */}
      {persona.cluster_size != null && (
        <div className="text-xs text-muted-foreground">
          Cluster size: {persona.cluster_size} articles
        </div>
      )}
    </div>
  );
}

export function PersonaDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-px bg-border" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-1.5 w-full animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
