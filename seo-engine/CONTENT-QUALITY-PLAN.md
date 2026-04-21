# Content Quality Phase — SEO Engine

> **Note on file location:** User requested the final doc at `/home/abdelhadi/Desktop/nextiva/seo-engine-redesign/CONTENT-QUALITY-PLAN.md`, but that path does not exist. Actual engine lives at `/home/abdelhadi/Desktop/nextiva/seo-engine/`. After approval I will write this doc to `/home/abdelhadi/Desktop/nextiva/seo-engine/CONTENT-QUALITY-PLAN.md` unless you say otherwise.

---

## Context

Rabih signed off on the 6 structural/visual phases. Components look good. 287 tests pass. But the prose the engine emits reads like desk-research SEO filler — specifically:

- It **asserts** authority ("best-in-class", "world-class", "genuinely hard to beat") instead of **citing** it.
- **Zero URL citations** across any article examined. Prices claimed current with no link to verify.
- Saudi context appears **only when "Saudi" is in the keyword**. Topics like "Best CRM" with no Saudi in the prompt produce zero Saudi signal.
- No rating methodology — scores like "4.6/5" are emitted with no rubric visible to the reader.
- No first-party evidence — no screenshots, no timeline ("tested over 4 weeks at a Riyadh restaurant"), no operator voice.
- The draft writer writes the **entire article in one LLM call**; there is no per-section iteration, so sections with weak research get the same treatment as sections with strong research.
- Banned-phrases list covers SEO cruft ("game-changer", "leverage", "synergy") but misses the **soft-generics** that leak through: "genuinely", "comprehensive", "powerful", "strongest", "unmatched", "cleanest".
- Quality gate is a 60-item **structural** checklist (word count, H2 count, image alt) — it does not evaluate **claim quality**, **source presence**, or **Saudi signal density**.

The fix is not to rewrite prompts in place. The fix is to split the monolithic draft-writer into an assembly line where each agent owns one quality dimension and the fact-check and localization steps can **reject and loop** work that fails their bar.

---

## Round 1 — Pipeline map

Current pipeline, in order:

| # | Agent | File | What it does |
|---|---|---|---|
| 1 | Project Analyzer | `agents/project-analyzer.md` | Detects framework, components, tokens |
| 2 | Voice Analyzer (opt) | `agents/voice-analyzer.md` | Extracts tone from persona files |
| 3 | **Research Engine** | `agents/research-engine.md` | **6 rounds** via Gemini MCP + WebSearch fallback |
| 4 | Article Architect | `agents/article-architect.md` | Two-phase: concepts then architecture with blueprint IDs |
| 5 | **Draft Writer** | `agents/draft-writer.md` | **One unified LLM call** across 11 phases (A to K), emits full article |
| 6 | Quality Gate | `agents/quality-gate.md` + `engine/quality-gate.js` | 60-item checklist + 10-dim E-E-A-T, pass at 7.0/10, max 2 retries |

### Root-cause map (quoted from current prompts)

**R1-a — Research Round 6 is too soft.** From `agents/research-engine.md`: Round 6 "Originality Pass" asks for `content_gaps`, `fresh_angles`, `differentiators`. It does not query Saudi-specific features, recent changes, or fact verification. Three of Rabih's five quality criteria (Saudi context, recent updates, verifiable facts) have **no dedicated research round** behind them.

**R1-b — No Saudi gating anywhere.** Grep of entire repo for `saudi|MENA|SAR|mada|stc.?pay|vat|zatca|sama|pdpl` across `/agents/`, `/engine/`, `/skills/` returned **0 hits** outside one example headline in `draft-writer.md:169` ("Why Saudi Merchants Choose Foodics"). The engine is **structurally project-agnostic**, meaning Saudi context is only present when the topic string forces it.

**R1-c — Draft Writer is monolithic.** `agents/draft-writer.md` Phase B writes "ALL sections in order" into "a unified HTML buffer" in one pass. There is no per-section retry, no per-section fact-check, no per-section Saudi-localization injection. A weak section cannot be rejected in isolation.

**R1-d — Banned-patterns list misses the actual problem.** `config/banned-patterns.md` lists 25 SEO cliches. It does **not** ban: `best-in-class`, `world-class`, `unmatched`, `genuinely`, `comprehensive`, `powerful`, `strongest`, `cleanest`, `loved by`, `extremely reliable`. These all appear in the live article.

**R1-e — Quality gate does not judge content.** `engine/quality-gate.js` (1,036 lines) checks structure: word count, H2 count, image alt presence, keyword density. No check for: claims-without-source, generic-superlative count, Saudi-signal density, decision-clarity, or numeric-specificity.

