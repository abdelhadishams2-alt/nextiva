/**
 * Tests for Voice Profiles dashboard page and components — VI-004.
 * Tests API client methods, component data handling, page structure,
 * sidebar nav, RTL support, and responsive design.
 *
 * Run: node --test tests/dashboard-voice.test.js
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

describe("Voice Profiles: file structure", () => {
  const requiredFiles = [
    "app/(dashboard)/voice/page.tsx",
    "components/voice/persona-card.tsx",
    "components/voice/persona-detail.tsx",
    "components/voice/analyze-dialog.tsx",
  ];

  for (const file of requiredFiles) {
    it(`${file} exists`, () => {
      const full = resolve(DASHBOARD_SRC, file);
      assert.ok(existsSync(full), `Missing file: ${full}`);
    });
  }
});

// ── API client tests ──

describe("Voice Profiles: API client methods", () => {
  const apiPath = resolve(DASHBOARD_SRC, "lib", "api.ts");
  const apiSrc = readFileSync(apiPath, "utf-8");

  it("exports getVoicePersonas", () => {
    assert.ok(
      apiSrc.includes("export async function getVoicePersonas"),
      "getVoicePersonas not exported"
    );
  });

  it("exports getVoicePersona", () => {
    assert.ok(
      apiSrc.includes("export async function getVoicePersona"),
      "getVoicePersona not exported"
    );
  });

  it("exports createVoicePersona", () => {
    assert.ok(
      apiSrc.includes("export async function createVoicePersona"),
      "createVoicePersona not exported"
    );
  });

  it("exports updateVoicePersona", () => {
    assert.ok(
      apiSrc.includes("export async function updateVoicePersona"),
      "updateVoicePersona not exported"
    );
  });

  it("exports deleteVoicePersona", () => {
    assert.ok(
      apiSrc.includes("export async function deleteVoicePersona"),
      "deleteVoicePersona not exported"
    );
  });

  it("exports analyzeSiteVoice", () => {
    assert.ok(
      apiSrc.includes("export async function analyzeSiteVoice"),
      "analyzeSiteVoice not exported"
    );
  });

  it("exports getCorpusStatus", () => {
    assert.ok(
      apiSrc.includes("export async function getCorpusStatus"),
      "getCorpusStatus not exported"
    );
  });

  it("getVoicePersonas calls correct endpoint", () => {
    assert.ok(
      apiSrc.includes("/api/voice/personas"),
      "voice personas endpoint not found"
    );
  });

  it("analyzeSiteVoice calls POST /api/voice/analyze", () => {
    assert.ok(
      apiSrc.includes("/api/voice/analyze"),
      "voice analyze endpoint not found"
    );
  });

  it("getCorpusStatus calls /api/voice/corpus/", () => {
    assert.ok(
      apiSrc.includes("/api/voice/corpus/"),
      "corpus status endpoint not found"
    );
  });

  it("defines VoicePersona interface", () => {
    assert.ok(
      apiSrc.includes("export interface VoicePersona"),
      "VoicePersona interface not found"
    );
  });

  it("defines VoiceProfile interface", () => {
    assert.ok(
      apiSrc.includes("export interface VoiceProfile"),
      "VoiceProfile interface not found"
    );
  });

  it("defines CorpusStatus interface", () => {
    assert.ok(
      apiSrc.includes("export interface CorpusStatus"),
      "CorpusStatus interface not found"
    );
  });

  it("defines AnalyzeSiteResult interface", () => {
    assert.ok(
      apiSrc.includes("export interface AnalyzeSiteResult"),
      "AnalyzeSiteResult interface not found"
    );
  });

  it("VoiceProfile includes tone field", () => {
    assert.ok(
      apiSrc.includes("tone: string"),
      "tone field missing from VoiceProfile"
    );
  });

  it("VoiceProfile includes vocabulary_richness (TTR)", () => {
    assert.ok(
      apiSrc.includes("vocabulary_richness: number"),
      "vocabulary_richness field missing from VoiceProfile"
    );
  });

  it("VoicePersona includes is_default field", () => {
    assert.ok(
      apiSrc.includes("is_default: boolean"),
      "is_default field missing from VoicePersona"
    );
  });

  it("VoicePersona includes source_articles", () => {
    assert.ok(
      apiSrc.includes("source_articles"),
      "source_articles field missing from VoicePersona"
    );
  });

  it("VoicePersona includes representative_sentences", () => {
    assert.ok(
      apiSrc.includes("representative_sentences"),
      "representative_sentences field missing from VoicePersona"
    );
  });

  it("deleteVoicePersona uses DELETE method", () => {
    // Check that the delete function includes method: "DELETE"
    const deleteSection = apiSrc.substring(
      apiSrc.indexOf("export async function deleteVoicePersona"),
      apiSrc.indexOf("export async function deleteVoicePersona") + 300
    );
    assert.ok(
      deleteSection.includes('"DELETE"'),
      "deleteVoicePersona should use DELETE method"
    );
  });

  it("updateVoicePersona uses PUT method", () => {
    const updateSection = apiSrc.substring(
      apiSrc.indexOf("export async function updateVoicePersona"),
      apiSrc.indexOf("export async function updateVoicePersona") + 500
    );
    assert.ok(
      updateSection.includes('"PUT"'),
      "updateVoicePersona should use PUT method"
    );
  });
});

// ── PersonaCard component tests ──

describe("Voice Profiles: PersonaCard component", () => {
  const src = readFileSync(
    resolve(DASHBOARD_SRC, "components/voice/persona-card.tsx"),
    "utf-8"
  );

  it("is a client component", () => {
    assert.ok(src.includes('"use client"'), 'Missing "use client" directive');
  });

  it("renders persona name", () => {
    assert.ok(src.includes("persona.name"), "persona name not rendered");
  });

  it("shows tone badge", () => {
    assert.ok(
      src.includes("tone") && src.includes("Badge"),
      "Tone badge not found"
    );
  });

  it("shows TTR (Type-Token Ratio)", () => {
    assert.ok(src.includes("TTR"), "TTR display not found");
  });

  it("shows corpus size", () => {
    assert.ok(
      src.includes("corpusSize") || src.includes("source_articles"),
      "Corpus size not shown"
    );
  });

  it("shows default badge when is_default", () => {
    assert.ok(
      src.includes("is_default") && src.includes("Default"),
      "Default badge not shown"
    );
  });

  it("has Set as Default button", () => {
    assert.ok(
      src.includes("Set as Default") && src.includes("onSetDefault"),
      "Set as Default button missing"
    );
  });

  it("has keyboard navigation support", () => {
    assert.ok(
      src.includes("onKeyDown") && src.includes("Enter"),
      "Keyboard nav not supported"
    );
  });

  it("has aria-label for accessibility", () => {
    assert.ok(src.includes("aria-label"), "Missing aria-label");
  });

  it("has selected state styling", () => {
    assert.ok(
      src.includes("selected") && src.includes("ring-primary"),
      "Selected state styling missing"
    );
  });

  it("exports skeleton component", () => {
    assert.ok(
      src.includes("PersonaCardSkeleton"),
      "PersonaCardSkeleton not exported"
    );
  });

  it("skeleton uses responsive grid", () => {
    assert.ok(
      src.includes("sm:grid-cols") || src.includes("lg:grid-cols"),
      "Skeleton not responsive"
    );
  });

  it("has readability grade display", () => {
    assert.ok(
      src.includes("readability_grade"),
      "Readability grade not displayed"
    );
  });

  it("has tone color coding", () => {
    assert.ok(
      src.includes("TONE_COLORS") && src.includes("getToneColor"),
      "Tone color coding missing"
    );
  });
});

// ── PersonaDetail component tests ──

describe("Voice Profiles: PersonaDetail component", () => {
  const src = readFileSync(
    resolve(DASHBOARD_SRC, "components/voice/persona-detail.tsx"),
    "utf-8"
  );

  it("is a client component", () => {
    assert.ok(src.includes('"use client"'), 'Missing "use client" directive');
  });

  it("renders full voice profile signals", () => {
    assert.ok(
      src.includes("SIGNALS") && src.includes("avg_sentence_length"),
      "Voice signals not displayed"
    );
  });

  it("shows vocabulary_richness as TTR", () => {
    assert.ok(
      src.includes("vocabulary_richness") && src.includes("Type-Token Ratio"),
      "TTR not in detail view"
    );
  });

  it("shows representative sentences", () => {
    assert.ok(
      src.includes("representative_sentences") && src.includes("Sample Sentences"),
      "Sample sentences not shown"
    );
  });

  it("shows source articles list", () => {
    assert.ok(
      src.includes("Source Articles") && src.includes("source_articles"),
      "Source articles not shown"
    );
  });

  it("has Set as Default button", () => {
    assert.ok(
      src.includes("Set as Default") && src.includes("onSetDefault"),
      "Set as Default missing"
    );
  });

  it("has delete with confirmation", () => {
    assert.ok(
      src.includes("confirmDelete") && src.includes("Confirm Delete"),
      "Delete confirmation missing"
    );
  });

  it("has close button", () => {
    assert.ok(
      src.includes("onClose") && src.includes("Close"),
      "Close button missing"
    );
  });

  it("uses tooltips for signal explanations", () => {
    assert.ok(
      src.includes("Tooltip") && src.includes("TooltipContent"),
      "Tooltips not used for signals"
    );
  });

  it("has progress bars for signals", () => {
    assert.ok(
      src.includes("barPct") || src.includes("getBarWidth"),
      "Signal progress bars missing"
    );
  });

  it("uses RTL-compatible logical properties", () => {
    assert.ok(
      src.includes("ps-") || src.includes("ms-") || src.includes("border-s-"),
      "No RTL logical properties used"
    );
  });

  it("has aria-label for signal meters", () => {
    assert.ok(
      src.includes("aria-label") && src.includes("aria-valuenow"),
      "Missing ARIA attributes for meters"
    );
  });

  it("exports skeleton component", () => {
    assert.ok(
      src.includes("PersonaDetailSkeleton"),
      "PersonaDetailSkeleton not exported"
    );
  });

  it("shows cluster size when available", () => {
    assert.ok(
      src.includes("cluster_size"),
      "Cluster size not displayed"
    );
  });
});

// ── AnalyzeDialog component tests ──

describe("Voice Profiles: AnalyzeDialog component", () => {
  const src = readFileSync(
    resolve(DASHBOARD_SRC, "components/voice/analyze-dialog.tsx"),
    "utf-8"
  );

  it("is a client component", () => {
    assert.ok(src.includes('"use client"'), 'Missing "use client" directive');
  });

  it("has site URL input", () => {
    assert.ok(
      src.includes("site-url") && src.includes("Input"),
      "Site URL input missing"
    );
  });

  it("validates URL format", () => {
    assert.ok(
      src.includes("validateUrl") && src.includes("new URL"),
      "URL validation missing"
    );
  });

  it("shows URL validation errors", () => {
    assert.ok(
      src.includes("urlError") && src.includes("aria-invalid"),
      "URL error handling missing"
    );
  });

  it("calls analyzeSiteVoice API", () => {
    assert.ok(
      src.includes("analyzeSiteVoice"),
      "analyzeSiteVoice not called"
    );
  });

  it("polls corpus status", () => {
    assert.ok(
      src.includes("getCorpusStatus") && src.includes("polling"),
      "Corpus polling missing"
    );
  });

  it("shows progress bar", () => {
    assert.ok(
      src.includes("Progress") && src.includes("progress"),
      "Progress bar missing"
    );
  });

  it("has Start Analysis button", () => {
    assert.ok(
      src.includes("Start Analysis"),
      "Start Analysis button missing"
    );
  });

  it("shows status badge", () => {
    assert.ok(
      src.includes("Badge") && src.includes("corpusStatus"),
      "Status badge missing"
    );
  });

  it("has Analyze Another option after completion", () => {
    assert.ok(
      src.includes("Analyze Another"),
      "Analyze Another button missing"
    );
  });

  it("handles completed state", () => {
    assert.ok(
      src.includes("isCompleted") && src.includes("Analysis complete"),
      "Completed state not handled"
    );
  });

  it("handles failed state", () => {
    assert.ok(
      src.includes("isFailed") && src.includes("Analysis failed"),
      "Failed state not handled"
    );
  });

  it("calls onComplete callback", () => {
    assert.ok(
      src.includes("onComplete"),
      "onComplete callback not used"
    );
  });

  it("uses dir=ltr for URL input (RTL support)", () => {
    assert.ok(
      src.includes('dir="ltr"'),
      "URL input should have dir=ltr for RTL layouts"
    );
  });
});

// ── Voice page tests ──

describe("Voice Profiles: main page", () => {
  const src = readFileSync(
    resolve(DASHBOARD_SRC, "app/(dashboard)/voice/page.tsx"),
    "utf-8"
  );

  it("is a client component", () => {
    assert.ok(src.includes('"use client"'), 'Missing "use client" directive');
  });

  it("uses PersonaCard component", () => {
    assert.ok(src.includes("PersonaCard"), "PersonaCard not used");
  });

  it("uses PersonaDetail component", () => {
    assert.ok(src.includes("PersonaDetail"), "PersonaDetail not used");
  });

  it("uses AnalyzeDialog component", () => {
    assert.ok(src.includes("AnalyzeDialog"), "AnalyzeDialog not used");
  });

  it("calls getVoicePersonas on mount", () => {
    assert.ok(
      src.includes("getVoicePersonas"),
      "getVoicePersonas not called"
    );
  });

  it("has loading state with skeletons", () => {
    assert.ok(
      src.includes("PersonaCardSkeleton"),
      "Loading skeleton missing"
    );
  });

  it("has error state with retry", () => {
    assert.ok(
      src.includes("Retry") && src.includes("error"),
      "Error state missing"
    );
  });

  it("has empty state message", () => {
    assert.ok(
      src.includes("No voice profiles yet"),
      "Empty state missing"
    );
  });

  it("supports persona selection", () => {
    assert.ok(
      src.includes("selectedPersona") && src.includes("handleSelectPersona"),
      "Persona selection not implemented"
    );
  });

  it("handles Set as Default action", () => {
    assert.ok(
      src.includes("handleSetDefault") && src.includes("updateVoicePersona"),
      "Set as Default not implemented"
    );
  });

  it("handles Delete action", () => {
    assert.ok(
      src.includes("handleDelete") && src.includes("deleteVoicePersona"),
      "Delete not implemented"
    );
  });

  it("refreshes after analysis complete", () => {
    assert.ok(
      src.includes("handleAnalysisComplete") && src.includes("fetchPersonas"),
      "Analysis complete refresh missing"
    );
  });

  it("has page title", () => {
    assert.ok(
      src.includes("Voice Profiles"),
      "Page title missing"
    );
  });

  it("has page description", () => {
    assert.ok(
      src.includes("writing style personas"),
      "Page description missing"
    );
  });
});

// ── Sidebar nav tests ──

describe("Voice Profiles: sidebar navigation", () => {
  const src = readFileSync(
    resolve(DASHBOARD_SRC, "components/sidebar.tsx"),
    "utf-8"
  );

  it("has Voice Profiles nav item", () => {
    assert.ok(
      src.includes("Voice Profiles"),
      "Voice Profiles nav label missing"
    );
  });

  it("links to /voice", () => {
    assert.ok(
      src.includes('"/voice"'),
      "Voice href missing"
    );
  });

  it("has microphone icon for Voice Profiles", () => {
    assert.ok(
      src.includes('item.label === "Voice Profiles"') && src.includes("svg"),
      "Voice Profiles icon missing"
    );
  });
});

// ── RTL support tests ──

describe("Voice Profiles: RTL support", () => {
  it("PersonaCard uses flex-wrap for responsive layout", () => {
    const src = readFileSync(
      resolve(DASHBOARD_SRC, "components/voice/persona-card.tsx"),
      "utf-8"
    );
    assert.ok(
      src.includes("flex-wrap"),
      "No flex-wrap for RTL responsiveness"
    );
  });

  it("PersonaDetail uses logical border properties", () => {
    const src = readFileSync(
      resolve(DASHBOARD_SRC, "components/voice/persona-detail.tsx"),
      "utf-8"
    );
    assert.ok(
      src.includes("border-s-") || src.includes("ps-") || src.includes("ms-"),
      "No logical properties for RTL"
    );
  });

  it("AnalyzeDialog URL input has dir=ltr", () => {
    const src = readFileSync(
      resolve(DASHBOARD_SRC, "components/voice/analyze-dialog.tsx"),
      "utf-8"
    );
    assert.ok(
      src.includes('dir="ltr"'),
      "URL input needs dir=ltr for RTL layouts"
    );
  });

  it("Sidebar icon uses me- logical margin", () => {
    const src = readFileSync(
      resolve(DASHBOARD_SRC, "components/voice/analyze-dialog.tsx"),
      "utf-8"
    );
    assert.ok(
      src.includes("me-"),
      "Icon should use me- (margin-inline-end) not mr-"
    );
  });
});

// ── Responsive design tests ──

describe("Voice Profiles: responsive design", () => {
  it("page uses responsive grid for persona cards", () => {
    const src = readFileSync(
      resolve(DASHBOARD_SRC, "app/(dashboard)/voice/page.tsx"),
      "utf-8"
    );
    assert.ok(
      src.includes("sm:grid-cols") && src.includes("xl:grid-cols"),
      "No responsive grid breakpoints"
    );
  });

  it("page uses responsive flex for detail panel", () => {
    const src = readFileSync(
      resolve(DASHBOARD_SRC, "app/(dashboard)/voice/page.tsx"),
      "utf-8"
    );
    assert.ok(
      src.includes("lg:flex-row") && src.includes("lg:w-96"),
      "Detail panel not responsive"
    );
  });

  it("header uses responsive layout", () => {
    const src = readFileSync(
      resolve(DASHBOARD_SRC, "app/(dashboard)/voice/page.tsx"),
      "utf-8"
    );
    assert.ok(
      src.includes("sm:flex-row") && src.includes("sm:items-center"),
      "Header not responsive"
    );
  });

  it("PersonaCard skeleton uses responsive grid", () => {
    const src = readFileSync(
      resolve(DASHBOARD_SRC, "components/voice/persona-card.tsx"),
      "utf-8"
    );
    assert.ok(
      src.includes("sm:grid-cols") || src.includes("lg:grid-cols"),
      "Skeleton not responsive"
    );
  });
});
