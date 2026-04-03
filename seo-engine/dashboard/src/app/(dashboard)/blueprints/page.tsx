"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

interface Blueprint {
  id: string;
  name: string;
  category: string;
  role: string;
  pattern: string[];
}

export default function BlueprintsPage() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Blueprint | null>(null);
  const limit = 12;

  const fetchBlueprints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (category) params.set("category", category);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const data = await apiFetch<{ success: boolean; data: Blueprint[]; meta: { total: number } }>(
        `/api/blueprints?${params}`
      );
      if (data.success) {
        setBlueprints(data.data);
        setTotal(data.meta.total);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  useEffect(() => {
    apiFetch<{ success: boolean; data: string[] }>("/api/blueprints/categories")
      .then((d) => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBlueprints();
  }, [fetchBlueprints]);

  // Debounced search
  useEffect(() => {
    setPage(1);
  }, [search, category]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Component Blueprints</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {total} structural components available for article generation
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search blueprints..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant={category === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory("")}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Blueprint Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : blueprints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No blueprints found{search ? ` matching "${search}"` : ""}.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {blueprints.map((bp) => (
            <Card
              key={bp.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelected(bp)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium leading-tight">
                    {bp.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {bp.category}
                  </Badge>
                </div>
                <CardDescription className="text-xs line-clamp-2">
                  {bp.role}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <code className="text-[10px] text-muted-foreground font-mono">
                  {bp.id}
                </code>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelected(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Blueprint: ${selected.name}`}
        >
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selected.name}</CardTitle>
                  <CardDescription className="mt-1">{selected.role}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{selected.category}</Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {selected.id}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="text-sm font-medium mb-2">Structural Pattern</h4>
              {selected.pattern.length > 0 ? (
                <ul className="text-sm text-muted-foreground space-y-1">
                  {selected.pattern.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-muted-foreground/50">-</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No structural pattern defined.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