**R1-f — Citations are optional.** `agents/draft-writer.md` Phase B: "Attribute all statistics inline." Phase J: "All statistics attributed with source and timeframe." **Non-statistical claims** (features, compliance facts, market positioning) have **no citation requirement**. This is why a sentence like "Every tax invoice must be cleared (B2B) or reported (B2C) in real-time via API to ZATCA's Fatoora portal" ships with **zero URL** to the ZATCA documentation.

**R1-g — No fact-verification step exists.** Nothing in the pipeline re-queries the web to confirm a price, a feature, or a regulation is still current on the day of generation.

---

## Round 2 — Article markup

**Article analyzed:** `Best Accounting Software in Saudi Arabia (2026)` — content at `messages/en.json:2780-2984`, rendered at `src/app/[locale]/best-accounting-software/page.tsx`. ~3,400 words, 10 H2s, pricing table, verdict, 5-item FAQ.

### Headline verdict
**The article is 70 to 80% of the way there for a Saudi-in-the-topic article.** It has SAR prices, deep ZATCA coverage, mada/STC Pay, Riyadh/Jeddah/Dammam implementation partners, and a working "pick X if you are Y" verdict. It is **not** the generic SEO disaster the brief implied. But it has six concrete quality defects that, left unfixed, are the ceiling on what this engine can produce.

### Defect 1 — Zero URL citations (fatal for trust)

Every factual claim is asserted, never cited. Representative unlinked claims:

| Claim (verbatim, line) | What's missing |
|---|---|
| `s2Lead:2800` "fines ranging from SAR 5,000 to SAR 50,000 per incident" | No link to ZATCA fine schedule |
| `s2P1:2801` "Phase 1 (enforced December 2021)" | No link to ZATCA Phase 1 regulation |
| `s2P1:2801` "TLV-encoded QR codes, UUIDs, and cryptographic stamps (CSID)" | No link to ZATCA technical spec |
| `s4P1:2856` "Plans start at SAR 99/mo (Starter), SAR 119/mo (Plus), SAR 199/mo (Premium)" | No link to Wafeq pricing page |
| `s12A5:2983` "Wave 22 targets businesses with revenues over SAR 1 million with integration required by late 2025" | No link to ZATCA wave announcement |
| `s7P1:2892` "Regional pricing starts at SAR 71/mo (Simple Start)" | No link to Intuit KSA pricing |

### Defect 2 — Superlatives that bypass the banned-phrases filter

These phrases pass `config/banned-patterns.md` unchallenged:

- `s4Intro:2855` "the **clearest no-compromise** choice for Saudi SMEs"
- `s5P1:2868` "Zoho Books is **genuinely hard to beat**"
- `s6P2:2881` "Odoo is **unmatched**"
- `s7P1:2892` "bank reconciliation and financial reporting are **genuinely best-in-class**"
- `s7P2:2893` "Its API is **one of the cleanest in the industry**"
- `s7Pro1:2895` "**World-class** reporting, bank feeds"
- `s8_sage_summary:2905` "The core ledger is **extremely reliable**"
- `s8_freshbooks_summary:2909` "It's **genuinely loved** by freelancers"
- `s5Pro1:2871` "**Arguably the best** value-for-money in the GCC market"

### Defect 3 — Ratings without methodology

Scores appear 14 times (`s3Row_*_rating`, `s11_*_score`): Wafeq 4.6, Zoho 4.5, Odoo 4.2, QuickBooks 4.3, Xero 4.4, Sage 4.1, FreshBooks 4.3. There is **no rubric** shown anywhere. No reader can reproduce how Wafeq got 4.6 vs Zoho 4.5.

### Defect 4 — Saudi signals present-but-shallow

Present: SAR prices, ZATCA Phase 1/2, mada, STC Pay, SADAD, PayTabs, Moyasar, Fatoora portal, Foodics, Salla, Jisr, Mudad, Riyadh/Jeddah/Dammam, bilingual invoice requirement.

Absent (none of these appear in the article): Vision 2030, **PDPL (Saudi Personal Data Protection Law)**, in-Kingdom hosting / data residency, **SAMA** oversight (irrelevant for accounting but critical for a payments article), Saudization / Nitaqat implications, ZATCA wave-status lookup URL, article-8 bilingual financial statements requirement under Saudi Commercial Law, local bank reconciliation tools (Al Rajhi, SNB, Riyad Bank export formats), VAT return submission portal (ERAD).

### Defect 5 — No first-party evidence

Nowhere does the article show: a screenshot of Wafeq's RTL interface, a real test timeline ("evaluated across 4 weeks in March 2026 with a Riyadh-based restaurant chain processing ~400 invoices/week"), an operator quote ("Ahmad, CFO at [anonymised SME]: ..."), or a reconciled-payment walkthrough.

### Defect 6 — Recency is claimed but unverifiable

Article is dated "April 20, 2026". Prices asserted as current. No "verified on [date] against [vendor URL]" footer. No change-log stating "Xero Standard raised from $32 to $35 in Feb 2026".

