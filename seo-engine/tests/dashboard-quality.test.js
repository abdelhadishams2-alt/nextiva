/**
 * Tests for Quality Report dashboard page and components.
 * Tests API client methods, component data handling, and page structure.
 *
 * Run: node --test tests/dashboard-quality.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const DASHBOARD_SRC = resolve(
  import.meta.dirname,
  "..",
  "dashboard",
  "src"
);

// ── File existence tests ──

describe("Quality Report: file structure", () => {
  const requiredFiles = [
    "app/(dashboard)/articles/[id]/quality/page.tsx",
    "app/(dashboard)/articles/[id]/layout.tsx",
    "components/quality/score-ring.tsx",
    "components/quality/signal-bars.tsx",
    "components/quality/checklist-panel.tsx",
    "components/quality/eeat-radar.tsx",
    "components/quality/suggestions-list.tsx",
  ];

  for (const file of requiredFiles) {
    it(`${file} exists`, () => {
      const full = resolve(DASHBOARD_SRC, file);
      assert.ok(existsSync(full), `Missing file: ${full}`);
    });
  }
});

// ── API client tests ──

describe("Quality Report: API client methods", () => {
  const apiPath = resolve(DASHBOARD_SRC, "lib", "api.ts");
  const apiSrc = readFileSync(apiPath, "utf-8");

  it("exports fetchQualityReport", () => {
    assert.ok(
      apiSrc.includes("export async function fetchQualityReport"),
      "fetchQualityReport not exported"
    );
  });

  it("exports refreshQualityReport", () => {
    assert.ok(
      apiSrc.includes("export async function refreshQualityReport"),
      "refreshQualityReport not exported"
    );
  });

  it("exports triggerAutoFix", () => {
    assert.ok(
      apiSrc.includes("export async function triggerAutoFix"),
      "triggerAutoFix not exported"
    );
  });

  it("fetchQualityReport calls correct endpoint", () => {
    assert.ok(
      apiSrc.includes("/api/quality/score/"),
      "fetchQualityReport endpoint not found"
    );
  });

  it("refreshQualityReport passes refresh=true", () => {
    assert.ok(
      apiSrc.includes("?refresh=true"),
      "refresh=true query param not found"
    );
  });

  it("triggerAutoFix calls POST", () => {
    assert.ok(
      apiSrc.includes("/api/quality/auto-fix/"),
      "auto-fix endpoint not found"
    );
  });

  it("defines QualityReport interface", () => {
    assert.ok(
      apiSrc.includes("export interface QualityReport"),
      "QualityReport interface not found"
    );
  });

  it("defines QualityCheckItem interface", () => {
    assert.ok(
      apiSrc.includes("export interface QualityCheckItem"),
      "QualityCheckItem interface not found"
    );
  });

  it("defines QualitySignal interface", () => {
    assert.ok(
      apiSrc.includes("export interface QualitySignal"),
      "QualitySignal interface not found"
    );
  });

  it("defines EEATDimension interface", () => {
    assert.ok(
      apiSrc.includes("export interface EEATDimension"),
      "EEATDimension interface not found"
    );
  });

  it("defines QualitySuggestion interface", () => {
    assert.ok(
      apiSrc.includes("export interface QualitySuggestion"),
      "QualitySuggestion interface not found"
    );
  });
});

// ── ScoreRing component tests ──

describe("Quality Report: ScoreRing component", () => {
  const src = readFileSync(
    resolve(DASHBOARD_SRC, "components/quality/score-ring.tsx"),
    "utf-8"
  );

  it("renders SVG circle", () => {
    assert.ok(src.includes("<circle"), "No SVG circle element found");
  });

  it("has color coding for green (80-100)", () => {
    assert.ok(
      src.includes("score >= 80") || src.includes("score>=80"),
      "No green threshold at 80"
    );
  });

  it("has color coding for yellow (60-79)", () => {
    assert.ok(
      src.includes("score >= 60") || src.includes("score>=60"),
      "No yellow threshold at 60"
    );
  });

  it("has color coding for orange (40-59)", () => {
    assert.ok(
      src.includes("score >= 40") || src.includes("score>=40"),
      "No orange threshold at 40"
    );
  });

  it("has color coding for red (0-39)", () => {
    assert.ok(
      src.includes("text-red-500") || src.includes("stroke-red-500"),
      "No red color fallback"
    );
  });

  it("displays letter grade", () => {
    assert.ok(src.includes("letterGrade"), "letterGrade prop not used");
  });

  it("has animated transition", () => {
    assert.ok(src.includes("transition"), "No CSS transition found");
  });

  it("supports responsive size prop", () => {
    assert.ok(
      src.includes("size") && src.includes("160"),
      "Size prop not found"
    );
  });

  it("has aria-label for accessibility", () => {
    assert.ok(src.includes("aria-label"), "Missing aria-label");
  });

  it("exports skeleton component", () => {
    assert.ok(
      src.includes("ScoreRingSkeleton"),
      "ScoreRingSkeleton not exported"
    );
  });
});

// ── SignalBars component tests ──

describe("Quality Report: SignalBars component", () => {
  const src = readFileSync(
    resolve(DASHBOARD_SRC, "components/quality/signal-bars.tsx"),
    "utf-8"
  );

  it("sorts signals by weight", () => {
    assert.ok(
      src.includes("sort") && src.includes("weight"),
      "No weight-based sorting"
    );
  });

  it("uses green for scores >= 7", () => {
    assert.ok(
      src.includes("score >= 7") || src.includes("score>=7"),
      "No green threshold at 7"
    );
  });

  it("uses yellow for scores >= 5", () => {
    assert.ok(
      src.includes("score >= 5") || src.includes("score>=5"),
      "No yellow threshold at 5"
    );
  });

  it("uses red for scores < 5", () => {
    assert.ok(src.includes("bg-red-500"), "No red color for low scores");
  });

  it("includes tooltips", () => {
    assert.ok(
      src.includes("Tooltip") && src.includes("TooltipContent"),
      "No tooltip components"
    );
  });

  it("exports skeleton component", () => {
    assert.ok(
      src.includes("SignalBarsSkeleton"),
      "SignalBarsSkeleton not exported"
    );
  });
});

// ── ChecklistPanel component tests ──

describe("Quality Report: ChecklistPanel component", () => {
  const src = readFileSync(
    resolve(DASHBOARD_SRC, "components/quality/checklist-panel.tsx"),
    "utf-8"
  );

  it("has 3 tabs: Checklist, E-E-A-T, Suggestions", () => {
    assert.ok(src.includes("Checklist"), "Checklist tab missing");
    assert.ok(src.includes("E-E-A-T"), "E-E-A-T tab missing");
    assert.ok(src.includes("Suggestions"), "Suggestions tab missing");
  });

  it("has filter options: All, Failed, Warnings, Passed", () => {
    assert.ok(src.includes('"all"'), "All filter missing");
    assert.ok(src.includes('"fail"'), "Fail filter missing");
    assert.ok(src.includes('"warning"'), "Warning filter missing");
    assert.ok(src.includes('"pass"'), "Pass filter missing");
  });

  it("groups items by category", () => {
    assert.ok(
      src.includes("categories") && src.includes("item.category"),
      "Category grouping not found"
    );
  });

  it("has collapsible categories", () => {
    assert.ok(
      src.includes("expandedCategories") && src.includes("toggleCategory"),
      "Collapsible logic not found"
    );
  });

  it("shows pass/fail/warning badges", () => {
    assert.ok(
      src.includes("pass") && src.includes("fail") && src.includes("warning"),
      "Status badges not found"
    );
  });

  it("exports skeleton component", () => {
    assert.ok(
      src.includes("ChecklistPanelSkeleton"),
      "ChecklistPanelSkeleton not exported"
    );
  });
});

// ── EEATRadar component tests ──

describe("Quality Report: EEATRadar component", () => {
  const src = readFileSync(
    resolve(DASHBOARD_SRC, "components/quality/eeat-radar.tsx"),
    "utf-8"
  );

  it("renders SVG polygon for data", () => {
    assert.ok(src.includes("<polygon"), "No SVG polygon found");
  });

  it("renders grid rings", () => {
    assert.ok(src.includes("rings"), "No radar grid rings");
  });

  it("renders axis lines", () => {
    assert.ok(src.includes("axes") || src.includes("<line"), "No axis lines");
  });

  it("shows dimension scores and grades", () => {
    assert.ok(
      src.includes("d.score") && src.includes("d.grade"),
      "Score/grade display missing"
    );
  });

  it("has grade coloring function", () => {
    assert.ok(src.includes("getGradeColor"), "No grade color function");
  });

  it("has aria-label for accessibility", () => {
    assert.ok(src.includes("aria-label"), "Missing aria-label");
  });

  it("exports skeleton component", () => {
    assert.ok(
      src.includes("EEATRadarSkeleton"),
      "EEATRadarSkeleton not exported"
    );
  });
});

// ── SuggestionsList component tests ──

describe("Quality Report: SuggestionsList component", () => {
  const src = readFileSync(
    resolve(DASHBOARD_SRC, "components/quality/suggestions-list.tsx"),
    "utf-8"
  );

  it("limits to 15 suggestions", () => {
    assert.ok(src.includes("slice(0, 15)"), "15-item limit not found");
  });

  it("shows priority badges", () => {
    assert.ok(
      src.includes("high") && src.includes("medium") && src.includes("low"),
      "Priority levels missing"
    );
  });

  it("shows auto-fixable badge", () => {
    assert.ok(
      src.includes("auto_fixable") || src.includes("Auto-fixable"),
      "Auto-fixable indicator missing"
    );
  });

  it("handles empty state", () => {
    assert.ok(
      src.includes("suggestions.length === 0"),
      "Empty state not handled"
    );
  });

  it("exports skeleton component", () => {
    assert.ok(
      src.includes("SuggestionsListSkeleton"),
      "SuggestionsListSkeleton not exported"
    );
  });
});

// ── Quality page tests ──

describe("Quality Report: main page", () => {
  const src = readFileSync(
    resolve(
      DASHBOARD_SRC,
      "app/(dashboard)/articles/[id]/quality/page.tsx"
    ),
    "utf-8"
  );

  it("uses ScoreRing component", () => {
    assert.ok(src.includes("ScoreRing"), "ScoreRing not used");
  });

  it("uses SignalBars component", () => {
    assert.ok(src.includes("SignalBars"), "SignalBars not used");
  });

  it("uses ChecklistPanel component", () => {
    assert.ok(src.includes("ChecklistPanel"), "ChecklistPanel not used");
  });

  it("has Re-score button", () => {
    assert.ok(
      src.includes("Re-score") || src.includes("Score Now"),
      "Re-score button missing"
    );
  });

  it("has Auto-fix button", () => {
    assert.ok(src.includes("Auto-fix"), "Auto-fix button missing");
  });

  it("calls refreshQualityReport for re-score", () => {
    assert.ok(
      src.includes("refreshQualityReport"),
      "refreshQualityReport not called"
    );
  });

  it("calls triggerAutoFix for auto-fix", () => {
    assert.ok(
      src.includes("triggerAutoFix"),
      "triggerAutoFix not called"
    );
  });

  it("has loading state with skeletons", () => {
    assert.ok(
      src.includes("ScoreRingSkeleton") || src.includes("animate-pulse"),
      "Loading skeleton missing"
    );
  });

  it("has error state for missing articles", () => {
    assert.ok(
      src.includes("not found") || src.includes("Article not found"),
      "Error state missing"
    );
  });

  it("is a client component", () => {
    assert.ok(src.includes('"use client"'), 'Missing "use client" directive');
  });
});

// ── Layout / navigation tests ──

describe("Quality Report: article layout with Quality tab", () => {
  const src = readFileSync(
    resolve(
      DASHBOARD_SRC,
      "app/(dashboard)/articles/[id]/layout.tsx"
    ),
    "utf-8"
  );

  it("includes Quality tab", () => {
    assert.ok(src.includes("Quality"), "Quality tab label missing");
  });

  it("links to /quality path", () => {
    assert.ok(src.includes("/quality"), "Quality href missing");
  });

  it("has Overview tab", () => {
    assert.ok(src.includes("Overview"), "Overview tab missing");
  });

  it("highlights active tab", () => {
    assert.ok(src.includes("isActive"), "Active tab logic missing");
  });

  it("uses Link component for navigation", () => {
    assert.ok(src.includes("Link"), "Link component not used");
  });
});

// ── RTL support tests ──

describe("Quality Report: RTL support", () => {
  it("ChecklistPanel chevron handles RTL", () => {
    const src = readFileSync(
      resolve(DASHBOARD_SRC, "components/quality/checklist-panel.tsx"),
      "utf-8"
    );
    assert.ok(
      src.includes("rtl"),
      "No RTL consideration in checklist panel"
    );
  });

  it("SignalBars uses logical properties via Tailwind", () => {
    const src = readFileSync(
      resolve(DASHBOARD_SRC, "components/quality/signal-bars.tsx"),
      "utf-8"
    );
    // Tailwind gap/space utilities are direction-agnostic
    assert.ok(
      src.includes("space-y") || src.includes("gap-"),
      "No directional spacing found"
    );
  });

  it("Quality page uses flex-wrap for responsive RTL layout", () => {
    const src = readFileSync(
      resolve(
        DASHBOARD_SRC,
        "app/(dashboard)/articles/[id]/quality/page.tsx"
      ),
      "utf-8"
    );
    assert.ok(src.includes("flex-wrap"), "No flex-wrap for RTL responsiveness");
  });
});

// ── Responsive design tests ──

describe("Quality Report: responsive design", () => {
  it("Quality page uses responsive grid", () => {
    const src = readFileSync(
      resolve(
        DASHBOARD_SRC,
        "app/(dashboard)/articles/[id]/quality/page.tsx"
      ),
      "utf-8"
    );
    assert.ok(
      src.includes("lg:grid-cols"),
      "No responsive grid breakpoints"
    );
  });

  it("EEATRadar has responsive grid for dimensions", () => {
    const src = readFileSync(
      resolve(DASHBOARD_SRC, "components/quality/eeat-radar.tsx"),
      "utf-8"
    );
    assert.ok(
      src.includes("sm:grid-cols"),
      "No responsive grid in radar list"
    );
  });

  it("ChecklistPanel filter uses flex-wrap", () => {
    const src = readFileSync(
      resolve(DASHBOARD_SRC, "components/quality/checklist-panel.tsx"),
      "utf-8"
    );
    assert.ok(
      src.includes("flex-wrap"),
      "Filter buttons not wrapped for mobile"
    );
  });
});
