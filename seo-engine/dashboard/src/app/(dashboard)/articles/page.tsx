"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { fetchArticles, type Article } from "@/lib/api";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  published: "default",
  draft: "outline",
  generating: "secondary",
  archived: "secondary",
  failed: "destructive",
};

const STATUSES = ["all", "draft", "generating", "published", "archived"];

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: "20",
      };
      if (search) params.search = search;
      if (status !== "all") params.status = status;

      const res = await fetchArticles(params);
      if (res.success) {
        setArticles(res.data);
        setTotal(res.meta.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{total} total</p>
          <Link href="/generate">
            <Button size="sm">Generate Article</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search articles..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v ?? "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Topic</TableHead>
                <TableHead className="hidden md:table-cell">Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Words</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                : articles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        {search || status !== "all"
                          ? "No articles match your filters."
                          : "No articles yet. Generate your first article to get started."}
                      </TableCell>
                    </TableRow>
                  )
                : articles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <Link
                          href={`/articles/${article.id}`}
                          className="font-medium hover:underline"
                        >
                          {article.title}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {article.topic}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">
                        {article.language}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[article.status] || "outline"}>
                          {article.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs">
                        {article.word_count?.toLocaleString() ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                        {new Date(article.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
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
        </CardContent>
      </Card>
    </div>
  );
}
