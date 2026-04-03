"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiFetch, generateArticle, fetchSettings, updateSettings } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TOTAL_STEPS = 4;
const STORAGE_KEY = "chainiq_onboarding_step";
const ONBOARDING_COMPLETE_KEY = "onboarding_complete";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
];

const FRAMEWORKS = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "html", label: "HTML (Standalone)" },
];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ConnectionCheck {
  label: string;
  status: "idle" | "checking" | "success" | "error";
  message: string;
}

/* ------------------------------------------------------------------ */
/*  Stepper Component                                                  */
/* ------------------------------------------------------------------ */

function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isComplete = step < current;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                isComplete
                  ? "bg-emerald-600 text-white"
                  : isActive
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-300 dark:text-zinc-900"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {isComplete ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                step
              )}
            </div>
            {step < total && (
              <div
                className={`h-0.5 w-8 transition-colors ${
                  isComplete ? "bg-emerald-600" : "bg-zinc-700"
                }`}
              />
            )}
          </div>
        );
      })}
      <span className="ml-3 text-sm text-zinc-400">
        Step {current} of {total}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Check Icon                                                         */
/* ------------------------------------------------------------------ */

function StatusIcon({ status }: { status: ConnectionCheck["status"] }) {
  if (status === "idle") {
    return (
      <div className="h-5 w-5 rounded-full border-2 border-zinc-600" />
    );
  }
  if (status === "checking") {
    return (
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
    );
  }
  if (status === "success") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600">
        <svg
          className="h-3 w-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    );
  }
  // error
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600">
      <svg
        className="h-3 w-3 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1: Connection Verification                                    */
/* ------------------------------------------------------------------ */

