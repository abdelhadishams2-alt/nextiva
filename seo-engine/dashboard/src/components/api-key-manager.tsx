"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminListApiKeys,
  adminAddApiKey,
  adminRotateApiKey,
  adminRevokeApiKey,
  adminTestApiKey,
  type ApiKey,
} from "@/lib/api";

/**
 * ApiKeyManager — CRUD UI for managing encrypted API keys.
 * Shows a list of keys with masked values, plus Add / Rotate / Test / Revoke actions.
 */
export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Add key dialog
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyScope, setNewKeyScope] = useState("generation");

  // Rotate dialog
  const [rotateKey, setRotateKey] = useState<ApiKey | null>(null);
  const [rotateValue, setRotateValue] = useState("");

  // Test results
  const [keyTesting, setKeyTesting] = useState<string | null>(null);
  const [keyTestResult, setKeyTestResult] = useState<
    Record<string, { valid: boolean; message: string }>
  >({});

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminListApiKeys();
      if (res?.data) setKeys(res.data);
    } catch {
      // Bridge may not be running
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  async function handleAddKey() {
    if (!newKeyName || !newKeyValue) return;
    try {
      await adminAddApiKey({
        key_name: newKeyName,
        key_value: newKeyValue,
        scope: newKeyScope,
      });
      setShowAddKey(false);
      setNewKeyName("");
      setNewKeyValue("");
      setNewKeyScope("generation");
      loadKeys();
    } catch {
      // Error handled by apiFetch
    }
  }

  async function handleRotate() {
    if (!rotateKey || !rotateValue) return;
    try {
      await adminRotateApiKey(rotateKey.id, rotateValue);
      setRotateKey(null);
      setRotateValue("");
      loadKeys();
    } catch {
      // Error handled by apiFetch
    }
  }

  async function handleRevoke(id: string) {
    try {
      await adminRevokeApiKey(id);
      loadKeys();
    } catch {
      // Error handled by apiFetch
    }
  }

  async function handleTestKey(id: string) {
    setKeyTesting(id);
    try {
      const res = await adminTestApiKey(id);
      setKeyTestResult((prev) => ({
        ...prev,
        [id]: { valid: res.valid, message: res.message },
      }));
    } catch {
      setKeyTestResult((prev) => ({
        ...prev,
        [id]: { valid: false, message: "Test failed" },
      }));
    } finally {
      setKeyTesting(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground text-center">
              Loading API keys...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Managed API Keys</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddKey(true)}
          >
            Add Key
          </Button>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No API keys configured. Keys are encrypted at rest with
              AES-256-GCM.
            </p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-3 gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {key.key_name}
                      </span>
                      <Badge
                        variant={key.is_active ? "default" : "secondary"}
                      >
                        {key.is_active ? "Active" : "Revoked"}
                      </Badge>
                      <Badge variant="outline">{key.scope}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {key.key_hint}
                    </p>
                    {keyTestResult[key.id] && (
                      <p
                        className={`text-xs ${
                          keyTestResult[key.id].valid
                            ? "text-green-500"
                            : "text-destructive"
                        }`}
                      >
                        {keyTestResult[key.id].message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!key.is_active || keyTesting === key.id}
                      onClick={() => handleTestKey(key.id)}
                    >
                      {keyTesting === key.id ? "Testing..." : "Test"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!key.is_active}
                      onClick={() => {
                        setRotateKey(key);
                        setRotateValue("");
                      }}
                    >
                      Rotate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={!key.is_active}
                      onClick={() => handleRevoke(key.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Infrastructure keys info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Infrastructure Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Supabase</p>
              <p className="text-xs text-muted-foreground">
                Configured via environment variables
              </p>
            </div>
            <Badge>Connected</Badge>
          </div>
          <Separator />
          <Alert>
            <AlertDescription>
              Infrastructure keys (Supabase, Bridge) are managed via
              environment variables. Managed API keys above are for LLM
              providers (Gemini, custom models) and are encrypted at rest.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Add Key Dialog */}
      <Dialog open={showAddKey} onOpenChange={setShowAddKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Key Name</Label>
              <Input
                placeholder="e.g., gemini_api_key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Key Value</Label>
              <Input
                type="password"
                placeholder="Paste your API key"
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select
                value={newKeyScope}
                onValueChange={(v) => v && setNewKeyScope(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generation">Generation</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddKey(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddKey}
              disabled={!newKeyName || !newKeyValue}
            >
              Add Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rotate Key Dialog */}
      <Dialog open={!!rotateKey} onOpenChange={() => setRotateKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate Key: {rotateKey?.key_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Current hint: {rotateKey?.key_hint}
            </p>
            <div className="space-y-2">
              <Label>New Key Value</Label>
              <Input
                type="password"
                placeholder="Paste new API key"
                value={rotateValue}
                onChange={(e) => setRotateValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRotateKey(null)}>
              Cancel
            </Button>
            <Button onClick={handleRotate} disabled={!rotateValue}>
              Rotate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