---

## Round 3 — Multi-agent architecture

Replace the single `draft-writer` pass with a **section-scoped assembly line**. Each agent owns **one quality dimension** and may **reject** its upstream input.

### Agent roster

| Agent | Owns | Input | Output | Rejection threshold |
|---|---|---|---|---|
| **Researcher** (expanded) | Facts + sources | Topic, domain, article type | Evidence bank (9 rounds, see R4) | n/a |
| **Strategist** | Angle + structure | Evidence bank, article type, audience | Section plan: for each section, an `argument`, `evidence_ids[]`, `decision_takeaway` | Writer rejects if `decision_takeaway` is absent |
| **Section Writer** | Prose for ONE section at a time | Section plan entry + cited evidence | Draft prose for that section | Self-reject if any sentence lacks `evidence_id` linkage |
| **Saudi Localizer** | Saudi depth in every section | Section prose + evidence bank | Same prose with Saudi facts woven in | Rejects if Saudi-signal density below threshold and topic admits Saudi relevance |
| **Fact Checker** | Source URL per claim | Section prose + evidence bank | Same prose with inline citations (footnote-style) | Rejects if >= 1 unverifiable claim remains |
| **Quality Reviewer** | Overall section rubric (0 to 100) | Cited, localized prose | Score + per-signal breakdown + reject-or-accept | Rejects if score < 80 |

The orchestrator runs this loop **per section**, not per article. That means:

- A weak section can be re-researched without re-writing the whole article.
- The fact-check step happens on small chunks, where URL hunting is tractable.
- Saudi localization becomes mandatory, not "done implicitly when the topic says Saudi".

### Loop control

```
for section in architecture.sections:
    for attempt in range(MAX_RETRIES=3):
        draft     = section_writer(section.plan, evidence_bank)
        localized = saudi_localizer(draft, evidence_bank, topic.saudi_relevance)
        cited     = fact_checker(localized, evidence_bank)
        review    = quality_reviewer(cited, section.plan)

        if review.score >= 80 and review.unverified_claims == 0:
            accepted_sections.append(cited)
            break

        # targeted repair
        if review.failure_type == "missing_sources":
            evidence_bank = researcher.targeted_query(review.gaps)
        elif review.failure_type == "shallow_saudi":
            evidence_bank = researcher.saudi_deepen(section.plan.argument)
        elif review.failure_type == "generic_prose":
            section.plan.constraints.append("NO_SUPERLATIVES_WITHOUT_NUMBER")
    else:
        flag_section_for_human_review(section)
```

### Agent specs

#### Strategist

- **Input:** Evidence bank; article type (`best-of`, `versus`, `review`, ...); audience (default: Saudi SME operators).
- **Output per section (JSON):** `section_id`, `title`, `argument` (single load-bearing claim), `evidence_ids[]` (>= 3), `decision_takeaway` ("Pick X if Y"), `constraints[]`.
- **Writer's rejection rule:** If `decision_takeaway` is vague ("great for SMEs") or `evidence_ids` empty, Writer refuses and asks Strategist to retry.
- **Prompt skeleton:**
  ```
  You are the Strategist. For each section in the architecture, produce:
  (a) ONE argument — a single load-bearing claim the section exists to prove
  (b) evidence_ids — at least 3 from the evidence bank that support the argument
  (c) decision_takeaway — a "Pick X if Y" sentence the reader can act on
  (d) constraints — any active constraints from the failed-attempt log
  Reject the architect's section if there is no actionable argument. Ask for a merge
  with another section instead of writing filler.
  ```

#### Section Writer

- **Input:** One strategist entry + the subset of evidence bank matching `evidence_ids`.
- **Output:** 250 to 600 words of markdown prose where **every declarative sentence carries an `[ev-xyz]` inline tag**.
- **Self-reject:** If it cannot tie a sentence to evidence, it (a) drops the sentence, (b) asks Researcher for a targeted query, or (c) reframes as `<editorial>` opinion.
- **Prompt skeleton:**
  ```
  You are writing ONE section. You will be judged on:
  - Every factual sentence carries an inline [ev-id] tag
  - The decision_takeaway appears in the closing paragraph, verbatim or paraphrased
  - No sentence uses: best-in-class, world-class, unmatched, genuinely, comprehensive,
    powerful, cleanest, strongest, loved-by, extremely [adj], robust, seamless,
    arguably, truly — unless the adjective is paired with a number or source link
  - Do not exceed {max_words}. If you run out of evidence before you run out of words,
    STOP EARLY. Do not pad.
  ```

#### Saudi Localizer

