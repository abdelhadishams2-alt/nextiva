"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  adminListUsers,
  adminApproveUser,
  adminRevokeUser,
  adminDeleteUser,
  adminAddUser,
  adminUpdatePlan,
  adminGetQuotaStats,
  adminListPluginInstances,
  adminListPluginConfig,
  adminSetPluginConfig,
  type AdminUser,
  type Subscription,
  type PluginInstance,
  type PluginConfigEntry,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { UserAnalyticsDetailDialog } from "@/components/user-analytics-detail";

const PLANS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "professional", label: "Professional" },
  { value: "enterprise", label: "Enterprise" },
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  pending: "outline",
  revoked: "destructive",
};

interface UserWithSub extends AdminUser {
  subscription?: Subscription;
}

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Dialog states
  const [deleteUser, setDeleteUser] = useState<UserWithSub | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Quota override dialog
  const [quotaUser, setQuotaUser] = useState<UserWithSub | null>(null);
  const [quotaArticles, setQuotaArticles] = useState("");
  const [quotaEdits, setQuotaEdits] = useState("");
  const [quotaSaving, setQuotaSaving] = useState(false);

  // Usage analytics
  const [stats, setStats] = useState<{
    total_users: number;
    active_users: number;
    total_articles: number;
    total_edits: number;
    by_plan: Record<string, number>;
    users_at_limit: number;
  } | null>(null);

  // User analytics detail dialog
  const [analyticsUserId, setAnalyticsUserId] = useState<string | null>(null);
  const [analyticsUserEmail, setAnalyticsUserEmail] = useState("");

  // Plugin instances tab
  const [instances, setInstances] = useState<PluginInstance[]>([]);
  const [instancesLoading, setInstancesLoading] = useState(false);

  // Remote config tab
  const [configs, setConfigs] = useState<PluginConfigEntry[]>([]);
  const [configsLoading, setConfigsLoading] = useState(false);
  const [newConfigKey, setNewConfigKey] = useState("");
  const [newConfigValue, setNewConfigValue] = useState("");
  const [newConfigDesc, setNewConfigDesc] = useState("");
  const [configSaving, setConfigSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, statsRes] = await Promise.all([
        adminListUsers(),
        adminGetQuotaStats().catch(() => null),
      ]);
      const subMap = new Map<string, Subscription>();
      for (const sub of res.subscriptions) {
        subMap.set(sub.user_id, sub);
      }
      const merged: UserWithSub[] = res.users.map((u) => ({
        ...u,
        subscription: subMap.get(u.id),
      }));
      setUsers(merged);
      if (statsRes?.data) setStats(statsRes.data as typeof stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <Alert variant="destructive">
          <AlertDescription>Admin access required.</AlertDescription>
        </Alert>
      </div>
    );
  }

  async function handleApprove(userId: string) {
    setActionLoading(userId);
    try {
      await adminApproveUser(userId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRevoke(userId: string) {
    setActionLoading(userId);
    try {
      await adminRevokeUser(userId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke user");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setActionLoading(deleteUser.id);
    try {
      await adminDeleteUser(deleteUser.id);
      setDeleteUser(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      await adminAddUser(addEmail, addPassword);
      setAddDialogOpen(false);
      setAddEmail("");
      setAddPassword("");
      await load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add user");
    } finally {
      setAddLoading(false);
    }
  }

  function openQuotaDialog(user: UserWithSub) {
    setQuotaUser(user);
    const sub = user.subscription;
    setQuotaArticles(sub?.plan === "enterprise" ? "-1" : "");
    setQuotaEdits(sub?.plan === "enterprise" ? "-1" : "");
  }

  async function handleQuotaSave() {
    if (!quotaUser) return;
    setQuotaSaving(true);
    try {
      const updates: Record<string, unknown> = { plan: quotaUser.subscription?.plan || "free" };
      if (quotaArticles) updates.articles_per_month = Number(quotaArticles);
      if (quotaEdits) updates.edits_per_day = Number(quotaEdits);
      await adminUpdatePlan(quotaUser.id, updates as { plan: string; articles_per_month?: number; edits_per_day?: number });
      setQuotaUser(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update quota");
    } finally {
      setQuotaSaving(false);
    }
  }

  async function handlePlanChange(userId: string, plan: string) {
    setActionLoading(userId);
    try {
      await adminUpdatePlan(userId, { plan });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update plan");
    } finally {
      setActionLoading(null);
    }
  }

  async function loadInstances() {
    setInstancesLoading(true);
    try {
      const res = await adminListPluginInstances();
      setInstances(res.data || []);
    } catch {
      setInstances([]);
    } finally {
      setInstancesLoading(false);
    }
  }

  async function loadConfigs() {
    setConfigsLoading(true);
    try {
      const res = await adminListPluginConfig();
      setConfigs(res.data || []);
    } catch {
      setConfigs([]);
    } finally {
      setConfigsLoading(false);
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!newConfigKey.trim()) return;
    setConfigSaving(true);
    try {
      let parsedValue: unknown;
      try {
        parsedValue = JSON.parse(newConfigValue);
      } catch {
        parsedValue = newConfigValue;
      }
      await adminSetPluginConfig(newConfigKey.trim(), parsedValue, newConfigDesc || undefined);
      setNewConfigKey("");
      setNewConfigValue("");
      setNewConfigDesc("");
      await loadConfigs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save config");
    } finally {
      setConfigSaving(false);
    }
  }

  function openUserAnalytics(user: UserWithSub) {
    setAnalyticsUserId(user.id);
    setAnalyticsUserEmail(user.email);
  }

  function isStale(lastSeen: string) {
    const diff = Date.now() - new Date(lastSeen).getTime();
    return diff > 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  const pendingCount = users.filter(
    (u) => u.subscription?.status === "pending"
  ).length;

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
          {pendingCount > 0 && (
            <Badge variant="outline">{pendingCount} pending</Badge>
          )}
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>Add User</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
          <TabsTrigger value="instances" onClick={() => { if (instances.length === 0) loadInstances(); }}>Plugin Instances</TabsTrigger>
          <TabsTrigger value="config" onClick={() => { if (configs.length === 0) loadConfigs(); }}>Remote Config</TabsTrigger>
        </TabsList>

        {/* ── Users Tab ── */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                      ))
                    : filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                            {search ? "No users match your search." : "No users registered yet."}
                          </TableCell>
                        </TableRow>
                      )
                    : filtered.map((user) => {
                        const sub = user.subscription;
                        const status = sub?.status || "pending";
                        const isPending = status === "pending";

                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>
                              {status === "active" ? (
                                <Select
                                  value={sub?.plan || "free"}
                                  onValueChange={(v) => v && handlePlanChange(user.id, v)}
                                >
                                  <SelectTrigger className="h-7 w-[130px] text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PLANS.map((p) => (
                                      <SelectItem key={p.value} value={p.value}>
                                        {p.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-muted-foreground">
                                  {sub?.plan || "—"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={STATUS_VARIANT[status] || "outline"}>
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {sub?.role || "user"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {isPending ? (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={actionLoading === user.id}
                                    onClick={() => handleApprove(user.id)}
                                    title="Approve"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={actionLoading === user.id}
                                    onClick={() => handleRevoke(user.id)}
                                    title="Reject"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                                  </Button>
                                </div>
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                                    </svg>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openUserAnalytics(user)}>
                                      View Analytics
                                    </DropdownMenuItem>
                                    {status === "active" && (
                                      <DropdownMenuItem onClick={() => openQuotaDialog(user)}>
                                        Quota Override
                                      </DropdownMenuItem>
                                    )}
                                    {status === "active" && (
                                      <DropdownMenuItem onClick={() => handleRevoke(user.id)}>
                                        Revoke Access
                                      </DropdownMenuItem>
                                    )}
                                    {status === "revoked" && (
                                      <DropdownMenuItem onClick={() => handleApprove(user.id)}>
                                        Reactivate
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => setDeleteUser(user)}
                                    >
                                      Delete User
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Usage Analytics Tab ── */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          {stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.total_users}</p>
                    <p className="text-xs text-muted-foreground">{stats.active_users} active</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Articles Generated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.total_articles}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Edits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.total_edits}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">At Quota Limit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.users_at_limit}</p>
                    <p className="text-xs text-muted-foreground">users need attention</p>
                  </CardContent>
                </Card>
              </div>

              {stats.by_plan && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Users by Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.by_plan).map(([plan, count]) => {
                        const total = stats.total_users || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={plan} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="capitalize font-medium">{plan}</span>
                              <span className="text-muted-foreground">{count} users ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {loading ? "Loading analytics..." : "Analytics unavailable. Ensure the bridge server is running."}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Plugin Instances Tab ── */}
        <TabsContent value="instances" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Registered Plugin Installations</CardTitle>
                <Button variant="outline" size="sm" onClick={loadInstances} disabled={instancesLoading}>
                  {instancesLoading ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Framework</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instancesLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    : instances.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                            No plugin instances registered yet.
                          </TableCell>
                        </TableRow>
                      )
                    : instances.map((inst) => (
                        <TableRow key={inst.id}>
                          <TableCell className="font-mono text-xs max-w-[120px] truncate" title={inst.user_id}>
                            {inst.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium text-sm">{inst.project_name || "—"}</TableCell>
                          <TableCell className="text-sm">{inst.framework || "—"}</TableCell>
                          <TableCell className="text-sm font-mono">{inst.plugin_version || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(inst.last_seen_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {isStale(inst.last_seen_at) ? (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">Stale</Badge>
                            ) : (
                              <Badge variant="default">Active</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Remote Config Tab ── */}
        <TabsContent value="config" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Remote Configuration</CardTitle>
                <Button variant="outline" size="sm" onClick={loadConfigs} disabled={configsLoading}>
                  {configsLoading ? "Loading..." : "Refresh"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Push configuration to all plugin instances. Plugins poll config on startup.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configsLoading
                      ? Array.from({ length: 2 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 4 }).map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      : configs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                              No config entries yet.
                            </TableCell>
                          </TableRow>
                        )
                      : configs.map((cfg) => (
                          <TableRow key={cfg.config_key}>
                            <TableCell className="font-mono text-sm font-medium">{cfg.config_key}</TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate font-mono">
                              {JSON.stringify(cfg.config_value)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{cfg.description || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(cfg.updated_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              <form onSubmit={handleSaveConfig} className="space-y-3">
                <h4 className="text-sm font-medium">Add / Update Config</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="cfg-key">Key</Label>
                    <Input
                      id="cfg-key"
                      placeholder="e.g. feature_flags"
                      value={newConfigKey}
                      onChange={(e) => setNewConfigKey(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cfg-value">Value (JSON or string)</Label>
                    <Input
                      id="cfg-value"
                      placeholder='e.g. {"enabled": true}'
                      value={newConfigValue}
                      onChange={(e) => setNewConfigValue(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cfg-desc">Description</Label>
                    <Input
                      id="cfg-desc"
                      placeholder="Optional description"
                      value={newConfigDesc}
                      onChange={(e) => setNewConfigDesc(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" disabled={configSaving}>
                  {configSaving ? "Saving..." : "Save Config"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Analytics Detail Dialog */}
      <UserAnalyticsDetailDialog
        userId={analyticsUserId}
        userEmail={analyticsUserEmail}
        onClose={() => setAnalyticsUserId(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleteUser?.email}</strong> and all their
              data? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Create a new user account. The user will be auto-activated.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            {addError && (
              <Alert variant="destructive">
                <AlertDescription>{addError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min 6 characters"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={addLoading}>
                {addLoading ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quota Override Dialog */}
      <Dialog open={!!quotaUser} onOpenChange={(open) => !open && setQuotaUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quota Override</DialogTitle>
            <DialogDescription>
              Set custom quota limits for <strong>{quotaUser?.email}</strong>.
              Leave blank to use plan defaults. Use -1 for unlimited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Current Plan</Label>
              <p className="text-sm font-medium capitalize">{quotaUser?.subscription?.plan || "free"}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="quota-articles">Articles per Month</Label>
              <Input
                id="quota-articles"
                type="number"
                min={-1}
                placeholder="Plan default"
                value={quotaArticles}
                onChange={(e) => setQuotaArticles(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">-1 = unlimited</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quota-edits">Edits per Day</Label>
              <Input
                id="quota-edits"
                type="number"
                min={-1}
                placeholder="Plan default"
                value={quotaEdits}
                onChange={(e) => setQuotaEdits(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">-1 = unlimited</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaUser(null)}>Cancel</Button>
            <Button onClick={handleQuotaSave} disabled={quotaSaving}>
              {quotaSaving ? "Saving..." : "Save Override"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
