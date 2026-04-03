# Persona 05: David Park — Technical SEO Lead

---

## 1. Who I Am

My name is David Park. I'm the Technical SEO Lead at BrightPath Digital, a 50-person digital marketing agency based in Austin, Texas. I've been in SEO for 11 years — started as a junior analyst doing keyword research in spreadsheets, worked my way through enterprise in-house roles, and landed here about 4 years ago to build out the technical SEO practice from scratch.

My team is 6 people: 3 technical SEO analysts, 2 content strategists, and 1 data engineer who helps me maintain our Python-based reporting pipelines. I report to the VP of Strategy but I operate with significant autonomy. My technical level is advanced — I write Python scripts daily, I'm comfortable with BigQuery, I can read JavaScript well enough to audit rendered DOM issues, and I've built custom Looker Studio dashboards connected to GSC and GA4 APIs.

I'm the person the agency calls when a client's organic traffic drops 30% overnight. I'm the one who figures out whether it's a core update, a technical crawl issue, a cannibalization problem, or a content decay situation. I live in data.

---

## 2. My Daily Workflow

My typical day starts at 7:30 AM checking GSC performance reports across our 14 active client accounts. I have a Python script that pulls daily impressions, clicks, CTR, and average position into a BigQuery dataset so I can trend things over time without relying on GSC's 16-month data window.

By 8:30 AM, I'm in Screaming Frog running crawls on any sites where I've noticed anomalies. I check for new 404s, redirect chains, canonical issues, orphan pages, and indexation problems. I cross-reference Screaming Frog output with GSC's Index Coverage reports.

Mid-morning I'm typically in Ahrefs or Semrush looking at competitive gap data — which keywords are competitors ranking for that we're not targeting, which of our pages are losing ground, and where content opportunities exist. I export these into my analysis spreadsheets and Python notebooks.

After lunch, I work on client deliverables — technical audit reports, content briefs based on SERP analysis, or internal linking recommendations backed by PageRank flow modeling. Every recommendation I make comes with data. If I can't show the numbers behind why we should do something, I don't recommend it.

Late afternoon is code time. I maintain a library of Python scripts that automate GSC data pulls, log file analysis, internal link graph analysis, and content performance scoring. I also maintain our agency's custom content scoring model that weights factors like topical authority, keyword coverage, content freshness, and SERP feature alignment.

---

## 3. My Top 5 Pain Points

**Pain Point 1: AI content tools are black boxes.** Every AI content tool I've evaluated gives me a "content score" or "optimization score" with zero transparency into how it's calculated. I've tested articles that scored 95/100 in these tools and ranked nowhere. If I can't see the raw signals — search volume, SERP intent distribution, entity coverage, competitor content structure — I can't trust the output.

**Pain Point 2: Data stitching across tools is brutal.** I spend 15+ hours per month manually joining data from GSC, GA4, Ahrefs, Semrush, and Screaming Frog. Every tool has its own URL normalization, its own keyword classification, its own metric definitions. Building a unified view of content performance requires custom ETL pipelines that break every time an API changes.

**Pain Point 3: Content recommendations without SERP context are useless.** Most tools tell me "write about X keyword" without analyzing what's actually ranking. Is the SERP dominated by product pages? Listicles? Long-form guides? Video carousels? If the tool doesn't understand SERP intent and format, its recommendations are noise.

**Pain Point 4: No programmatic access means no integration.** If a tool doesn't have an API, it doesn't exist for me. I'm not going to log into another dashboard to copy-paste data. My workflows are automated. Any tool that wants to fit into my stack needs REST API endpoints with proper documentation, rate limits I can work with, and data export in JSON or CSV.

**Pain Point 5: Hallucinated data destroys trust.** I've seen AI tools present "search volume" numbers that don't match any data source I can verify. I've seen "competitor analysis" that references pages that don't exist. One strike and I'm done. If I catch fabricated data once, the entire tool is dead to me because I can never trust any output again.

---

## 4. My Deal-Breakers

- **Full API access** with documented endpoints, authentication, rate limits, and schema definitions. No API, no deal.
- **Raw data exposure** — I need to see the underlying data points behind every recommendation and score. Show me the GSC queries, the SERP features, the competitor URLs, the entity lists.
- **Data source attribution** — every data point must be traceable to its origin (GSC, Ahrefs, Semrush, etc.) with timestamps.
- **No fabricated metrics** — if the tool generates a score, the formula must be documented and auditable.
- **Bulk export capability** — I need to be able to pull all recommendations, scores, and underlying data into my own systems for further analysis.