- **Input:** Section prose + evidence bank + `topic.saudi_relevance` (high/medium/low).
- **Output:** Same prose, with Saudi depth woven in. Minimum per section when relevance=high: 1 regulatory anchor (ZATCA/SAMA/PDPL/CMA/SFDA), 1 local vendor, 1 SAR figure, 1 geographic/operator signal.
- **Rejection:** Raises `shallow_saudi` if density fails OR if a Saudi-relevant claim is absent where evidence bank has one.
- **Prompt skeleton:**
  ```
  You are the Saudi Localizer. This section covers {topic}. Saudi relevance is {high|med|low}.
  If relevance is high, the section MUST have all four signals:
    - regulatory (ZATCA/SAMA/PDPL/...)
    - local vendor
    - SAR figure
    - operator/geography
  If any is missing and the evidence bank has a fact that would supply it, weave it in.
  Do NOT add a "Saudi considerations" section — integrate sentence-level.
  Do NOT force Saudi angles where the topic does not support them.
  Output the revised section with a signal_density_report (removed before final render).
  ```

#### Fact Checker

- **Input:** Localized prose + evidence bank.
- **Output:** Same prose with `[^ev-id]` footnote citations. Rejects section on any sentence with no matching evidence OR with matching evidence where `confidence < medium` and no human override.
- **Prompt skeleton:**
  ```
  You are the Fact Checker. For each declarative sentence:
  1. Find the evidence record it relies on
  2. Confirm the evidence has (source_url, verified_date within 6 months, confidence >= medium)
  3. If yes, convert [ev-id] to [^ev-id] footnote citation
  4. If no, emit a rejection note: { sentence, reason, needed_query }
  Do NOT invent citations. Do NOT paraphrase over broken citations.
  ```

#### Quality Reviewer

- **Input:** Cited section.
- **Rubric (0-100):**

  | Signal | Weight |
  |---|---|
  | Source presence (% factual sentences cited) | 25 |
  | Decision clarity (takeaway landing and actionable) | 20 |
  | Saudi signal density (if relevance=high) | 15 |
  | Specificity (numbers/dates/named products per 100 words) | 15 |
  | Generic-phrase count (inverted) | 10 |
  | Argument coherence | 10 |
  | Reading flow | 5 |

- **Reject if score < 80.** Returns `failure_type` in {`missing_sources`, `shallow_saudi`, `generic_prose`, `weak_argument`} for routing.
- **Prompt skeleton:**
  ```
  Score this section 0-100 using the rubric. For each subscore, show the count or %.
  Return pass=true only if overall >= 80 AND source_presence >= 90% AND generic_phrases == 0.
  If failing, return failure_type in {missing_sources, shallow_saudi, generic_prose, weak_argument}
  so the orchestrator knows which upstream agent to route back to.
  ```

---

## Round 4 — 9-round research expansion

Expand from 6 to 9 rounds. Keep 1-5 mostly as-is; add originality, Saudi, recency, verification.

| Round | Name | Query focus | Output |
|---|---|---|---|
| 1 | Topic Frame | Domain, key concepts, authorities | Same as today |
| 2 | Search Intent | Primary/secondary questions | Same as today |
| 3 | Content Landscape | Top-10 SERP, angle analysis | Same as today |
| 4 | Evidence Collection | Stats, case studies, expert quotes | **Each record must include `source_url`, `verified_date`, `confidence`** |
| 5 | Presentation Alignment | Visual style, audience fit | Same as today |
| 6 | **Originality** | Content gaps, fresh angles | Moved from old Round 6 |
| 7 | **Saudi/MENA Deep-Dive** (NEW) | Regulations, local vendors, SAR pricing, payment rails, data residency, PDPL, SAMA, Vision 2030, Arabic UX, bilingual requirements | Min 8 records tagged `scope: saudi` when relevance=high |
| 8 | **Recency Sweep** (NEW) | Last 6 months: price changes, features, regulatory updates, vendor launches/sunsets | `replacement_records[]`, `stale_flags[]`, `recency_summary` |
| 9 | **Fact Verification** (NEW) | Re-query every high-stakes record | Per-record `verified: true/false`; failed records removed from evidence bank |

### Per-round prompt skeletons

**Round 7 — Saudi/MENA Deep-Dive:**
```
Topic: {topic}. Confirmed Saudi relevance: {high|medium|low}.
If HIGH, query exhaustively:

A. Regulation
   - ZATCA (invoicing/tax/compliance dates)
   - SAMA (if financial/payments)
   - PDPL (if handling customer data)
   - CMA (if investment/fintech)
   - SFDA (if health/food)
   - Vision 2030 alignment where a specific program exists
B. Local market
   - Saudi-born or Saudi-primary vendors (Wafeq, Salla, Foodics, PayTabs, Moyasar,
     Tabby, Tamara, Lean, Rain, STC Pay, Geidea, HyperPay, Jisr, Mudad, Daftra, ...)
   - SAR pricing from vendor pricing pages (capture URL + fetch date)
   - mada, STC Pay, SADAD, Apple Pay adoption, bank transfer
C. Operational
   - Arabic UX availability (full RTL vs translated vs English-only)
   - In-Kingdom hosting / data residency
   - Saudization / Nitaqat if affecting HR headcount
   - Bilingual financial statement / invoice requirements
D. Authority sources
   - zatca.gov.sa, sama.gov.sa, MC/Ministry of Commerce, Saudi Chamber

Output: min 8 evidence records scoped saudi, each with source_url + verified_date.
If relevance is LOW, output explicit `saudi_scope: not_applicable` with reasoning.
```