function StepConnection({ onNext }: { onNext: () => void }) {
  const [checks, setChecks] = useState<ConnectionCheck[]>([
    { label: "Supabase URL", status: "idle", message: "" },
    { label: "Supabase Auth (Anon Key)", status: "idle", message: "" },
    { label: "Bridge Server", status: "idle", message: "" },
  ]);
  const [running, setRunning] = useState(false);

  const updateCheck = useCallback(
    (index: number, update: Partial<ConnectionCheck>) => {
      setChecks((prev) =>
        prev.map((c, i) => (i === index ? { ...c, ...update } : c))
      );
    },
    []
  );

  async function runChecks() {
    setRunning(true);

    // Reset all
    setChecks((prev) =>
      prev.map((c) => ({ ...c, status: "checking", message: "Checking..." }))
    );

    // Check 1: Supabase URL — hit the auth verify endpoint
    try {
      await apiFetch("/auth/verify");
      updateCheck(0, { status: "success", message: "Connected" });
      updateCheck(1, { status: "success", message: "Authenticated" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      // If we get Unauthorized, the connection itself works but token is bad
      if (msg === "Unauthorized") {
        updateCheck(0, { status: "success", message: "Reachable" });
        updateCheck(1, {
          status: "error",
          message: "Auth token invalid — re-login may be needed",
        });
      } else {
        updateCheck(0, { status: "error", message: msg });
        updateCheck(1, { status: "error", message: "Skipped — URL unreachable" });
      }
    }

    // Check 2: Bridge server health
    try {
      await apiFetch<{ status: string }>("/health");
      updateCheck(2, { status: "success", message: "Healthy" });
    } catch (err) {
      updateCheck(2, {
        status: "error",
        message: err instanceof Error ? err.message : "Unreachable",
      });
    }

    setRunning(false);
  }

  const allPassed = checks.every((c) => c.status === "success");

  return (
    <Card className="w-full max-w-lg border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-xl">Connection Verification</CardTitle>
        <CardDescription>
          Verify that your Supabase and Bridge server connections are working.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {checks.map((check, i) => (
            <div key={i} className="flex items-center gap-3">
              <StatusIcon status={check.status} />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-200">
                  {check.label}
                </p>
                {check.message && (
                  <p
                    className={`text-xs ${
                      check.status === "error"
                        ? "text-red-400"
                        : check.status === "success"
                        ? "text-emerald-400"
                        : "text-zinc-500"
                    }`}
                  >
                    {check.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator className="bg-zinc-800" />

        <div className="flex gap-3">
          <Button
            onClick={runChecks}
            disabled={running}
            variant="outline"
            className="flex-1"
          >
            {running ? "Checking..." : "Run Checks"}
          </Button>
          <Button onClick={onNext} disabled={!allPassed} className="flex-1">
            Next
          </Button>
        </div>

        {!allPassed && checks.some((c) => c.status === "error") && (
          <Alert variant="destructive">
            <AlertDescription>
              Some checks failed. Please fix the issues and re-run the checks.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2: Configure Defaults                                         */
/* ------------------------------------------------------------------ */

function StepDefaults({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [language, setLanguage] = useState("en");
  const [framework, setFramework] = useState("html");
  const [imageGen, setImageGen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load existing settings if available
  useEffect(() => {
    fetchSettings()
      .then((res) => {
        if (res.data) {
          setLanguage(res.data.preferred_language || "en");
          setFramework(res.data.preferred_framework || "html");
        }
      })
      .catch(() => {
        // Ignore — use defaults
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await updateSettings({
        preferred_language: language,
        preferred_framework: framework,
        max_images: imageGen ? 6 : 0,
      });
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="w-full max-w-lg border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-xl">Configure Defaults</CardTitle>
        <CardDescription>
          Set your preferred defaults for article generation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="language">Default Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="framework">Default Framework</Label>
          <Select value={framework} onValueChange={setFramework}>
            <SelectTrigger id="framework">
              <SelectValue placeholder="Select framework" />
            </SelectTrigger>
            <SelectContent>
              {FRAMEWORKS.map((fw) => (
                <SelectItem key={fw.value} value={fw.value}>
                  {fw.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Image Generation</Label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant={imageGen ? "default" : "outline"}
              size="sm"
              onClick={() => setImageGen(true)}
            >
              On
            </Button>
            <Button
              type="button"
              variant={!imageGen ? "default" : "outline"}
              size="sm"
              onClick={() => setImageGen(false)}
            >
              Off
            </Button>
            <span className="text-xs text-zinc-400">
              {imageGen
                ? "Articles will include AI-generated images"
                : "Articles will be text-only"}
            </span>
          </div>
        </div>

        <Separator className="bg-zinc-800" />

        <div className="flex gap-3">
          <Button onClick={onBack} variant="outline" className="flex-1">
            Back
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3: Test Generation (Optional / Skippable)                     */
/* ------------------------------------------------------------------ */

function StepTestGeneration({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [topic, setTopic] = useState("Benefits of AI in content marketing");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setResult(null);
    try {
      const res = await generateArticle({ topic });
      setResult({
        success: true,
        message: `Test article queued successfully (Job ID: ${res.data.job_id}). You can monitor progress from the Dashboard.`,
      });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Generation failed",
      });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card className="w-full max-w-lg border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-xl">Test Generation</CardTitle>
        <CardDescription>
          Optionally generate a test article to verify your pipeline is working.
          You can skip this step.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="topic">Sample Topic</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic for test generation"
          />
        </div>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        <Separator className="bg-zinc-800" />

        <div className="flex gap-3">
          <Button onClick={onBack} variant="outline" className="flex-1">
            Back
          </Button>
          <Button
            onClick={onNext}
            variant="outline"
            className="flex-1"
          >
            Skip
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="flex-1"
          >
            {generating ? "Generating..." : "Generate"}
          </Button>
        </div>

        {result?.success && (
          <Button onClick={onNext} className="w-full">
            Continue
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4: Completion                                                 */
/* ------------------------------------------------------------------ */

function StepCompletion() {
  const router = useRouter();

  const links = [
    { label: "Dashboard", href: "/", description: "Overview and analytics" },
    {
      label: "Articles",
      href: "/articles",
      description: "Manage generated articles",
    },
    {
      label: "Settings",
      href: "/settings",
      description: "Configure preferences",
    },
    {
      label: "Admin",
      href: "/admin",
      description: "User management",
    },
  ];

  function handleNavigate(href: string) {
    router.push(href);
  }

  return (
    <Card className="w-full max-w-lg border-zinc-800 bg-zinc-900">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/20">
          <svg
            className="h-8 w-8 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <CardTitle className="text-2xl">Setup Complete</CardTitle>
        <CardDescription>
          ChainIQ is configured and ready to use. Start generating
          high-quality SEO content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {links.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavigate(link.href)}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/50 p-3 text-left transition-colors hover:bg-zinc-800"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-200">
                  {link.label}
                </p>
                <p className="text-xs text-zinc-500">{link.description}</p>
              </div>
              <svg
                className="h-4 w-4 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Onboarding Page                                               */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loaded, setLoaded] = useState(false);

  // Restore progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 1 && parsed <= TOTAL_STEPS) {
          setStep(parsed);
        }
      }
    } catch {
      // localStorage unavailable — start from step 1
    }
    setLoaded(true);
  }, []);

  // Persist step to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(step));
    } catch {
      // Ignore
    }
  }, [step, loaded]);

  function goNext() {
    const next = Math.min(step + 1, TOTAL_STEPS);
    if (next === TOTAL_STEPS) {
      // Mark onboarding as complete
      try {
        localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    setStep(next);
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  // Don't render until we've checked localStorage (prevents flash)
  if (!loaded) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          ChainIQ
        </h1>
        <p className="text-sm text-zinc-500">First-time setup</p>
      </div>

      <Stepper current={step} total={TOTAL_STEPS} />

      {step === 1 && <StepConnection onNext={goNext} />}
      {step === 2 && <StepDefaults onNext={goNext} onBack={goBack} />}
      {step === 3 && (
        <StepTestGeneration onNext={goNext} onBack={goBack} />
      )}
      {step === 4 && <StepCompletion />}
    </div>
  );
}
