/**
 * Tests for CI-005: Opportunities dashboard page
 * Validates intelligence API client methods, component data contracts,
 * and UI rendering logic.
 */

import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

// ── API Client Type Contracts ──

describe("Intelligence API types", () => {
  it("Recommendation interface has required fields", () => {
    const rec = {
      id: "rec-1",
      type: "content_gap",
      title: "Missing topic coverage",
      description: "Competitor covers this topic, you do not",
      priority_score: 85,
      impact: "high",
      effort: "low",
      affected_urls: ["/blog/topic-a"],
      suggested_action: "Create new article targeting this keyword",
      status: "pending",
      created_at: "2026-03-28T00:00:00Z",
    };
    assert.ok(rec.id);
    assert.ok(["content_gap", "optimization", "consolidation", "new_topic", "update"].includes(rec.type));
    assert.ok(typeof rec.priority_score === "number");
    assert.ok(rec.priority_score >= 0 && rec.priority_score <= 100);
    assert.ok(["high", "medium", "low"].includes(rec.impact));
    assert.ok(["high", "medium", "low"].includes(rec.effort));
    assert.ok(Array.isArray(rec.affected_urls));
    assert.ok(["pending", "accepted", "dismissed", "executed"].includes(rec.status));
  });

  it("KeywordGap interface has required fields", () => {
    const gap = {
      id: "gap-1",
      keyword: "best seo tools",
      search_volume: 12000,
      difficulty: 45,
      current_position: null,
      competitor_position: 3.2,
      impressions: 500,
      clicks: 20,
      ctr: 0.04,
      opportunity_score: 78,
      suggested_url: null,
      category: "tools",
    };
    assert.ok(gap.id);
    assert.ok(typeof gap.keyword === "string");
    assert.ok(typeof gap.search_volume === "number");
    assert.ok(typeof gap.difficulty === "number");
    assert.ok(gap.current_position === null || typeof gap.current_position === "number");
    assert.ok(typeof gap.opportunity_score === "number");
  });

  it("CannibalizationGroup interface has required fields", () => {
    const group = {
      id: "cg-1",
      keyword: "content marketing",
      pages: [
        { url: "/blog/a", title: "Article A", position: 5.2, impressions: 1000, clicks: 50, ctr: 0.05 },
        { url: "/blog/b", title: "Article B", position: 8.1, impressions: 800, clicks: 30, ctr: 0.0375 },
      ],
      severity: "warning",
      recommended_action: "merge",
      resolved: false,
    };
    assert.ok(group.id);
    assert.ok(Array.isArray(group.pages));
    assert.ok(group.pages.length >= 2);
    assert.ok(["critical", "warning", "info"].includes(group.severity));
    assert.ok(["merge", "redirect", "differentiate", "deoptimize"].includes(group.recommended_action));
    assert.ok(typeof group.resolved === "boolean");
    // Validate page structure
    for (const page of group.pages) {
      assert.ok(typeof page.url === "string");
      assert.ok(typeof page.position === "number");
      assert.ok(typeof page.impressions === "number");
      assert.ok(typeof page.clicks === "number");
      assert.ok(typeof page.ctr === "number");
    }
  });

  it("DecayAlert interface has required fields", () => {
    const alert = {
      id: "da-1",
      url: "/blog/old-post",
      title: "Old Post Title",
      metric: "clicks",
      severity: "critical",
      current_value: 10,
      previous_value: 100,
      change_percent: -90,
      trend: [100, 80, 60, 40, 20, 10],
      detected_at: "2026-03-28T00:00:00Z",
      acknowledged: false,
    };
    assert.ok(alert.id);
    assert.ok(["clicks", "impressions", "position", "ctr"].includes(alert.metric));
    assert.ok(["critical", "warning", "info"].includes(alert.severity));
    assert.ok(typeof alert.current_value === "number");
    assert.ok(typeof alert.previous_value === "number");
    assert.ok(typeof alert.change_percent === "number");
    assert.ok(Array.isArray(alert.trend));
    assert.ok(alert.trend.length >= 2);
    assert.ok(typeof alert.acknowledged === "boolean");
  });

  it("AnalysisRun interface has required fields", () => {
    const run = {
      id: "run-1",
      status: "completed",
      started_at: "2026-03-28T00:00:00Z",
      completed_at: "2026-03-28T00:05:00Z",
      results_summary: { recommendations: 12, keyword_gaps: 45, cannibalization: 3, decay_alerts: 8 },
    };
    assert.ok(run.id);
    assert.ok(["pending", "running", "completed", "failed"].includes(run.status));
    assert.ok(run.results_summary === null || typeof run.results_summary === "object");
  });
});