---

## 5. My Feature Priority Rankings

| Feature Area | Score (1-10) | Rationale |
|---|---|---|
| Data Ingestion | 10 | This is everything. If the data layer is wrong, nothing else matters. |
| Content Intelligence | 9 | This is why I'd use the platform — data-driven content recommendations. |
| Voice Intelligence | 3 | Not my domain. Writers handle voice. I handle data. |
| Article Generation | 2 | I don't trust AI-generated content. I trust AI-generated recommendations backed by data. |
| Universal Publishing | 2 | Not relevant to my workflow. |
| Quality Assurance | 8 | Only if QA means data validation — checking content against SERP signals, not grammar checks. |
| Performance Tracking | 10 | Post-publish performance tracking tied back to pre-publish recommendations is the holy grail. |
| Dashboard/Admin | 5 | I'd rather use the API than a dashboard, but my team needs decent UI. |
| CMS Integration | 3 | Not my concern. |
| API & Developer Experience | 10 | Non-negotiable. This is how I interact with any tool. |

---

## 6. My Wish List

1. **As a technical SEO analyst**, I want to query the ChainIQ API for all content recommendations for a given domain, including the raw GSC, Ahrefs, and Semrush data behind each recommendation, so that I can validate them against my own models before passing them to the content team.

2. **As a technical SEO analyst**, I want a documented scoring methodology that explains exactly how content opportunity scores are calculated, including weights for each signal, so that I can evaluate whether the scoring logic aligns with what I know about ranking factors.

3. **As a technical SEO analyst**, I want to pull historical performance data for every article post-publication — including GSC impressions, clicks, and position changes — tied back to the original content recommendations, so that I can measure recommendation accuracy over time.

4. **As a technical SEO analyst**, I want to export all SERP analysis data (intent classification, SERP features, competitor content structure) as structured JSON via API, so that I can feed it into my own analysis pipelines and Looker dashboards.

5. **As a technical SEO analyst**, I want webhook notifications when content performance deviates significantly from projections, so that my team can investigate and recalibrate without manually monitoring dashboards.

---

## 7. Competitor Envy

I've always respected what Clearscope does with their content grading — they show you the exact terms competitors are using, the frequency, and where you stand relative to the SERP average. But even Clearscope doesn't go deep enough. What I really want is something like Clearscope's content analysis combined with Ahrefs' competitive gap data and GSC's real performance signals, all accessible via a single API. If ChainIQ could be the unified data layer that connects content intelligence to actual search performance with full data transparency, that would be genuinely differentiated.

---

## 8. If I Could Change ONE Thing

Give me a single API endpoint that returns, for any target keyword or topic cluster, a complete data package: search volume trends, SERP intent breakdown, SERP feature distribution, top 20 competitor content analysis (word count, headings, entities, internal links), content gap identification, and a transparent opportunity score with a breakdown of how every signal contributes to that score. Right now I spend 3-4 hours assembling that picture manually across 5 tools. If ChainIQ could deliver that in one call, I'd build my entire content strategy workflow around it.

---

## 9. What Would Make Me Evangelize

If I could run a 90-day pilot where I compare ChainIQ's content recommendations against my manual analysis on 20 content briefs, and ChainIQ's recommendations perform equal to or better than mine in terms of actual ranking outcomes — with full data transparency the whole time so I can understand why — I would become a vocal advocate. I'd write about it, present it at conferences, and recommend it to every agency I know. But the data has to be real, the methodology has to be sound, and the results have to be verifiable. No marketing claims. Show me the numbers.

---

## 10. Red Flags

- **Opaque scoring**: If I ask "how is this score calculated?" and the answer is "proprietary algorithm," I'm out.
- **Fabricated or unverifiable data**: One instance of a search volume number, competitor URL, or ranking position that doesn't match reality and I cancel the subscription that day.
- **No API or a poorly documented API**: Swagger docs with missing parameters, undocumented rate limits, or endpoints that return different schemas than documented.
- **LLM hallucinations presented as data**: If the content intelligence layer uses an LLM to "estimate" search volumes or "predict" SERP features instead of pulling from real data sources, that's a fundamental trust violation.
- **Vendor lock-in**: If I can't export all my data at any time in standard formats, the tool is designed to trap me, not serve me.
- **Downtime or data lag**: If GSC data in ChainIQ is more than 48 hours behind what I see in the GSC API directly, the ingestion layer isn't reliable enough for production use.
