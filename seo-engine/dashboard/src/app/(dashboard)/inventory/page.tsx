"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { DetailSlideover } from "@/components/inventory/detail-slideover";
import {
  getInventory,
  type InventoryItem,
  type InventoryParams,
} from "@/lib/api";

const DEFAULT_PER_PAGE = 50;

const DEFAULT_FILTERS: InventoryParams = {
  page: 1,
  per_page: DEFAULT_PER_PAGE,
  sort: "last_crawled",
  order: "desc",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryParams>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchData = useCallback(async (params: InventoryParams) => {
    setLoading(true);
    setError(null);
    try {
      const cleanParams = { ...params };
      // Map __all back to empty for the API
      if (cleanParams.status === "__all") {
        cleanParams.status = undefined;
      }
      const res = await getInventory(cleanParams);
      if (res.success) {
        setItems(res.data);
        setTotal(res.meta.total);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load inventory";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  function handleSort(column: string) {
    setFilters((prev) => ({
      ...prev,
      sort: column,
      order:
        prev.sort === column && prev.order === "asc" ? "desc" : "asc",
      page: 1,
    }));
  }

  function handlePageChange(page: number) {
    setFilters((prev) => ({ ...prev, page }));
  }

  function handleFilterChange(newFilters: InventoryParams) {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }

  function handleFilterReset() {
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Content Inventory</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {total.toLocaleString()} URLs
          </span>
        </div>
      </div>

      {/* Filters */}
      <InventoryFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchData(filters)}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-muted-foreground mb-4"
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 13H8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17H8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="text-lg font-semibold mb-1">No content found</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              {filters.search || filters.status
                ? "No URLs match your current filters. Try adjusting your search or clearing filters."
                : "Start by connecting your Google account and running a crawl to populate your content inventory."}
            </p>
            {!filters.search && !filters.status && (
              <Button
                onClick={() => {
                  window.location.href = "/settings/connections";
                }}
              >
                Connect & Crawl
              </Button>
            )}
            {(filters.search || filters.status) && (
              <Button variant="outline" onClick={handleFilterReset}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {(loading || items.length > 0) && (
        <InventoryTable
          items={items}
          loading={loading}
          total={total}
          page={filters.page ?? 1}
          perPage={filters.per_page ?? DEFAULT_PER_PAGE}
          sort={filters.sort ?? "last_crawled"}
          order={filters.order ?? "desc"}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onRowClick={setSelectedId}
          filters={filters}
        />
      )}

      {/* Detail Slideover */}
      <DetailSlideover
        itemId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
