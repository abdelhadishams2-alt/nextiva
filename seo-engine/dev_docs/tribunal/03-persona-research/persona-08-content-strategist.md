# Persona 08: Lina Fernandez — Content Strategist

---

## 1. Who I Am

My name is Lina Fernandez. I'm the Content Strategist at Velo Growth, a growth-stage B2B SaaS startup with 85 employees. We raised our Series B about 18 months ago and content is a primary growth channel — we're trying to build topical authority in a competitive space (workflow automation) where established players like Monday.com and Asana already dominate the SERP.

I'm a one-person strategy function. I work alongside 2 content writers and a freelance designer, but all strategic planning — topic selection, content calendar management, competitive analysis, keyword research, gap analysis, performance tracking — falls on me. I report to the VP of Marketing. I've been in content strategy for 7 years, the last 3 at startups where I've had to do everything with limited resources.

My technical level is intermediate-plus. I'm proficient in Google Sheets (advanced formulas, pivot tables), Looker, GA4, GSC, Semrush, Ahrefs, and I can build basic SQL queries for our data warehouse. I don't write code but I can work with data. I think in content frameworks, topic clusters, buyer journey stages, and competitive positioning — not in individual keywords.

---

## 2. My Daily Workflow

Monday and Tuesday are research days. I spend most of these two days in Semrush and Ahrefs doing competitive gap analysis — identifying topics our competitors rank for that we don't cover, finding keywords where we rank positions 5-15 that could be improved with better content, and analyzing SERP trends to spot emerging topics before they become competitive.

This analysis happens almost entirely in spreadsheets. I export keyword data from Semrush, ranking data from Ahrefs, performance data from GSC, and traffic data from GA4. Then I manually join these datasets by URL and keyword, apply my own scoring model (a weighted formula combining search volume, keyword difficulty, business relevance, and buyer journey stage), and produce a prioritized list of content opportunities.

This spreadsheet work takes about 16 hours across Monday and Tuesday. It's the most valuable work I do and the most tedious.

Wednesday is calendar planning. I take my prioritized opportunity list and slot items into the content calendar — a Google Sheet shared with the writers, designer, and VP of Marketing. I account for seasonal timing (certain topics peak in Q1, others in Q4), product launch alignment, and writer availability. I also create content briefs for each planned piece — target keyword, search intent, suggested structure, competitor content analysis, and internal linking recommendations.

Thursday is performance review. I pull data from GA4 and GSC into Looker dashboards I've built to track content performance. I'm looking at organic traffic by content cluster, conversion rates by article, keyword position changes, and content decay (articles losing traffic over time). I identify pieces that need refreshing and add them to the calendar.

Friday is stakeholder communication — weekly content performance reports for the VP of Marketing, content briefs for writers, feedback on drafted content (from a strategic alignment perspective, not editorial), and planning for the following week.

---

## 3. My Top 5 Pain Points

**Pain Point 1: Research and planning takes 60% of my week.** I spend roughly 2 full days per week on research, analysis, and planning. That's 16 hours of exporting data, cleaning spreadsheets, merging datasets, applying scoring models, and building content calendars. The actual strategic thinking — deciding what to write, when, and why — takes maybe 3 hours. The other 13 hours are data wrangling. If I could get the data assembly down to 2-3 hours, I could spend the rest of that time on actual strategy work, or double our content output.

**Pain Point 2: My competitive analysis is always stale.** By the time I finish a competitive gap analysis, it's already outdated. Competitors publish new content, SERP features change, new keywords emerge. I can afford to do a thorough competitive analysis once per quarter. I need one that updates continuously.

**Pain Point 3: Seasonal timing is guesswork.** I know from experience that "project management templates" peaks in January (new year planning) and "team productivity" peaks in September (back to office). But for most topics I'm guessing at seasonality, or spending 20 minutes per keyword in Google Trends trying to identify patterns. I need systematic seasonal intelligence across my entire keyword universe.

**Pain Point 4: Content gap identification is manual and incomplete.** My gap analysis compares my site against 3-4 known competitors. But I'm probably missing competitor content from sites I'm not tracking, emerging subtopics I haven't thought to search for, and adjacent topic areas where our audience is active but we haven't mapped. My current process finds the gaps I know to look for, not the gaps I don't know exist.

**Pain Point 5: No connection between planning and performance.** My content calendar lives in Google Sheets. My performance data lives in Looker. My keyword research lives in Semrush exports. There's no system that connects what I planned, what was published, and how it performed. When the VP of Marketing asks "how accurate were your topic predictions this quarter?", I spend 4 hours manually reconciling data to answer that question.

---

## 4. My Deal-Breakers

- **Unified intelligence layer**: One place where I see competitive gaps, topic opportunities, seasonal timing, and performance data together. Not another tool that does one thing and forces me to export to spreadsheets.
- **Topic-cluster thinking, not keyword-list thinking**: I don't want a flat list of 500 keywords. I want clustered topic recommendations organized by pillar, with subtopics, internal linking maps, and content type recommendations (guide vs. comparison vs. how-to).
- **Actionable recommendations, not raw data**: I can already pull raw keyword data from Semrush. I need the intelligence layer on top — "You should write about X in March because: seasonal peak, competitive gap, your cluster coverage is 40%, and the estimated opportunity is Y visits/month."
- **Time-to-value under 2 hours**: If I can't connect my data sources and get useful recommendations within a working afternoon, I'll lose momentum and the tool will become shelfware.
- **Performance feedback loop**: The system must track what it recommended, what was published, and how it performed — so recommendations get smarter over time, not just repeat the same analysis.

---