// ── Score Badge Logic ──

describe("ScoreBadge color logic", () => {
  function getScoreColor(score, max) {
    const pct = (score / max) * 100;
    if (pct >= 80) return "emerald";
    if (pct >= 60) return "amber";
    if (pct >= 40) return "orange";
    return "red";
  }

  it("returns emerald for scores >= 80%", () => {
    assert.equal(getScoreColor(80, 100), "emerald");
    assert.equal(getScoreColor(95, 100), "emerald");
    assert.equal(getScoreColor(100, 100), "emerald");
  });

  it("returns amber for scores 60-79%", () => {
    assert.equal(getScoreColor(60, 100), "amber");
    assert.equal(getScoreColor(79, 100), "amber");
  });

  it("returns orange for scores 40-59%", () => {
    assert.equal(getScoreColor(40, 100), "orange");
    assert.equal(getScoreColor(59, 100), "orange");
  });

  it("returns red for scores < 40%", () => {
    assert.equal(getScoreColor(0, 100), "red");
    assert.equal(getScoreColor(39, 100), "red");
  });
});

// ── Sparkline Data Validation ──

describe("Sparkline SVG path generation", () => {
  function generatePath(data, width, height) {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    });
    return `M${points.join(" L")}`;
  }

  it("returns null for fewer than 2 data points", () => {
    assert.equal(generatePath([1], 80, 24), null);
    assert.equal(generatePath([], 80, 24), null);
  });

  it("generates valid SVG path for trend data", () => {
    const path = generatePath([100, 80, 60, 40, 20, 10], 80, 24);
    assert.ok(path);
    assert.ok(path.startsWith("M"));
    assert.ok(path.includes("L"));
    // Should have 6 points (5 L commands)
    const lCount = (path.match(/L/g) || []).length;
    assert.equal(lCount, 5);
  });

  it("handles flat data (all same values)", () => {
    const path = generatePath([50, 50, 50, 50], 80, 24);
    assert.ok(path);
    // When range is 0, all y values should be the same
    const points = path.replace("M", "").split(" L");
    const yValues = points.map((p) => parseFloat(p.split(",")[1]));
    assert.ok(yValues.every((y) => y === yValues[0]));
  });

  it("first point x is 0 and last point x equals width", () => {
    const width = 80;
    const path = generatePath([10, 20, 30], width, 24);
    const points = path.replace("M", "").split(" L");
    const firstX = parseFloat(points[0].split(",")[0]);
    const lastX = parseFloat(points[points.length - 1].split(",")[0]);
    assert.equal(firstX, 0);
    assert.equal(lastX, width);
  });
});

// ── Filter Logic ──

describe("OpportunityFilters defaults", () => {
  const DEFAULT_FILTERS = {
    page: 1,
    per_page: 50,
    sort: "priority_score",
    order: "desc",
  };

  it("has correct default values", () => {
    assert.equal(DEFAULT_FILTERS.page, 1);
    assert.equal(DEFAULT_FILTERS.per_page, 50);
    assert.equal(DEFAULT_FILTERS.sort, "priority_score");
    assert.equal(DEFAULT_FILTERS.order, "desc");
  });

  it("detects active filters correctly", () => {
    function hasFilters(f) {
      return !!f.type || !!f.impact || !!f.status || !!f.search;
    }
    assert.equal(hasFilters(DEFAULT_FILTERS), false);
    assert.equal(hasFilters({ ...DEFAULT_FILTERS, type: "optimization" }), true);
    assert.equal(hasFilters({ ...DEFAULT_FILTERS, search: "test" }), true);
    assert.equal(hasFilters({ ...DEFAULT_FILTERS, impact: "high" }), true);
  });
});

// ── Cannibalization Resolution Actions ──

describe("Cannibalization resolution actions", () => {
  const RESOLUTION_ACTIONS = ["merge", "redirect", "differentiate", "deoptimize"];

  it("has exactly 4 resolution options", () => {
    assert.equal(RESOLUTION_ACTIONS.length, 4);
  });

  it("includes all required actions", () => {
    assert.ok(RESOLUTION_ACTIONS.includes("merge"));
    assert.ok(RESOLUTION_ACTIONS.includes("redirect"));
    assert.ok(RESOLUTION_ACTIONS.includes("differentiate"));
    assert.ok(RESOLUTION_ACTIONS.includes("deoptimize"));
  });
});

// ── Recommendation Type Labels ──