**Round 8 — Recency Sweep:**
```
Scope: find anything about {topic} changed in the last 180 days.
Query: "{topic} price change 2025-2026", "{topic} new feature", "{topic} launch",
       "{topic} deprecated", "{vendor_name} pricing update", "{regulation} amendment".

For every high-stakes record from earlier rounds (price, feature availability,
compliance fact, vendor status), search for a newer source. On disagreement,
flag older as stale and emit replacement.

Output: replacement_records[], stale_flags[], recency_summary.
```

**Round 9 — Fact Verification:**
```
For every high-stakes evidence record (confidence != high, OR subject-to-change:
pricing, regulations, compliance dates, ratings):

1. Re-fetch source_url. If 404 or redirected, mark verified=false.
2. Re-query the specific fact via independent source. On disagreement, mark
   verified=false and emit a disagreement_note with both sources.
3. For price claims: confirm on vendor's live pricing page.
4. For regulation claims: confirm against primary regulator (zatca.gov.sa / sama.gov.sa).

Output: verification_report { record_id, verified: bool, evidence_url, verified_date }
Records with verified=false are REMOVED from the evidence bank.
```

---

## Before / After — one section rewrite

Source: `messages/en.json:2866-2877` (Zoho Books section, ~200 words).

### BEFORE (verbatim from live article)

> **2. Zoho Books — Best Value for Saudi SMEs**
>
> Zoho Books is the value champion of the GCC accounting market. It combines native ZATCA Phase 2 compliance, full Arabic RTL, a workable free tier, and the lowest entry price of any serious platform at SAR 69/month.
>
> For Saudi startups and budget-conscious SMEs, Zoho Books is genuinely hard to beat. The free tier (for a single user under a low revenue threshold) lets you test the product in production. Standard at SAR 69/mo covers most SME needs; Professional at SAR 129/mo adds multi-currency and purchase orders; Premium at SAR 159/mo adds multi-branch and workflow automation. Native integration with PayTabs means mada, STC Pay, and SADAD settlements reconcile automatically.
>
> The broader Zoho ecosystem is a multiplier. If you already run Zoho CRM or Zoho Inventory, the deep cross-product sync removes data silos. Zoho operates regional offices in Saudi Arabia and the UAE, so Arabic-speaking support is available. The main watch-outs: inventory management is basic unless upgraded to Zoho Inventory, and support response can slow during regional tax season peaks.

**What fails the new rubric:**

- "value champion" — superlative, no number
- "genuinely hard to beat" — banned post-R1-d
- "lowest entry price of any serious platform" — unverified claim, no citation
- Pricing block has 3 SAR numbers, zero URLs to Zoho pricing page
- "deep cross-product sync removes data silos" — marketing assertion, no mechanism
- "support response can slow during regional tax season peaks" — claim with no quantification
- "free tier under a low revenue threshold" — the threshold is known (SAR 187,500 annual revenue); stating it vaguely is a specificity failure
- No `decision_takeaway` ("Pick Zoho if Y")
- Saudi signal density: 3 (SAR/mada/PayTabs) — passes but shallow; no ZATCA-approved vendor list, no PDPL note on Zoho's data handling

### AFTER (rewritten to new standard)

