# Persona 01: Enterprise Editor-in-Chief

## Nadia Al-Rashidi — Editor-in-Chief, Asharg (SRMG)

---

## 1. Who I Am

I am Nadia Al-Rashidi, Editor-in-Chief at Asharg, a flagship digital news property under the Saudi Research and Media Group (SRMG). I have been in editorial leadership for 14 years, the last 4 at Asharg. I manage a team of 40+ writers, 6 section editors, 3 copy editors, and 2 SEO specialists. My technical level is low-to-moderate — I can navigate a CMS, read a basic analytics dashboard, and evaluate SEO recommendations, but I do not write code, configure APIs, or manage integrations myself. I have an IT team for that.

My team publishes over 300 articles per week, almost entirely in Arabic. We cover politics, economics, culture, technology, and opinion. I report directly to the CEO of SRMG Digital, and my KPIs are audience growth, time on site, returning visitors, and editorial quality scores from our internal review board.

I am not an SEO person. I am a journalist. I care about truth, narrative quality, and the voice of our publication. SEO is a necessary discipline, but it is not my passion — it is a constraint I must satisfy while maintaining editorial standards.

---

## 2. My Daily Workflow

**6:30 AM** — I review overnight analytics. Google Analytics 4 tells me what performed, what underperformed, and where traffic came from. I check Search Console for any indexing issues or sudden drops.

**7:00 AM** — Editorial standup with section editors. We review the day's publishing calendar (managed in a shared Google Sheet, because our CMS editorial calendar is inadequate). Each editor presents their 8-12 pieces for the day.

**7:30 AM** — I review the SEO recommendations our two SEO specialists have prepared. They use Semrush (English-biased) and manually translate keyword research into Arabic editorial briefs. This process is slow and lossy — meaning gets distorted in translation.

**8:00-12:00 PM** — I review drafts. I am reading 15-25 articles per day for voice, accuracy, and editorial alignment. I flag pieces that sound generic or robotic. Since some writers have started using AI tools on their own, I now spend significant time detecting and rejecting AI-generated content that does not match our voice.

**12:00-1:00 PM** — I meet with the SEO team to review this week's content performance versus targets. We compare our output against competitors like Al Arabiya and Al Jazeera using manual spreadsheet tracking.

**1:00-3:00 PM** — Strategic planning. I work on monthly editorial themes, coordinate with the marketing team on branded content, and review proposals from freelance contributors.

**3:00-5:00 PM** — Second round of draft reviews, final approvals for next-day publishing, and resolving editorial disputes between writers and SEO specialists (these are constant — writers feel SEO demands compromise their voice; SEO specialists feel writers ignore their recommendations).

**5:00 PM** — I review the next day's schedule and flag any gaps.

---

## 3. My Top 5 Pain Points

1. **Every SEO tool we use is English-first.** Semrush keyword data for Arabic is sparse, unreliable, and often reflects transliterated English queries rather than how Arabic speakers actually search. My SEO team spends half their time compensating for tools that were not built for our language.

2. **AI content detection is now part of my job.** Writers are using ChatGPT and other tools without telling me. The output sounds flat, generic, and un-Asharg. I have no systematic way to detect this or enforce our voice guidelines at scale. I am reading 20+ articles a day, and my eyes are not a scalable quality filter.

3. **The editorial-SEO conflict is destroying my team's morale.** Writers feel their craft is being reduced to keyword stuffing. SEO specialists feel ignored. I am mediating this conflict daily instead of doing strategic work. I need a tool that bridges this gap — that gives writers SEO guidance in a way that feels editorial, not mechanical.

4. **Our content intelligence is manual and backward-looking.** We know what performed last month. We do not know what to write next week. Our "content strategy" is a combination of gut instinct, competitor monitoring, and reactive trending-topic chasing. I need forward-looking intelligence — what topics are rising, what gaps exist, what our audience is searching for that we are not covering.

5. **Publishing at scale means quality variance is enormous.** With 300+ articles per week, some are excellent and some are mediocre. I cannot personally review everything. I need automated quality guardrails that catch the worst offenders before they publish — not as a replacement for editorial judgment, but as a first-pass filter.

---

## 4. My Deal-Breakers

- **Full Arabic language support is non-negotiable.** Not "we support Arabic" with translated UI and English-trained models. I mean Arabic-native NLP: understanding morphology, dialectal variation, proper RTL rendering, and Arabic SEO keyword intelligence. If the content intelligence layer thinks in English and translates to Arabic, I will know immediately, and I will not use it.

- **Voice cloning that actually works for Arabic editorial prose.** If ChainIQ cannot learn the difference between our politics desk voice and our culture desk voice — in Arabic — it is useless to me.

- **Editorial control and override.** I will never adopt a system that publishes without human approval. Every piece must pass through an editor before it goes live. The tool must enhance my team's workflow, not replace it.

- **Integration with our CMS.** We run a custom CMS built on a headless architecture. If ChainIQ only supports WordPress and Shopify, it does not serve us.

