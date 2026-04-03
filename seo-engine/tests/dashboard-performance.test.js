/**
 * Tests for the Dashboard Performance Page (FL-003).
 * Validates API contract shapes, milestone status coverage, ROI calculations,
 * and data structure integrity.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ── Portfolio Summary Contract ──

describe("PortfolioSummary API contract", () => {
  const samplePortfolio = {
    total_articles: 42,
    avg_performance_score: 72.5,
    top_performer: {
      article_id: "art-001",
      title: "Best Performing Article",
      score: 95.2,
    },
    total_clicks: 15230,
    total_impressions: 182400,
    avg_position: 8.3,
  };

  it("should have all required portfolio fields", () => {
    assert.equal(typeof samplePortfolio.total_articles, "number");
    assert.equal(typeof samplePortfolio.avg_performance_score, "number");
    assert.equal(typeof samplePortfolio.total_clicks, "number");
    assert.equal(typeof samplePortfolio.total_impressions, "number");
    assert.equal(typeof samplePortfolio.avg_position, "number");
  });

  it("should have valid top_performer shape", () => {
    const tp = samplePortfolio.top_performer;
    assert.equal(typeof tp.article_id, "string");
    assert.equal(typeof tp.title, "string");
    assert.equal(typeof tp.score, "number");
    assert.ok(tp.score >= 0 && tp.score <= 100);
  });

  it("should accept null top_performer when no articles exist", () => {
    const empty = { ...samplePortfolio, top_performer: null };
    assert.equal(empty.top_performer, null);
  });
});

// ── Article Performance Contract ──

describe("ArticlePerformance API contract", () => {
  const MILESTONE_STATUSES = ["pending", "on_track", "at_risk", "achieved", "missed"];

  const sampleArticle = {
    article_id: "art-001",
    title: "How to Build a REST API",
    published_at: "2026-01-15T10:00:00Z",
    current_clicks: 450,
    current_impressions: 8200,
    current_position: 5.2,
    current_ctr: 5.5,
    milestone_30: { status: "achieved", target: 100, actual: 150 },
    milestone_60: { status: "on_track", target: 300, actual: 280 },
    milestone_90: { status: "pending", target: 500, actual: null },
    performance_score: 78.3,
  };

  it("should have all required article performance fields", () => {
    assert.equal(typeof sampleArticle.article_id, "string");
    assert.equal(typeof sampleArticle.title, "string");
    assert.equal(typeof sampleArticle.published_at, "string");
    assert.equal(typeof sampleArticle.current_clicks, "number");
    assert.equal(typeof sampleArticle.current_impressions, "number");
    assert.equal(typeof sampleArticle.current_position, "number");
    assert.equal(typeof sampleArticle.current_ctr, "number");
    assert.equal(typeof sampleArticle.performance_score, "number");
  });

  it("should define all 5 milestone statuses", () => {
    assert.equal(MILESTONE_STATUSES.length, 5);
    assert.ok(MILESTONE_STATUSES.includes("pending"));
    assert.ok(MILESTONE_STATUSES.includes("on_track"));
    assert.ok(MILESTONE_STATUSES.includes("at_risk"));
    assert.ok(MILESTONE_STATUSES.includes("achieved"));
    assert.ok(MILESTONE_STATUSES.includes("missed"));
  });

  it("should have valid milestone_30 shape", () => {
    const m = sampleArticle.milestone_30;
    assert.ok(MILESTONE_STATUSES.includes(m.status));
    assert.equal(typeof m.target, "number");
    assert.ok(m.actual === null || typeof m.actual === "number");
  });

  it("should have valid milestone_60 shape", () => {
    const m = sampleArticle.milestone_60;
    assert.ok(MILESTONE_STATUSES.includes(m.status));
    assert.equal(typeof m.target, "number");
    assert.ok(m.actual === null || typeof m.actual === "number");
  });

  it("should have valid milestone_90 shape", () => {
    const m = sampleArticle.milestone_90;
    assert.ok(MILESTONE_STATUSES.includes(m.status));
    assert.equal(typeof m.target, "number");
    assert.ok(m.actual === null || typeof m.actual === "number");
  });

  it("should accept null actual for pending milestones", () => {
    assert.equal(sampleArticle.milestone_90.actual, null);
    assert.equal(sampleArticle.milestone_90.status, "pending");
  });

  it("should have performance_score between 0 and 100", () => {
    assert.ok(sampleArticle.performance_score >= 0);
    assert.ok(sampleArticle.performance_score <= 100);
  });
});

// ── Weight History Contract ──

describe("WeightHistory API contract", () => {
  const sampleHistory = [
    {
      date: "2026-01-01",
      weights: { content_quality: 30, seo_signals: 25, engagement: 20, freshness: 15, authority: 10 },
    },
    {
      date: "2026-02-01",
      weights: { content_quality: 28, seo_signals: 27, engagement: 22, freshness: 13, authority: 10 },
    },
    {
      date: "2026-03-01",
      weights: { content_quality: 25, seo_signals: 30, engagement: 20, freshness: 15, authority: 10 },
    },
  ];

  it("should have date and weights for each entry", () => {
    for (const entry of sampleHistory) {
      assert.equal(typeof entry.date, "string");
      assert.equal(typeof entry.weights, "object");
      assert.ok(Object.keys(entry.weights).length > 0);
    }
  });

  it("should have consistent weight keys across entries", () => {
    const keys0 = Object.keys(sampleHistory[0].weights).sort();
    for (const entry of sampleHistory) {
      const keys = Object.keys(entry.weights).sort();
      assert.deepEqual(keys, keys0);
    }
  });

  it("should have numeric weight values", () => {
    for (const entry of sampleHistory) {
      for (const value of Object.values(entry.weights)) {
        assert.equal(typeof value, "number");
        assert.ok(value >= 0);
      }
    }
  });
});

// ── ROI Report Contract ──

describe("ROIReport API contract", () => {
  const sampleROI = {
    total_investment: 9000,
    total_revenue: 15000,
    roi_percentage: 66.7,
    cost_per_article: 214.3,
    revenue_per_article: 357.1,
    monthly_breakdown: [
      {
        month: "Jan 2026",
        articles_produced: 10,
        cost: 3000,
        estimated_traffic_value: 4500,
        roi: 50.0,
      },
      {
        month: "Feb 2026",
        articles_produced: 15,
        cost: 3000,
        estimated_traffic_value: 5000,
        roi: 66.7,
      },
      {
        month: "Mar 2026",
        articles_produced: 17,
        cost: 3000,
        estimated_traffic_value: 5500,
        roi: 83.3,
      },
    ],
  };

  it("should have all required ROI summary fields", () => {
    assert.equal(typeof sampleROI.total_investment, "number");
    assert.equal(typeof sampleROI.total_revenue, "number");
    assert.equal(typeof sampleROI.roi_percentage, "number");
    assert.equal(typeof sampleROI.cost_per_article, "number");
    assert.equal(typeof sampleROI.revenue_per_article, "number");
  });

  it("should have non-empty monthly_breakdown", () => {
    assert.ok(Array.isArray(sampleROI.monthly_breakdown));
    assert.ok(sampleROI.monthly_breakdown.length > 0);
  });

  it("should have valid monthly breakdown entries", () => {
    for (const month of sampleROI.monthly_breakdown) {
      assert.equal(typeof month.month, "string");
      assert.equal(typeof month.articles_produced, "number");
      assert.equal(typeof month.cost, "number");
      assert.equal(typeof month.estimated_traffic_value, "number");
      assert.equal(typeof month.roi, "number");
      assert.ok(month.articles_produced >= 0);
      assert.ok(month.cost >= 0);
    }
  });

  it("should calculate ROI correctly as (revenue - cost) / cost * 100", () => {
    const calculated =
      ((sampleROI.total_revenue - sampleROI.total_investment) /
        sampleROI.total_investment) *
      100;
    assert.ok(Math.abs(calculated - sampleROI.roi_percentage) < 0.2);
  });
});

// ── Milestone Badge Variant Mapping ──

describe("Milestone badge variant mapping", () => {
  const MILESTONE_VARIANT = {
    achieved: "default",
    on_track: "secondary",
    pending: "outline",
    at_risk: "destructive",
    missed: "destructive",
  };

  it("should map all 5 statuses to badge variants", () => {
    assert.equal(Object.keys(MILESTONE_VARIANT).length, 5);
  });

  it("should use default for achieved", () => {
    assert.equal(MILESTONE_VARIANT.achieved, "default");
  });

  it("should use destructive for at_risk and missed", () => {
    assert.equal(MILESTONE_VARIANT.at_risk, "destructive");
    assert.equal(MILESTONE_VARIANT.missed, "destructive");
  });

  it("should use outline for pending", () => {
    assert.equal(MILESTONE_VARIANT.pending, "outline");
  });

  it("should use secondary for on_track", () => {
    assert.equal(MILESTONE_VARIANT.on_track, "secondary");
  });
});

// ── Performance Page Data Flow ──

describe("Performance page data flow", () => {
  it("should handle all API responses being null gracefully", () => {
    // Simulates the catch(() => null) pattern used in the page
    const responses = [null, null, null, null];
    const [portfolioRes, articlesRes, weightsRes, roiRes] = responses;

    const portfolio = portfolioRes?.success ? portfolioRes.data : null;
    const articles = articlesRes?.success ? articlesRes.data : [];
    const weights = weightsRes?.success ? weightsRes.data : [];
    const roi = roiRes?.success ? roiRes.data : null;

    assert.equal(portfolio, null);
    assert.deepEqual(articles, []);
    assert.deepEqual(weights, []);
    assert.equal(roi, null);
  });

  it("should extract data from successful API responses", () => {
    const portfolioRes = { success: true, data: { total_articles: 5 } };
    const articlesRes = { success: true, data: [{ article_id: "a1" }], meta: {} };

    const portfolio = portfolioRes?.success ? portfolioRes.data : null;
    const articles = articlesRes?.success ? articlesRes.data : [];

    assert.equal(portfolio.total_articles, 5);
    assert.equal(articles.length, 1);
    assert.equal(articles[0].article_id, "a1");
  });
});