## 5. My Feature Priority Rankings

| Feature Area | Score (1-10) | Rationale |
|---|---|---|
| Data Ingestion | 9 | The foundation. If it can't pull from GSC, GA4, Semrush, and Ahrefs accurately, nothing else works. |
| Content Intelligence | 10 | This is the product for me. Topic recommendations, gap analysis, seasonal timing, cluster mapping. |
| Voice Intelligence | 3 | I hand content briefs to writers. Voice is their problem, not mine. |
| Article Generation | 3 | I'm a strategist, not a writer. I need to know what to write, not to write it. |
| Universal Publishing | 2 | Irrelevant to my role. |
| Quality Assurance | 5 | Useful if it validates strategic alignment — does the article cover the intended topic cluster? |
| Performance Tracking | 9 | Closing the loop between recommendations and outcomes is critical. |
| Dashboard/Admin | 7 | I need a clean interface for exploring recommendations and building calendars. |
| CMS Integration | 2 | Not my domain. |
| API & Developer Experience | 4 | Potentially useful for connecting to Looker, but not primary. |

---

## 6. My Wish List

1. **As a content strategist**, I want ChainIQ to automatically ingest data from GSC, GA4, Semrush, and Ahrefs, merge it by URL and keyword, and present a unified content performance view, so that I can eliminate the 13 hours per week I spend on manual data assembly and focus on strategic analysis.

2. **As a content strategist**, I want topic cluster recommendations that include pillar-subtopic hierarchy, internal linking maps, content type suggestions (guide, comparison, listicle, tool), estimated search opportunity, competitive gap severity, and optimal publish timing based on seasonal patterns, so that I can build a complete content calendar from a single recommendation set.

3. **As a content strategist**, I want a continuous competitive monitoring system that alerts me when competitors publish new content in my topic areas, when SERP features change for my target keywords, and when new keyword opportunities emerge in my clusters, so that my competitive analysis is always current instead of quarterly stale.

4. **As a content strategist**, I want a content calendar interface within ChainIQ where I can drag-and-drop recommended topics into time slots, assign them to writers, attach generated briefs, and track progress from recommendation through publication to performance measurement, so that my entire workflow lives in one system.

5. **As a content strategist**, I want recommendation accuracy reporting that shows me, over time, how ChainIQ's opportunity predictions compared to actual performance after publication — including traffic estimates vs. actual traffic, ranking predictions vs. actual rankings, and seasonal timing accuracy — so that I can trust the system's recommendations with increasing confidence.

---

## 7. Competitor Envy

MarketMuse's topic model and content inventory features are the closest to what I need. Their ability to map topical authority, identify content gaps at the cluster level (not just keyword level), and score content comprehensiveness is genuinely valuable. But MarketMuse's data freshness is poor, the UX is clunky, and it doesn't connect to GSC or GA4 for actual performance data. I end up exporting MarketMuse data into my spreadsheets alongside everything else. If ChainIQ could deliver MarketMuse's topical intelligence with real-time data from GSC/GA4/Semrush/Ahrefs, a usable calendar interface, and a performance feedback loop, it would replace both MarketMuse and about 6 of my spreadsheets.

---

## 8. If I Could Change ONE Thing

Give me a "Strategy Copilot" that replaces my two-day research process. I want to open ChainIQ on Monday morning and see: "Here are your top 15 content opportunities for the next 30 days, ranked by estimated impact, with competitive gap analysis, seasonal timing rationale, topic cluster context, and draft content briefs attached. Three of your existing articles are decaying and should be refreshed. Two competitors published new content in your core clusters last week — here's the gap analysis." If that briefing is accurate and saves me 12+ hours of spreadsheet work, ChainIQ becomes the most valuable tool in my stack by a massive margin.

---

## 9. What Would Make Me Evangelize

If ChainIQ could demonstrably reduce my research-to-calendar time from 16 hours to 3 hours per week — while maintaining or improving the quality of my topic selections as measured by actual content performance over 2-3 months — I would evangelize relentlessly. I'd present the time-savings case study at Content Marketing World. I'd share it in every content strategy Slack community and LinkedIn group I'm in. Content strategists are drowning in data wrangling and starving for actual intelligence. The first tool that genuinely solves the intelligence layer — not the writing layer, the thinking layer — will earn fanatical loyalty from every content strategist who discovers it.

---

## 10. Red Flags

- **Just another keyword tool**: If ChainIQ's "Content Intelligence" is really just a keyword research interface with a different UI, I already have Semrush and Ahrefs for that. I need cluster-level strategic intelligence, not keyword lists.
- **Stale data**: If competitive gap data is more than 7 days old, or if GSC data lags more than 48 hours, the recommendations are based on yesterday's reality. Strategy needs current data.
- **No performance feedback loop**: If the system recommends topics but never tracks whether those recommendations led to actual results, it's a static tool, not an intelligent system. Recommendations must improve over time.
- **Overwhelming complexity**: If I need 40 hours of setup and configuration before I get my first useful recommendation, I'll abandon it before reaching value. I need quick time-to-insight with depth available when I want it.
- **Ignoring business context**: If the system recommends high-volume keywords that have nothing to do with our product or buyer journey, it doesn't understand strategy. I need business relevance scoring, not just SEO metrics.
- **Poor data visualization**: If recommendations are presented as flat tables with no visual hierarchy, clustering, or calendar view, it's no better than my spreadsheets. The presentation layer matters because it shapes how quickly I can make decisions.
- **No export or integration**: If I can't get data out of ChainIQ and into Looker, Google Sheets, or our reporting tools, it becomes another data silo instead of solving the data silo problem.
