# Voice Intelligence System — Deep Dive Feature Research

**Layer:** 3 (Voice Intelligence — Writer Detection & Persona Cloning)
**Current State:** 2/10 — The project-analyzer agent (Substep 6) extracts basic writing style from up to 5 samples: sentence rhythm, paragraph length, tone warmth, vocabulary density, readability level, heading style, transition patterns, and anti-robotic rules. This is useful but not systematic — it reads a handful of files, produces a flat profile, and has no concept of multiple writers, AI vs human classification, or statistical rigor. There is no corpus collection, no clustering, no persona management.
**Last Updated:** 2026-03-28
**Analyst:** ChainIQ Product Analysis

---

## 1. Why This Layer Is the Category Definer

The competition matrix is unambiguous: Voice Intelligence is ChainIQ's strongest differentiator. Zero competitors have a dedicated voice intelligence layer. The competitive landscape:

- **SurferSEO Custom Voice** — The closest competitor. Users paste 200+ words of sample text, and Surfer matches the tone during AI generation. This is configuration, not intelligence. It does not analyze an entire corpus, does not detect multiple writers, does not distinguish AI from human content, and does not create persistent persona profiles.
- **Conductor Content Profiles** — Brand voice guidelines that constrain generation. Manual configuration of tone and compliance rules. No detection or analysis.
- **Frase Brand Voice** — Basic brand voice profiles. No analysis capability.
- **Ahrefs AI Detector** — Detects AI-generated content but does not analyze voice, style, or create writer profiles.

The PROJECT-BRIEF defines a 4-step process (Corpus Collection, AI/Human Classification, Writer Clustering, Persona Generation) that transforms voice from a configuration checkbox into an intelligence system. This is the feature that makes ChainIQ a new category — as stated in the innovation-opportunities analysis: "Every competitor generates content. None understand voice."

For MENA publishers specifically, Arabic voice intelligence is total white space. No tool in any category analyzes Arabic writing style, understands MSA vs dialectal variation, or clones Arabic writer personas.

---

## 2. Industry Standard

There is no industry standard for voice intelligence because the category barely exists. The current landscape:

- **Tone matching** — SurferSEO and basic AI writing tools (Jasper, Writer) allow users to select or describe a tone (professional, casual, authoritative). This is a prompt modifier, not intelligence.
- **Brand guidelines** — Enterprise tools (Conductor, Writer.com) let teams define brand voice rules that constrain AI output. Manual configuration with no detection.
- **AI detection** — Standalone tools (GPTZero, Originality.ai, Copyleaks) and Ahrefs' built-in detector classify content as AI or human. Binary classification only — no voice profiling.
- **Readability scoring** — Hemingway, Grammarly, and built-in CMS tools score readability, sentence complexity, and passive voice. These are editing tools, not voice intelligence.

What does NOT exist anywhere:
- Automatic writer fingerprinting from a corpus of content
- Multi-writer clustering from a mixed-author publication
- AI vs human classification with stylometric evidence (not just perplexity scoring)
- Persistent persona profiles that evolve over time
- Voice match scoring between a draft and a target persona
- Arabic-specific stylometric analysis

ChainIQ has the opportunity to define the standard.

---

## 3. Competitor Analysis in Depth

### SurferSEO — Custom Voice (The Benchmark to Beat)
Surfer's Custom Voice is the only feature in market that attempts voice matching. The workflow: (1) user pastes 200+ words of sample text, (2) Surfer extracts tone characteristics, (3) AI generation matches the extracted tone. Limitations: single sample (not statistically significant), no corpus analysis, no distinction between writers, no AI/human classification, tone-level matching only (not sentence structure, vocabulary richness, argumentation patterns). Additionally, Surfer's Humanizer tool post-processes AI content to reduce AI detection probability — a useful output feature but not voice intelligence.

