"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  fetchUserAnalyticsDetail,
  type UserAnalyticsDetail,
} from "@/lib/api";

interface Props {
  userId: string | null;
  userEmail?: string;
  onClose: () => void;
}

export function UserAnalyticsDetailDialog({ userId, userEmail, onClose }: Props) {
  const [data, setData] = useState<UserAnalyticsDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    fetchUserAnalyticsDetail(userId)
      .then((res) => setData(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Analytics — {userEmail || userId}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-40" />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {data && !loading && (
          <div className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground">Generations</p>
                  <p className="text-xl font-bold">{data.generations.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground">Edits</p>
                  <p className="text-xl font-bold">{data.edits.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground">Error Rate</p>
                  <p className="text-xl font-bold">{data.error_rate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-xs text-muted-foreground">Total Actions</p>
                  <p className="text-xl font-bold">{data.total_actions}</p>
                </CardContent>
              </Card>
            </div>

            {/* Topic frequency */}
            {Object.keys(data.topic_frequency).length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-2">Top Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.topic_frequency)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10)
                      .map(([topic, count]) => (
                        <Badge key={topic} variant="secondary">
                          {topic} ({count})
                        </Badge>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Framework distribution */}
            {Object.keys(data.framework_distribution).length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Frameworks Used</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.framework_distribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([fw, count]) => (
                      <Badge key={fw} variant="outline">
                        {fw} ({count})
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Plugin instances */}
            {data.instances.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-2">Plugin Instances</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project</TableHead>
                          <TableHead>Framework</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead>Last Seen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.instances.map((inst) => (
                          <TableRow key={inst.id}>
                            <TableCell className="font-medium text-sm">
                              {inst.project_name || "—"}
                            </TableCell>
                            <TableCell className="text-sm">{inst.framework || "—"}</TableCell>
                            <TableCell className="text-sm font-mono">{inst.plugin_version || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(inst.last_seen_at).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}

            {/* Recent articles */}
            {data.articles.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-2">Recent Articles</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.articles.slice(0, 10).map((art) => (
                          <TableRow key={art.id}>
                            <TableCell className="font-medium text-sm max-w-[200px] truncate">
                              {art.title || art.topic}
                            </TableCell>
                            <TableCell>
                              <Badge variant={art.status === "published" ? "default" : "secondary"}>
                                {art.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(art.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