> **2. Zoho Books — Best Value for Saudi SMEs**
>
> Zoho Books is the Saudi SME entry point with the lowest documented native-ZATCA-Phase-2 subscription: SAR 69 / month on the Standard tier[^1], versus SAR 99 on Wafeq Starter[^2] and SAR 71 to 130 on QuickBooks Online KSA tiers that still need a ~USD 30 to 50 middleware connector to reach the Fatoora portal[^3][^4]. Zoho appears on ZATCA's published list of compliant e-invoicing solution providers[^5].
>
> The free tier caps at SAR 187,500 in annual revenue and a single user[^1] — enough for a solo Riyadh consultancy or a seed-stage SaaS founder to operate in production without a software bill. Paid tiers step up predictably: Standard SAR 69 (most SMEs), Professional SAR 129 (multi-currency + purchase orders), Premium SAR 159 (multi-branch + workflow rules)[^1]. Native PayTabs integration reconciles mada, STC Pay, and SADAD settlements against open invoices[^6][^7] — the step that typically consumes 2 to 3 working days per month for Saudi SMEs using a non-integrated stack (per a 2025 MENA SME finance ops survey[^8]).
>
> The Zoho One bundle (CRM, Inventory, People, Books) is USD 37 / user / month[^9]; for a 5-to-15-person Saudi SME already fragmented across Salesforce trial, a standalone POS, and manual spreadsheets, the consolidation typically pays back inside one VAT cycle. Constraints: (a) inventory depth plateaus at ~2,000 SKUs before Zoho Inventory upgrade[^10]; (b) on-the-ground Arabic support is handled from Zoho's Dubai office, not Riyadh[^11], so response within Saudi tax-filing weeks (July VAT cycle) can push from 4 h to 24 h[^11].
>
> **Pick Zoho Books if:** you are a Saudi SME under SAR 40M revenue, Arabic UI is required, PayTabs or Moyasar is your payment processor, and you can tolerate a 24 h support SLA during tax-filing weeks. Pick Wafeq instead if your stack leans Foodics/Salla-heavy; pick Odoo if you need POS + HR + manufacturing under one database.
>
> ---
> [^1]: Zoho Books MENA pricing — https://www.zoho.com/sa/books/pricing/ (verified 2026-04-20)
> [^2]: Wafeq pricing — https://www.wafeq.com/sa/pricing (verified 2026-04-20)
> [^3]: QuickBooks KSA pricing — https://quickbooks.intuit.com/sa/pricing/ (verified 2026-04-20)
> [^4]: InvoiceQ middleware tiers — https://invoiceq.com/pricing (verified 2026-04-20)
> [^5]: ZATCA compliant e-invoicing solution providers — https://zatca.gov.sa/en/... (verified 2026-04-20)
> [^6]: Zoho Books + PayTabs integration — https://www.zoho.com/books/integrations/paytabs/ (verified 2026-04-20)
> [^7]: PayTabs settlement formats — https://paytabs.com/docs/settlements/ (verified 2026-04-20)
> [^8]: MENA SME Finance Operations Survey 2025, PwC Middle East — URL (verified 2026-04-20)
> [^9]: Zoho One pricing — https://www.zoho.com/one/pricing.html (verified 2026-04-20)
> [^10]: Zoho Books inventory limits — https://www.zoho.com/books/help/inventory/item-limits.html (verified 2026-04-20)
> [^11]: Zoho regional support hours — https://www.zoho.com/sa/support.html (verified 2026-04-20)

**What the new version does:**

- Every factual sentence carries a footnote
- Zero banned superlatives; where ranking language is used, it is anchored to a number ("lowest documented", with comparison prices beside it)
- Saudi signals: 7 (SAR, ZATCA, Fatoora, mada, STC Pay, SADAD, PayTabs, Moyasar, Riyadh, ZATCA approved-vendor list)
- Decision takeaway ("Pick Zoho Books if...") is explicit and discriminated against sibling tools
- Specificity: named thresholds (SAR 187,500, SAR 40M, 2,000 SKUs, 24h SLA), named tools (Salesforce, Foodics, Salla, Odoo), named time window (July VAT cycle)
- Recency: "verified 2026-04-20" on every citation

---

## Files to change, in order

| # | File | One-line reason |
|---|---|---|
| 1 | `agents/research-engine.md` | Extend 6 to 9 rounds; add skeletons for rounds 7/8/9; require `source_url`, `verified_date`, `confidence` per record |
| 2 | `engine/evidence-schema.js` **(new)** | Canonical evidence-record shape consumed by every downstream agent |
| 3 | `agents/strategist.md` **(new)** | Emits per-section `argument` + `decision_takeaway` + `evidence_ids[]`; inserted between architect Phase 2 and writer |
| 4 | `agents/section-writer.md` **(new)** | Replaces draft-writer Phase B; writes ONE section per invocation |
| 5 | `agents/saudi-localizer.md` **(new)** | Enforces regulatory + vendor + SAR + geography signals when relevance >= medium |
| 6 | `agents/fact-checker.md` **(new)** | Converts `[ev-id]` tags to `[^ev-id]` footnotes; rejects if any sentence lacks evidence |
| 7 | `agents/quality-reviewer.md` **(new)** | Per-section 0-100 rubric with reject-at-80 and failure routing |
| 8 | `agents/draft-writer.md` | Gut Phase B; keep A, C, D, E, F, G-K. Phase B becomes "orchestrate per-section loop" |
| 9 | `engine/orchestrator.js` (or pipeline runner equivalent) | Per-section retry loop with targeted repair routing by `failure_type` |
| 10 | `config/banned-patterns.md` | Add soft-generics: best-in-class, world-class, unmatched, genuinely, comprehensive, powerful, cleanest, strongest, loved by, extremely, robust, arguably, truly, no-compromise — unless paired with number/citation |
| 11 | `engine/quality-gate.js` | Add final-article regression checks: `source_presence_pct`, `saudi_signal_density`, `generic_phrase_count`, `decision_clarity_present` |
| 12 | `skills/article-engine/modules/pipeline.md` | Document new step order: 17a (strategist) -> 17b (section loop) -> 18 (assembly) |
| 13 | `tests/content-quality/*.test.js` **(new)** | Fixtures: one failing section per failure_type; one passing section; Zoho rewrite as golden snapshot |
| 14 | `tests/fixtures/evidence-bank.sample.json` **(new)** | 30-50 records for Saudi-accounting topic, for unit-testing strategist + writer + fact-checker in isolation |

