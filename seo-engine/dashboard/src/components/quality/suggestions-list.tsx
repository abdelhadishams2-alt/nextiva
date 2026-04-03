"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { QualitySuggestion } from "@/lib/api";

interface SuggestionsListProps {
  suggestions: QualitySuggestion[];
  className?: string;
}

const PRIORITY_CONFIG: Record<string, { variant: "default" | "destructive" | "outline"; label: string }> = {
  high: { variant: "destructive", label: "High" },
  medium: { variant: "default", label: "Medium" },
  low: { variant: "outline", label: "Low" },
};

export function SuggestionsList({ suggestions, className }: SuggestionsListProps) {
  if (suggestions.length === 0) {
    return (
      <div className={cn("py-8 text-center text-sm text-muted-foreground", className)}>
        No suggestions. This article meets all quality standards.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {suggestions.slice(0, 15).map((s) => {
        const config = PRIORITY_CONFIG[s.priority] || PRIORITY_CONFIG.low;
        return (
          <Card key={s.id} size="sm">
            <CardContent>
              <div className="flex flex-wrap items-start gap-2">
                <Badge variant={config.variant}>{config.label}</Badge>
                <Badge variant="secondary">{s.category}</Badge>
                {s.auto_fixable && (
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                    Auto-fixable
                  </Badge>
                )}
              </div>
              <h4 className="mt-2 text-sm font-medium">{s.title}</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {s.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function SuggestionsListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