- **Data privacy and content ownership.** SRMG is a major media group. Our unpublished content, editorial strategy, and audience data cannot be used to train models or shared with competitors. I need contractual guarantees and technical architecture that ensures this.

---

## 5. My Feature Priority Rankings

| Feature Area | Score (1-10) | Rationale |
|---|---|---|
| Data Ingestion (GSC/GA4/Semrush/Ahrefs) | 7 | Important, but only if Arabic data quality is high |
| Content Intelligence | 10 | This is the core value proposition for me — knowing what to write |
| Voice Intelligence | 10 | Without this, the output is generic AI slop I will reject |
| Article Generation | 6 | Useful for first drafts and briefs, but my writers must own the final product |
| Universal Publishing | 8 | Must work with our custom CMS or it is worthless |
| Quality Assurance | 9 | Automated quality gates would save me 2-3 hours per day |
| Performance Tracking | 7 | We already have GA4 and internal dashboards; incremental value only |
| Dashboard/Admin | 6 | Nice to have, not a driver of my decision |
| CMS Integration | 9 | See Universal Publishing — this is make-or-break for enterprise |
| API & Developer Experience | 5 | My IT team cares about this, not me directly |

---

## 6. My Wish List

1. **Given** I am planning next week's editorial calendar, **When** I open the Content Intelligence dashboard, **Then** I expect to see a prioritized list of Arabic-language topic opportunities ranked by search demand, competition gap, and alignment with our editorial verticals — not a generic keyword list.

2. **Given** a writer submits a draft, **When** the QA layer analyzes it, **Then** I expect a voice consistency score that tells me how closely it matches our publication's established tone, with specific passages flagged that deviate — in Arabic, with Arabic-appropriate stylistic analysis.

3. **Given** I need to publish 50 articles this week across 6 sections, **When** I use the generation pipeline, **Then** I expect it to produce section-appropriate briefs (not articles) that my writers can develop — each brief reflecting the voice, angle, and depth appropriate to that section.

4. **Given** an article was published 30 days ago, **When** I check the feedback loop, **Then** I expect to see its organic performance overlaid with actionable recommendations: update the H2 structure, add a section on X emerging subtopic, or consolidate with another underperforming piece.

5. **Given** my SEO team has identified a competitor content gap, **When** they input it into ChainIQ, **Then** I expect the system to generate a content brief that accounts for our editorial standards, not just SEO metrics — including suggested sources, angles that differentiate us from the competitor, and voice guidelines.

---

## 7. Competitor Envy

I envy what Clearscope does for English-language publishers — the way it gives writers a real-time content grade while they write, showing them how to improve without making them feel like they are writing for a robot. But Clearscope does not work in Arabic. If ChainIQ could deliver that experience natively in Arabic, with the same simplicity, it would be transformative for my team.

I also look at how Bloomberg uses internal AI tools to assist their newsroom — not replacing journalists, but giving them data-driven starting points. That editorial-first philosophy, applied to Arabic content at scale, is what I am looking for.

---

## 8. If I Could Change ONE Thing

Eliminate the translation layer between SEO intelligence and Arabic editorial execution. Today, every insight my SEO team produces starts in English and gets manually adapted to Arabic. This is slow, lossy, and creates friction between teams. If content intelligence were Arabic-native from the start — if the system understood Arabic search behavior, Arabic content structure, and Arabic editorial conventions without going through English first — it would cut our content planning time in half and eliminate 80% of the editorial-SEO conflict.

---

## 9. What Would Make Me Evangelize

If ChainIQ could demonstrably improve the quality consistency of our output — not just the volume, but the quality — while reducing the time my editors spend on review, I would champion it across all SRMG properties. Specifically: if our voice consistency scores improved measurably, if our SEO performance increased without editorial compromise, and if my writers reported that the tool helped them rather than constrained them. If I saw my writers voluntarily using it (rather than resenting it), I would present it at every media industry conference I attend. The Arabic media market is underserved by content technology, and whoever solves this well will earn deep loyalty from every major Arabic publisher.

---

## 10. Red Flags

- **Arabic as an afterthought.** If I see that the Arabic experience is clearly a localized version of an English product — with awkward translations, English-style heading suggestions, or keyword data that is obviously transliterated — I will lose trust immediately and permanently.

- **"AI-generated content" positioning.** If ChainIQ markets itself as a way to replace writers with AI, my entire editorial team will revolt, and I will be the one leading the revolt. The positioning must be augmentation, not replacement.

- **Poor data isolation.** If I learn that our content or strategy data is being used to improve the product for competitors, or if there is any breach of our editorial IP, the relationship is over and legal action follows.

- **Overpromising on quality.** If the demo shows beautiful English output and then the Arabic output is noticeably worse, I will assume the team does not take Arabic seriously and will not trust their roadmap promises.

- **No human-in-the-loop option.** If the platform is designed for autonomous publishing with human review as an optional add-on rather than the default, it signals a fundamental misunderstanding of enterprise editorial workflows.