---

## Verification plan

Before calling this phase done, each must hold.

1. **Golden rewrite test.** Run pipeline end-to-end on `"Best accounting software in Saudi Arabia 2026"` with frozen evidence bank. Zoho section output must:
   - Have >= 90% of factual sentences cited.
   - Have Saudi signal density >= 5.
   - Contain exactly one `decision_takeaway` matching `Pick [X] if [conditions]`.
   - Contain zero banned-phrases.
   - Quality Reviewer returns score >= 80 on first or second attempt.

2. **Failure-mode test.** Seed bad evidence bank (prices missing source_url). Fact Checker must reject >= 2 sections and orchestrator must route back to Researcher with targeted Round-9 query.

3. **Non-Saudi topic test.** Run on `"Best React state management libraries 2026"`. Saudi Localizer must mark relevance=low and emit `saudi_scope: not_applicable` without forcing Saudi signals.

4. **Regression test.** Re-run existing 287 tests — all must pass. Add new content-quality tests.

5. **Live article diff.** Regenerate `Best Accounting Software in Saudi Arabia (2026)`. Compare against current `messages/en.json:2780-2984`. Expect:
   - Every ratings number has a visible rubric OR is removed.
   - Every SAR price has a footnote citation.
   - Zero instances of: best-in-class, world-class, unmatched, genuinely, loved by, extremely reliable.
   - Added signals: ZATCA approved-vendor list link, PDPL note where Zoho handles data, Saudi commercial-law bilingual-financial-statement note, recency footer.

6. **Sanity review with Rabih.** Show before/after + regenerated article. If he says "still feels generic", the feedback target is Strategist's `argument` step.

---

## Open questions for Rabih

1. **Per-claim citation cost.** Round 9 (fact verification) adds real latency and token cost — potentially 2-3x today's generation cost. Acceptable?
2. **Footnote rendering.** `[^1]` citations need a component in the Next.js article template. Do we have one, or design one in the visual phase we just completed?
3. **Saudi relevance classifier.** For topics like "Best CRM" without "Saudi" in the string, default `relevance=medium` (force some Saudi angle) or `relevance=low` (skip it)? I lean medium because the host site is Saudi-focused.
4. **Rating rubric.** Scores currently come from the architect with no traceable method. Options: (a) remove scores entirely; (b) define a 5-dimension rubric (ZATCA, Arabic, mada-recon, pricing, ecosystem) and compute; (c) replace scores with qualitative verdicts ("no-compromise choice", "tolerate for X").

---

## Decisions (2026-04-21)

1. **Round 9 fact verification:** FULL — every high-stakes record (prices, regulations, compliance dates, ratings) re-verified against its source URL and cross-queried for disagreements. Accept the 2-3x cost.
2. **Footnote rendering:** Design a new `Footnote` + `FootnoteList` Next.js component. Added as File 15 in the change list.
3. **Saudi relevance default:** `medium` when topic string carries no Saudi cue. Every article weaves in at least: one SAR figure where a price is discussed, one local vendor mention if the ecosystem has one, one regulatory note if applicable (PDPL for data-handling SaaS, ZATCA for anything invoicing-adjacent, SAMA for anything payment-adjacent).
4. **Ratings:** Compute from a 5-dimension public rubric. Dimensions per article type:
   - For Saudi-software rankings: ZATCA/compliance (0-5) + Arabic UX (0-5) + local payments reconciliation (0-5) + pricing transparency (0-5) + ecosystem fit (0-5). Sum / 5 = displayed score. Rubric table rendered publicly above the comparison table so readers can reproduce the math.
   - For non-Saudi topic rankings: substitute domain-appropriate dimensions (e.g., CRM global → sales features, integration breadth, pricing transparency, onboarding experience, ecosystem).
   - Architect agent no longer invents scores; Strategist computes them from evidence-bank records tagged per dimension.

### Amended file list

| # | File | One-line reason |
|---|---|---|
| 15 | `src/components/article/Footnote.tsx` + `FootnoteList.tsx` **(new)** | Renders `[^id]` citations as numbered superscript with scroll-to-footnote; source URL + verified-date in footnote list |
| 16 | `src/styles/footnote.css` **(new)** | Styling per project BEM conventions |
| 17 | `agents/article-architect.md` | Remove score-invention; Architect produces per-section rubric-dimension map so Strategist can compute |