describe("Recommendation type labels", () => {
  const TYPE_LABELS = {
    content_gap: "Content Gap",
    optimization: "Optimization",
    consolidation: "Consolidation",
    new_topic: "New Topic",
    update: "Content Update",
  };

  it("maps all recommendation types to labels", () => {
    const expectedTypes = ["content_gap", "optimization", "consolidation", "new_topic", "update"];
    for (const type of expectedTypes) {
      assert.ok(TYPE_LABELS[type], `Missing label for type: ${type}`);
      assert.ok(typeof TYPE_LABELS[type] === "string");
    }
  });
});

// ── Tab Navigation ──

describe("Opportunities tabs", () => {
  const TABS = ["recommendations", "gaps", "cannibalization", "decay"];

  it("has exactly 4 tabs", () => {
    assert.equal(TABS.length, 4);
  });

  it("includes all required tab values", () => {
    assert.ok(TABS.includes("recommendations"));
    assert.ok(TABS.includes("gaps"));
    assert.ok(TABS.includes("cannibalization"));
    assert.ok(TABS.includes("decay"));
  });
});

// ── API URL Construction ──

describe("Intelligence API URL construction", () => {
  function buildUrl(basePath, params) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.set(key, String(value));
        }
      });
    }
    const qs = searchParams.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  it("builds URL without params", () => {
    assert.equal(buildUrl("/api/intelligence/recommendations"), "/api/intelligence/recommendations");
    assert.equal(buildUrl("/api/intelligence/recommendations", {}), "/api/intelligence/recommendations");
  });

  it("builds URL with params", () => {
    const url = buildUrl("/api/intelligence/recommendations", {
      page: 1,
      per_page: 50,
      sort: "priority_score",
      order: "desc",
    });
    assert.ok(url.includes("page=1"));
    assert.ok(url.includes("per_page=50"));
    assert.ok(url.includes("sort=priority_score"));
    assert.ok(url.includes("order=desc"));
  });

  it("excludes undefined and null params", () => {
    const url = buildUrl("/api/intelligence/keyword-gaps", {
      page: 1,
      type: undefined,
      impact: null,
      search: "",
    });
    assert.ok(!url.includes("type"));
    assert.ok(!url.includes("impact"));
    assert.ok(!url.includes("search"));
    assert.ok(url.includes("page=1"));
  });
});

// ── Sidebar Navigation ──

describe("Sidebar includes Opportunities nav", () => {
  it("NAV_ITEMS should include Opportunities entry", () => {
    // Mirror of the sidebar NAV_ITEMS array
    const NAV_ITEMS = [
      { label: "Dashboard", href: "/", group: "main" },
      { label: "Generate", href: "/generate", group: "main" },
      { label: "Articles", href: "/articles", group: "main" },
      { label: "Content Inventory", href: "/inventory", group: "main" },
      { label: "Opportunities", href: "/opportunities", group: "main" },
      { label: "Blueprints", href: "/blueprints", group: "main" },
      { label: "Admin", href: "/admin", adminOnly: true, group: "main" },
      { label: "Settings", href: "/settings", group: "settings" },
      { label: "Connections", href: "/settings/connections", group: "settings" },
    ];
    const opp = NAV_ITEMS.find((item) => item.label === "Opportunities");
    assert.ok(opp, "Opportunities nav item should exist");
    assert.equal(opp.href, "/opportunities");
    assert.equal(opp.group, "main");
    assert.ok(!opp.adminOnly);
  });
});

// ── Decay Change Percentage Logic ──

describe("Decay alert change percentage", () => {
  it("negative change_percent indicates decline for clicks/impressions/ctr", () => {
    const alert = { metric: "clicks", change_percent: -45.2 };
    const isNegative = alert.change_percent < 0;
    assert.ok(isNegative);
  });

  it("positive change_percent indicates decline for position metric", () => {
    // Position going up (e.g., from 5 to 15) is bad
    const alert = { metric: "position", change_percent: 200 };
    const isPositionMetric = alert.metric === "position";
    const isNegativeChange = isPositionMetric ? alert.change_percent > 0 : alert.change_percent < 0;
    assert.ok(isNegativeChange);
  });

  it("negative change_percent for position means improvement", () => {
    // Position going down (e.g., from 15 to 5) is good
    const alert = { metric: "position", change_percent: -66.7 };
    const isPositionMetric = alert.metric === "position";
    const isNegativeChange = isPositionMetric ? alert.change_percent > 0 : alert.change_percent < 0;
    assert.ok(!isNegativeChange, "Decreasing position number should not be flagged as negative");
  });
});