**Where ChainIQ surpasses this:** ChainIQ analyzes 50-100+ articles per writer, uses 6 stylometric signals for AI/human classification, clusters by natural writer groups using HDBSCAN, and generates persistent persona DNA profiles with quantified metrics (TTR, sentence length variance, hedging frequency, cliche density). This is statistical voice fingerprinting vs a 200-word sample. The depth difference is orders of magnitude.

### Writer.com — Brand Voice Governance
Writer.com positions as the enterprise "AI writing platform with brand governance." Their Voice feature lets teams define custom style rules, terminology, and tone guidelines. AI generation and editing enforce these rules. Limitation: entirely manual — teams must define their voice, not discover it. No analysis of existing content. No multi-writer support. Writer.com is a governance tool, not an intelligence tool.

### Originality.ai / GPTZero — AI Detection Only
These tools classify content as AI-generated using perplexity and burstiness metrics. They answer "is this AI?" but not "who wrote this?" or "what does this writer sound like?" Their detection methods are also brittle — easily defeated by paraphrasing, and they produce false positives on formulaic human writing (e.g., technical documentation, legal text). ChainIQ's stylometric approach (6 signals, not just perplexity) is more robust and produces richer output.

---

## 4. Feature Inventory

| # | Feature | Priority | Complexity | Phase | Description |
|---|---------|----------|------------|-------|-------------|
| 1 | **Corpus Crawler** | CRITICAL | HIGH | 1 | Crawl client site and collect 50-100+ articles. Reuse Layer 1 CMS Crawler output but extend with full-text extraction. Strip HTML, preserve paragraph structure. Associate each article with author name (from byline, meta author tag, or CMS API author field). |
| 2 | **Text Extraction Pipeline** | CRITICAL | MEDIUM | 1 | Clean text extraction from raw HTML. Remove navigation, sidebar, ads, comments, related posts. Preserve paragraph boundaries, heading structure, list formatting. Port metadata-extractor.ts logic from old-seo-blog-checker. Output: clean text per article with structural markers. |
| 3 | **AI vs Human Classification — Sentence Length Variance** | CRITICAL | MEDIUM | 1 | Calculate standard deviation of sentence lengths per article. Human writing: high variance (mix of 5-word punchy sentences and 30-word complex ones). AI writing: low variance (clustered around 15-20 words). Threshold-based classification with confidence score. |
| 4 | **AI vs Human Classification — Vocabulary Richness (TTR)** | CRITICAL | MEDIUM | 1 | Type-Token Ratio: unique words / total words. Human writers use more varied vocabulary. AI defaults to common synonyms and repetitive phrasing. Calculate per 500-word window (TTR is sensitive to text length). Higher TTR = more likely human. |
| 5 | **AI vs Human Classification — Hedging Detection** | CRITICAL | LOW | 1 | Count frequency of hedging phrases: "it's worth noting", "it's important to mention", "it should be noted", "arguably", "it goes without saying". High frequency is a strong AI signal. Pattern matching against a curated list of 50+ hedging phrases. |
| 6 | **AI vs Human Classification — Cliche Density Scoring** | CRITICAL | LOW | 1 | Count frequency of AI-associated cliches: "delve", "landscape", "leverage", "navigate", "foster", "streamline", "in today's fast-paced world", "game-changer". Normalized per 1000 words. Curated list of 100+ AI cliche patterns. |
| 7 | **AI vs Human Classification — Paragraph Rhythm Analysis** | HIGH | MEDIUM | 1 | Measure paragraph length variance. AI produces uniform 3-4 sentence blocks. Human writers vary paragraph length based on thought flow (single-sentence emphasis paragraphs, long multi-sentence arguments). Standard deviation of sentences-per-paragraph as signal. |
| 8 | **AI vs Human Classification — Em-Dash Frequency** | HIGH | LOW | 1 | Count em-dash usage per 1000 words. AI models (especially Claude and GPT) use em-dashes at 3-5x human frequency. Simple regex count. Useful as a supporting signal, not standalone. |
| 9 | **Composite AI/Human Score** | CRITICAL | MEDIUM | 1 | Combine all 6 signals into a weighted composite score. Classify each article as HUMAN (>70% confidence), HYBRID (40-70%), or AI-GENERATED (<40% human confidence). Store classification with evidence per signal. Per-article and per-author aggregation. |
| 10 | **HDBSCAN Writer Clustering** | HIGH | HIGH | 2 | Using HUMAN-classified articles only, extract feature vectors: sentence structure patterns, tone markers, formality level, vocabulary fingerprint, analogy usage, humor frequency, technical depth. Run HDBSCAN clustering to find natural writer groups. No need to predefine cluster count — HDBSCAN discovers it. Per PROJECT-BRIEF spec. |
| 11 | **Persona DNA Generation** | CRITICAL | HIGH | 2 | For each writer cluster, generate a structured persona profile: voice description, cadence metrics (avg sentence length, variance), structural patterns (openers, closers, section rhythm), vocabulary characteristics (TTR, unique phrases), avoidance patterns, humor profile, reference article URLs. This is the "Writer DNA" that feeds into the draft-writer agent. |
| 12 | **Voice Profile JSONB Schema** | HIGH | MEDIUM | 1 | Define the Supabase schema for persona storage. JSONB column for flexible profile data. Fields: persona_name, voice_description, cadence (avg_sentence_length, variance), structure (opening_pattern, section_rhythm), vocabulary (ttr, signature_phrases, avoided_terms), humor_profile, formality_score, reference_urls, article_count, confidence_score. Versioned for evolution tracking. |
| 13 | **Draft-Writer Voice Constraints** | CRITICAL | MEDIUM | 2 | Modify the draft-writer agent prompt to accept a persona DNA profile as a style constraint. The constraint must be specific and quantified — not "write conversationally" but "average sentence length 14.2 words, variance 8.3, open with real-world scenarios, avoid passive voice and hedging phrases, TTR target 0.72." |
| 14 | **Voice Match Scoring** | HIGH | HIGH | 2 | After generation, score the draft against the target persona profile. Calculate stylometric distance: difference in sentence length distribution, TTR, hedging frequency, cliche density, paragraph rhythm. Score: 0-100. Below threshold triggers auto-revision with specific guidance. |
| 15 | **AI Detection Probability Scoring** | HIGH | MEDIUM | 2 | Run the same 6-signal analysis on generated content. Score: probability that AI detectors will flag this content. If probability is high, trigger humanization pass with specific guidance (increase sentence length variance, reduce hedging, add vocabulary richness). E-E-A-T compliance signal. |
| 16 | **Multi-Language Stylometrics** | MEDIUM | HIGH | 3 | Adapt all 6 signals for non-English languages. Sentence length distributions vary by language. Vocabulary richness thresholds differ. Hedging and cliche patterns are language-specific. Priority: Arabic, then other supported languages (11 total in current system). |
| 17 | **Arabic-Specific Analysis — MSA vs Dialectal** | HIGH | HIGH | 2 | Detect whether articles use Modern Standard Arabic (formal, news/academic), dialectal Arabic (regional, conversational), or a hybrid. Key signals: morphological complexity (MSA uses full case endings), lexical choice (dialect-specific vocabulary), code-switching patterns. Critical for MENA publishers where different sections of a publication may use different registers. |
| 18 | **Arabic-Specific Analysis — Formality Scoring** | HIGH | HIGH | 2 | Arabic has a more granular formality spectrum than English. Score formality based on: diacritical mark usage (tashkeel), classical rhetorical devices (saj, muqabala), sentence structure complexity, use of connectives (transitional particles). Build an Arabic-specific formality index not available in any existing tool. |
| 19 | **Manual Persona Override** | MEDIUM | LOW | 2 | Allow users to manually create or modify persona profiles. Upload sample text (200+ words, matching Surfer's minimum), or configure persona fields directly. Override auto-detected personas for brand consistency. Essential for cases where auto-detection does not match editorial intent. |
| 20 | **Persona Evolution Tracking** | MEDIUM | MEDIUM | 3 | Track how writer personas change over time. Re-analyze corpus quarterly. Detect: voice drift (gradual change in style), voice convergence (multiple writers becoming similar), voice divergence (a writer developing distinct sub-styles). Alert when persona profiles are stale (>90 days since last analysis). |
| 21 | **A/B Voice Testing** | MEDIUM | HIGH | 3 | Generate the same article in two different writer personas. Publish both (or preview both). Track performance differences at 30/60/90 days via Layer 6. Determine which voice resonates better for specific topics, audiences, or content types. Data-driven voice optimization. |
| 22 | **Brand Voice Guidelines Import** | MEDIUM | LOW | 2 | Import existing brand voice documentation (PDF, DOCX, or plain text). Parse guidelines into persona constraints: approved terminology, forbidden terms, tone rules, formatting preferences. Merge with auto-detected personas to create hybrid profiles that respect both detected voice and brand rules. |
| 23 | **Writer Portfolio Dashboard** | MEDIUM | MEDIUM | 2 | Dashboard page showing: all detected writers, their persona profiles, article counts, AI/human classification distribution, voice consistency scores. Per-writer drill-down with sample articles and stylometric charts. |
| 24 | **Persona Assignment Engine** | HIGH | MEDIUM | 2 | When Mode B recommends a topic, automatically suggest the best-matched persona. Match logic: topic-persona affinity (which writers historically write about this topic), tone appropriateness (technical topics get technical voices), performance correlation (which voice performs best for this content type via Layer 6 feedback). |
| 25 | **Voice Consistency Scoring** | MEDIUM | MEDIUM | 2 | Score how consistent a writer's voice is across their portfolio. High consistency = reliable persona. Low consistency = writer may have multiple sub-styles or may have changed over time. Flag low-consistency writers for manual review before persona cloning. |

---

## 5. Quick Wins

1. **AI/Human Classification (4 signal subset)** — Sentence length variance, TTR, hedging detection, and cliche density can be implemented with pure text analysis. No external APIs, no ML models, no NLP libraries. Regex + math. Immediately valuable for publishers who want to audit their content portfolio for AI contamination.
2. **Voice Profile JSONB Schema** — Define the Supabase schema now. This is the contract between the voice analyzer and the draft-writer. Even before full clustering, manually created profiles can be stored here and used for generation.
3. **Draft-Writer Voice Constraints** — Modify the existing draft-writer agent prompt to accept a persona profile. Currently, the project-analyzer's Substep 6 output is a flat style model. Enriching this with quantified metrics (TTR target, sentence length stats) immediately improves generation quality.
4. **Manual Persona Override** — Let early adopters create personas manually while auto-detection is being built. Matches Surfer's workflow (paste 200+ words) but stores in a richer schema.
5. **Hedging + Cliche Pattern Lists** — Curate the 50+ hedging phrases and 100+ AI cliche patterns. These lists are valuable across multiple features (classification, voice matching, humanization guidance, quality gate).

---

## 6. Recommended Phases

### Phase 1: Classification Foundation (Weeks 1-3)
- Corpus Crawler (extend Layer 1 CMS Crawler with full-text extraction)
- Text Extraction Pipeline (port metadata-extractor.ts)
- AI vs Human Classification — all 6 signals
- Composite AI/Human Score (HUMAN/HYBRID/AI-GENERATED)
- Voice Profile JSONB Schema (Supabase migration)
- Manual Persona Override (user-created profiles)
- Draft-Writer Voice Constraints (prompt modification)

### Phase 2: Intelligence Layer (Weeks 4-7)
- HDBSCAN Writer Clustering
- Persona DNA Generation (automated persona profiles)
- Voice Match Scoring (post-generation quality check)
- AI Detection Probability Scoring
- Persona Assignment Engine (topic-to-voice matching)
- Arabic-Specific Analysis — MSA vs Dialectal detection
- Arabic-Specific Analysis — Formality scoring
- Brand Voice Guidelines Import
- Writer Portfolio Dashboard
- Voice Consistency Scoring

### Phase 3: Optimization & Evolution (Weeks 8-10)
- Multi-Language Stylometrics (Arabic first, then other 10 languages)
- Persona Evolution Tracking (quarterly re-analysis, drift detection)
- A/B Voice Testing (dual-persona generation + performance comparison)
- Voice performance correlation with Layer 6 data

---

## 7. Integration Requirements

### Upstream Dependencies
- **Layer 1 (Data Ingestion)** — CMS Crawler output provides the article corpus with URLs, author attribution, and publish dates. Content Inventory provides the URL-to-metadata mapping. Without Layer 1, corpus collection requires a standalone crawl (more expensive, redundant work).
- **Existing project-analyzer agent** — Substep 6 (Writing Style Extraction) provides the current baseline. The Voice Intelligence system replaces and extends this with systematic, multi-writer, statistically rigorous analysis.

### Downstream Consumers
- **Layer 4 (Generation Pipeline)** — The draft-writer agent receives persona DNA profiles as style constraints. The article-architect may also use persona information to select appropriate content structures (e.g., "The Technical Storyteller" persona implies more analogy-driven structure).
- **Layer 4 (Quality Gate)** — Voice match scoring is a quality signal. The 7-signal quality gate (defined in PROJECT-BRIEF) should include voice consistency as one dimension.
- **Layer 6 (Feedback Loop)** — A/B voice testing results feed back into persona optimization. Performance data by persona enables data-driven voice selection.

### Existing Code to Extend
- `agents/project-analyzer.md` (Substep 6) — Current writing style extraction reads 5 samples and produces a flat profile. This becomes the fallback when full voice intelligence is unavailable (new client, insufficient corpus).
- `agents/draft-writer.md` — Must accept persona DNA profile as structured input, not just general tone guidance.
- `bridge/server.js` — Add endpoints: `/api/voice/analyze` (trigger corpus analysis), `/api/voice/personas` (CRUD persona profiles), `/api/voice/classify` (AI/human classification for specific URLs), `/api/voice/match` (score draft against persona).
- `old-seo-blog-checker/lib/metadata-extractor.ts` — Port HTML-to-clean-text extraction for the text extraction pipeline.

### New Supabase Tables
- `voice_corpus` — Full-text content per article with author attribution, AI/human classification, signal scores.
- `voice_personas` — Persona DNA profiles (JSONB). Versioned for evolution tracking. Fields per Voice Profile JSONB Schema.
- `voice_clusters` — HDBSCAN cluster metadata: centroid features, member article IDs, cluster quality score.
- `voice_match_scores` — Per-generation voice match results: target persona, stylometric distance per signal, composite score.

### Technical Considerations

**HDBSCAN Implementation:** HDBSCAN is a Python library (hdbscan). The bridge server is zero-npm-deps Node.js. Options: (1) Shell out to a Python script for clustering (acceptable for a batch job that runs once per corpus analysis), (2) Port a simplified clustering algorithm to JavaScript, (3) Use Claude/Gemini for cluster identification from feature vectors (LLM-as-clustering-engine, less rigorous but zero-dependency). Recommendation: Option 1 for accuracy, with option 3 as fallback for environments without Python.

**Stylometric Feature Extraction:** All 6 AI/human signals are implementable in pure JavaScript with no dependencies. Sentence splitting (regex), word tokenization (split on whitespace/punctuation), TTR calculation (Set size / array length), pattern matching (regex for hedging/cliches). No NLP library required for English. Arabic will require morphological analysis — consider using an Arabic tokenizer service or LLM-based tokenization.

**Performance:** Corpus analysis (50-100 articles) is a batch job, not real-time. Run as a background job via existing JobQueue. Expected time: 2-5 minutes for full analysis. Cache results in Supabase. Re-run on demand or on schedule.

---

## 8. The Voice Intelligence Pipeline in Detail

```
INPUT: Client Site URL (triggered on site connection or on demand)

Step 1: Corpus Collection
  └─ Read content_inventory from Layer 1 (or run standalone crawl)
  └─ Filter: published articles only, exclude category/tag pages
  └─ Extract full text per article (text extraction pipeline)
  └─ Associate with author name where available
  └─ OUTPUT: Corpus of 50-100+ clean text documents with metadata

Step 2: AI vs Human Classification
  └─ For each article, compute 6 stylometric signals
  └─ Calculate composite score
  └─ Classify: HUMAN / HYBRID / AI-GENERATED
  └─ OUTPUT: Classification per article with per-signal evidence

Step 3: Writer Clustering (HUMAN articles only)
  └─ Extract feature vectors from human-classified articles
  └─ Run HDBSCAN clustering
  └─ OUTPUT: Writer clusters with member articles

Step 4: Persona DNA Generation
  └─ For each cluster, compute aggregate stylometric profile
  └─ Generate natural-language voice description via LLM
  └─ Name the persona (LLM-generated descriptive name)
  └─ OUTPUT: Persona DNA profiles stored in voice_personas table

Step 5: Persona Assignment (on article generation)
  └─ Match recommended topic to best-fit persona
  └─ Inject persona DNA into draft-writer prompt
  └─ OUTPUT: Voice-constrained generation

Step 6: Voice Match Scoring (post-generation)
  └─ Run stylometric analysis on generated draft
  └─ Calculate distance from target persona profile
  └─ Score: 0-100
  └─ If below threshold: trigger revision with specific guidance
  └─ OUTPUT: Voice quality score + revision guidance if needed
```

---

## 9. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Insufficient corpus (<50 articles) for new/small clients | Clustering fails, weak personas | HIGH | Fallback to project-analyzer Substep 6 (5-sample analysis). Manual persona override. Minimum threshold warning in UI. |
| AI/human classification false positives on formulaic human writing | Misclassified technical docs, legal content | MEDIUM | Use composite scoring (6 signals, not just one). Allow manual reclassification. Calibrate thresholds per content vertical. |
| HDBSCAN produces poor clusters for mixed-style publications | Personas don't map to real writers | MEDIUM | Allow manual cluster refinement. Provide cluster visualization. Fall back to single-persona mode. |
| Arabic stylometric signals need different thresholds | English-trained signals misfire on Arabic | HIGH | Build Arabic-specific calibration dataset. Partner with Arabic linguists. Test extensively with SRMG content. |
| LLM-generated content evolves (new models, new patterns) | Classification accuracy degrades over time | MEDIUM | Regularly update hedging/cliche pattern lists. Retrain classification thresholds quarterly. Monitor false positive rate. |
| Voice match scoring too strict | Excessive revision loops, slow generation | LOW | Configurable threshold per client. Start lenient, tighten based on feedback. |

---

## 10. The Arabic Voice Intelligence Opportunity

Arabic voice intelligence deserves special attention as a total white space opportunity (0/9 competitors, per competition matrix).

**Unique Arabic Challenges:**
- **MSA vs Dialectal spectrum** — Arabic writing ranges from formal MSA (news, academic) to colloquial dialect (social media, lifestyle content). Detecting where a writer sits on this spectrum is itself a voice signal.
- **Morphological richness** — Arabic words carry more information per token (root system, pattern templates, clitics). TTR calculation must account for morphological variants of the same root.
- **Diacritical marks (tashkeel)** — Usage of vowel marks is a formality signal. Full tashkeel = highly formal. No tashkeel = modern informal. Partial tashkeel = disambiguation only.
- **Rhetorical traditions** — Arabic prose has classical rhetorical patterns (saj/rhymed prose, muqabala/antithesis, tibaq/contrast) that mark sophisticated writers. Detecting these creates a formality and skill dimension unique to Arabic.
- **Bidirectional text handling** — Voice analysis must correctly handle mixed Arabic/English text, numbers, and technical terms within Arabic prose.

**Strategic Value:** Any MENA publisher using ChainIQ gets Arabic voice intelligence that literally does not exist anywhere else. This is the feature that closes enterprise deals with SRMG, Asharg, and similar media groups. It is not an add-on — it is the killer feature for the primary target market.
