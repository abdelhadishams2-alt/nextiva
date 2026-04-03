"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OpportunityFilters } from "@/lib/api";

interface OpportunityFiltersBarProps {
  filters: OpportunityFilters;
  onChange: (filters: OpportunityFilters) => void;
  onReset: () => void;
  /** Which filter options to show, varies by tab */
  variant?: "recommendations" | "gaps" | "cannibalization" | "decay";
}

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "content_gap", label: "Content Gap" },
  { value: "optimization", label: "Optimization" },
  { value: "consolidation", label: "Consolidation" },
  { value: "new_topic", label: "New Topic" },
  { value: "update", label: "Content Update" },
];

const IMPACT_OPTIONS = [
  { value: "", label: "All impacts" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "dismissed", label: "Dismissed" },
  { value: "executed", label: "Executed" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "All severities" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

export function OpportunityFiltersBar({
  filters,
  onChange,
  onReset,
  variant = "recommendations",
}: OpportunityFiltersBarProps) {
  const hasFilters =
    !!filters.type ||
    !!filters.impact ||
    !!filters.status ||
    !!filters.search;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search..."
          value={filters.search ?? ""}
          onChange={(e) =>
            onChange({ ...filters, search: e.target.value, page: 1 })
          }
        />
      </div>

      {variant === "recommendations" && (
        <>
          <div className="w-[160px]">
            <Select
              value={filters.type ?? ""}
              onValueChange={(v) =>
                onChange({ ...filters, type: v || undefined, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || "__all"} value={opt.value || "__all"}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[140px]">
            <Select
              value={filters.impact ?? ""}
              onValueChange={(v) =>
                onChange({ ...filters, impact: v || undefined, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All impacts" />
              </SelectTrigger>
              <SelectContent>
                {IMPACT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || "__all"} value={opt.value || "__all"}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[140px]">
            <Select
              value={filters.status ?? ""}
              onValueChange={(v) =>
                onChange({ ...filters, status: v || undefined, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || "__all"} value={opt.value || "__all"}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {(variant === "cannibalization" || variant === "decay") && (
        <div className="w-[160px]">
          <Select
            value={filters.impact ?? ""}
            onValueChange={(v) =>
              onChange({ ...filters, impact: v || undefined, page: 1 })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All severities" />
            </SelectTrigger>
            <SelectContent>
              {SEVERITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || "__all"} value={opt.value || "__all"}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