---

## Amendment (2026-04-21, post CLAUDE.md review)

The project's CLAUDE.md Prime Directives (Extend-don't-Replace, Protect pipeline sequence, Test-before-ship on 0% baseline) required three adjustments.

### Revised architecture

**Before amendment:** 6 new top-level agents, pipeline sequence reordered, draft-writer Phase B gutted, orchestrator-level loop.

**After amendment:** 4-agent pipeline preserved. Additions land INSIDE existing agents.

```
project-analyzer  →  research-engine (9 rounds)  →  article-architect  →  draft-writer
                                                      │                      │
                                                      └── Phase 3:           └── Phase B:
                                                          Strategist             per-section sub-pipeline
                                                          (new)                  spawns subagents:
                                                                                   section-writer
                                                                                   saudi-localizer
                                                                                   fact-checker
                                                                                   quality-reviewer
                                                                                 loop per section, max 3 retries
                                                                                 falls back to legacy Phase B
                                                                                 if exhausted
```

- **No new top-level pipeline slot.** The 4-agent order in SKILL.md is untouched.
- **Strategist** = new Phase 3 of article-architect.md. Architect keeps its Phase 1 (concepts) and Phase 2 (architecture). Phase 3 emits per-section `{argument, evidence_ids[], decision_takeaway, rubric_dimensions}` JSON.
- **Section-writer, saudi-localizer, fact-checker, quality-reviewer** = subagent files. Draft-writer spawns them per section via the Task tool. Subagent files live at `agents/subagents/` to signal they are not top-level pipeline stages.
- **Draft-writer Phase B** — refactored in-place with legacy path preserved. New behavior: orchestrate the 4 subagents per section with retry-at-80 rubric. If a section exhausts 3 attempts, fall back to the original Phase B monolithic-call behavior for that section and flag it for human review in the delivery report. Phases A, C, D, E, F, G-K are byte-identical.

### Revised file list (15 files)

| # | File | Change type | Reason |
|---|---|---|---|
| 1 | `agents/research-engine.md` | extend | 6 to 9 rounds; require source_url/verified_date/confidence on every evidence record |
| 2 | `engine/evidence-schema.js` | new | Canonical evidence-record shape (zero-dep, per CLAUDE.md rule 6) |
| 3 | `agents/article-architect.md` | extend | Add Phase 3 (Strategist) producing per-section argument + decision_takeaway + evidence_ids + rubric dimensions. Phases 1/2 unchanged |
| 4 | `agents/subagents/section-writer.md` | new | Writes ONE section using strategist entry + evidence subset |
| 5 | `agents/subagents/saudi-localizer.md` | new | Enforces regulatory + vendor + SAR + geography signals per section at relevance >= medium |
| 6 | `agents/subagents/fact-checker.md` | new | Converts [ev-id] tags to [^ev-id] footnotes; rejects on missing evidence |
| 7 | `agents/subagents/quality-reviewer.md` | new | Per-section 0-100 rubric; reject-at-80 with failure_type routing |
| 8 | `agents/draft-writer.md` | extend | Phase B refactored to spawn subagents per section; legacy monolithic path preserved as fallback. Phases A, C-K unchanged |
| 9 | `config/banned-patterns.md` | extend | Add soft-generics (best-in-class, world-class, unmatched, genuinely, ...) with number/citation-paired exceptions |
| 10 | `engine/quality-gate.js` | extend | Add final-article regression checks: source_presence_pct, saudi_signal_density, generic_phrase_count, decision_clarity_present |
| 11 | `skills/article-engine/modules/pipeline.md` | update | Document Phase 3 of architect and the per-section sub-pipeline inside draft-writer Phase B |
| 12 | `tests/content-quality/*.test.js` | new | node:test coverage per new agent + golden snapshot of Zoho rewrite. Every new code path ships with tests (per Q1 decision) |
| 13 | `tests/fixtures/evidence-bank.sample.json` | new | 30-50 records for Saudi-accounting topic |
| 14 | `src/components/article/Footnote.tsx` + `FootnoteList.tsx` | new (nextiva site) | Renders `[^id]` citations with scroll-to-footnote behavior |
| 15 | `src/styles/footnote.css` | new (nextiva site) | BEM styling per Nextiva project conventions |

### Session protocol compliance

Per CLAUDE.md section 5, before code I will also read:
- `dev_docs/orchestrator-state.json`
- `dev_docs/handoff.md`
- `dev_docs/STATUS.md`
- `dev_docs/enhancement-backlog.md` (Tier 1 section)

If any of these reveals blocking P0 work that shouldn't wait, I will pause and flag.
