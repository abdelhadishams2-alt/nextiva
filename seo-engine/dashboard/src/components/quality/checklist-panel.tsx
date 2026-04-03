"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EEATRadar, EEATRadarSkeleton } from "./eeat-radar";
import { SuggestionsList, SuggestionsListSkeleton } from "./suggestions-list";
import type { QualityCheckItem, EEATDimension, QualitySuggestion } from "@/lib/api";

interface ChecklistPanelProps {
  checklist: QualityCheckItem[];
  eeat: EEATDimension[];
  suggestions: QualitySuggestion[];
  className?: string;
}

type FilterType = "all" | "fail" | "warning" | "pass";

const STATUS_BADGE: Record<string, { variant: "default" | "destructive" | "outline" | "secondary"; label: string }> = {
  pass: { variant: "default", label: "Pass" },
  fail: { variant: "destructive", label: "Fail" },
  warning: { variant: "secondary", label: "Warning" },
};

export function ChecklistPanel({ checklist, eeat, suggestions, className }: ChecklistPanelProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group by category
  const categories = new Map<string, QualityCheckItem[]>();
  for (const item of checklist) {
    const list = categories.get(item.category) || [];
    list.push(item);
    categories.set(item.category, list);
  }

  // Filter
  const filteredCategories = new Map<string, QualityCheckItem[]>();
  for (const [cat, items] of categories) {
    const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);
    if (filtered.length > 0) {
      filteredCategories.set(cat, filtered);
    }
  }

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const failCount = checklist.filter((i) => i.status === "fail").length;
  const warnCount = checklist.filter((i) => i.status === "warning").length;
  const passCount = checklist.filter((i) => i.status === "pass").length;

  return (
    <Tabs defaultValue="checklist" className={className}>
      <TabsList>
        <TabsTrigger value="checklist">
          Checklist ({checklist.length})
        </TabsTrigger>
        <TabsTrigger value="eeat">
          E-E-A-T ({eeat.length})
        </TabsTrigger>
        <TabsTrigger value="suggestions">
          Suggestions ({suggestions.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="checklist" className="mt-4">
        {/* Filter buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({checklist.length})
          </Button>
          <Button
            variant={filter === "fail" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("fail")}
          >
            Failed ({failCount})
          </Button>
          <Button
            variant={filter === "warning" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("warning")}
          >
            Warnings ({warnCount})
          </Button>
          <Button
            variant={filter === "pass" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pass")}
          >
            Passed ({passCount})
          </Button>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          {Array.from(filteredCategories).map(([cat, items]) => {
            const isExpanded = expandedCategories.has(cat);
            const catFails = items.filter((i) => i.status === "fail").length;
            const catWarns = items.filter((i) => i.status === "warning").length;

            return (
              <div key={cat} className="overflow-hidden rounded-lg border border-border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-start hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCategory(cat)}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <svg
                      className={cn(
                        "size-4 shrink-0 transition-transform",
                        isExpanded && "rotate-90",
                        "[html[dir=rtl]_&]:rotate-180",
                        isExpanded && "[html[dir=rtl]_&]:rotate-90"
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-medium truncate">{cat}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">{items.length} items</span>
                    {catFails > 0 && (
                      <Badge variant="destructive">{catFails}</Badge>
                    )}
                    {catWarns > 0 && (
                      <Badge variant="secondary">{catWarns}</Badge>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {items.map((item) => {
                      const cfg = STATUS_BADGE[item.status] || STATUS_BADGE.pass;
                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 border-b border-border/50 px-4 py-2.5 last:border-b-0"
                        >
                          <Badge variant={cfg.variant} className="mt-0.5 shrink-0">
                            {cfg.label}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">{item.label}</p>
                            {item.detail && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {item.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {filteredCategories.size === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No items match the selected filter.
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="eeat" className="mt-4">
        <EEATRadar dimensions={eeat} />
      </TabsContent>

      <TabsContent value="suggestions" className="mt-4">
        <SuggestionsList suggestions={suggestions} />
      </TabsContent>
    </Tabs>
  );
}

export function ChecklistPanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
