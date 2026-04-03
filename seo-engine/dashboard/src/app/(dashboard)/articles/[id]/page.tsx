"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchArticle,
  fetchArticleVersions,
  type Article,
} from "@/lib/api";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  published: "default",
  draft: "outline",
  generating: "secondary",
  archived: "secondary",
  failed: "destructive",
};

interface ArticleVersion {
  id: string;
  version_number: number;
  section_edited: string | null;
  word_count_delta: number;
  created_at: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [articleRes, versionsRes] = await Promise.all([
          fetchArticle(articleId).catch(() => null),
          fetchArticleVersions(articleId).catch(() => null),
        ]);
        if (articleRes?.success) setArticle(articleRes.data);
        if (versionsRes?.success) setVersions(versionsRes.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [articleId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Article Not Found</h1>
        <p className="text-muted-foreground">
          This article may have been deleted or you don&apos;t have access.
        </p>
        <Button variant="outline" onClick={() => router.push("/articles")}>
          Back to Articles
        </Button>
      </div>
    );
  }

  const metadata = article.metadata || {};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {article.title}
            </h1>
            <Badge variant={STATUS_VARIANT[article.status] || "outline"}>
              {article.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {article.topic} &middot; {article.language} &middot; {article.framework}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/articles")}>
          Back
        </Button>
      </div>

      <Tabs defaultValue="metadata">
        <TabsList>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="versions">
            Versions ({versions.length})
          </TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="metadata" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <MetaField label="ID" value={article.id} mono />
                <MetaField
                  label="Created"
                  value={new Date(article.created_at).toLocaleString()}
                />
                <MetaField
                  label="Updated"
                  value={new Date(article.updated_at).toLocaleString()}
                />
                <MetaField
                  label="Published"
                  value={
                    article.published_at
                      ? new Date(article.published_at).toLocaleString()
                      : "Not published"
                  }
                />
                <MetaField
                  label="Word Count"
                  value={article.word_count?.toLocaleString() ?? "—"}
                />
                <MetaField
                  label="Images"
                  value={String(article.image_count)}
                />
                <MetaField
                  label="File Path"
                  value={article.file_path || "—"}
                  mono
                />
                <MetaField
                  label="Language"
                  value={article.language}
                />
              </div>

              {Object.keys(metadata).length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="mb-3 text-sm font-medium">
                      Extended Metadata
                    </h3>
                    <pre className="rounded-md bg-muted p-4 text-xs font-mono overflow-auto max-h-64">
                      {JSON.stringify(metadata, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {versions.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No version history yet. Versions are created when sections are edited.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Section Edited</TableHead>
                      <TableHead>Word Delta</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-sm">
                          v{v.version_number}
                        </TableCell>
                        <TableCell>{v.section_edited || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {v.word_count_delta > 0
                            ? `+${v.word_count_delta}`
                            : String(v.word_count_delta)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(v.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Article Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {article.file_path ? (
                <p className="text-sm text-muted-foreground">
                  Preview is available when viewing the generated HTML file
                  directly. File location:{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                    {article.file_path}
                  </code>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No preview available. The article has not been generated yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetaField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 text-sm ${mono ? "font-mono text-xs break-all" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
