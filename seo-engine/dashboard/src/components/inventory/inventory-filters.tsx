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
import type { InventoryParams } from "@/lib/api";

interface InventoryFiltersProps {
  filters: InventoryParams;
  onChange: (filters: InventoryParams) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "healthy", label: "Healthy" },
  { value: "needs_review", label: "Needs Review" },
  { value: "thin", label: "Thin Content" },
  { value: "error", label: "Error" },
  { value: "new", label: "New" },
];

export function InventoryFilters({
  filters,
  onChange,
  onReset,
}: InventoryFiltersProps) {
  const hasFilters =
    !!filters.status ||
    !!filters.search ||
    !!filters.min_words ||
    !!filters.max_words ||
    !!filters.date_from ||
    !!filters.date_to;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search URL or title..."
          value={filters.search ?? ""}
          onChange={(e) =>
            onChange({ ...filters, search: e.target.value, page: 1 })
          }
        />
      </div>

      <div className="w-[160px]">
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

      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min words"
          className="w-[110px]"
          value={filters.min_words ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              min_words: e.target.value ? Number(e.target.value) : undefined,
              page: 1,
            })
          }
        />
        <span className="text-muted-foreground text-sm">-</span>
        <Input
          type="number"
          placeholder="Max words"
          className="w-[110px]"
          value={filters.max_words ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              max_words: e.target.value ? Number(e.target.value) : undefined,
              page: 1,
            })
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          className="w-[140px]"
          value={filters.date_from ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              date_from: e.target.value || undefined,
              page: 1,
            })
          }
        />
        <span className="text-muted-foreground text-sm">-</span>
        <Input
          type="date"
          className="w-[140px]"
          value={filters.date_to ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              date_to: e.target.value || undefined,
              page: 1,
            })
          }
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
