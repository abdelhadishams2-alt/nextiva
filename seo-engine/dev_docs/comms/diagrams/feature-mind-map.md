# ChainIQ Platform — Feature Mind Map

```mermaid
mindmap
  root((ChainIQ<br/>AI Content<br/>Intelligence<br/>Platform))
    Layer 1: Data Ingestion
      Google Search Console
        OAuth2 + PKCE
        Clicks, Impressions, CTR
        16-month historical import
        Daily automated pulls
      Google Analytics 4
        Sessions & Engagement
        Conversion tracking
        Country & source data
      Semrush API
        Keyword research
        Competitor analysis
        Domain authority
      Ahrefs API
        Backlink profiles
        Content explorer
        Rank tracking
      Content Crawler
        Sitemap parsing
        HTML extraction
        Word count & metadata
        Robots.txt compliance
      Scheduler
        Daily GSC/GA4 pulls
        Weekly competitive scans
        Staleness detection
        Missed-job recovery
    Layer 2: Content Intelligence
      Decay Detection
        3-month rolling window
        Severity scoring
        Traffic drop alerts
      Gap Analysis
        Competitor keyword gaps
        Opportunity scoring
        Difficulty estimation
      Topic Recommender
        Scored recommendations
        Priority ranking
        Category filtering
      Cannibalization Guard
        Duplicate keyword detection
        Merge recommendations
        SERP conflict alerts
      Saturation Index
        Topic coverage depth
        Content density scoring
      Seasonality Engine
        Cyclical pattern detection
        Publish timing optimization
    Layer 3: Voice Intelligence
      Corpus Analyzer
        Full portfolio analysis
        Vocabulary extraction
        Sentence structure mapping
      AI/Human Classifier
        Content origin detection
        Confidence scoring
      Writer Clustering
        Style similarity grouping
        Team voice mapping
      Persona Generator
        Voice DNA profiles
        Reusable style templates
      Style Cloning
        Vocabulary matching
        Argumentation patterns
        Tone calibration
    Layer 4: Generation Pipeline
      Project Analyzer
        Tech stack detection
        Design token extraction
        3 adaptation modes
      Research Engine
        6-round Gemini research
        Source validation
        Fact checking
      Article Architect
        Concept mapping
        Component selection
        193 blueprint registry
      Draft Writer
        HTML assembly
        Inline CSS
        Edit UI integration
      Quality Gate
        60-point SEO checklist
        7-signal scoring rubric
        E-E-A-T evaluation
        Auto-revision loop
    Layer 5: Universal Publishing
      WordPress Plugin
        REST API publishing
        Yoast/RankMath meta
        Featured images
        Draft mode
      Shopify App
        Storefront content
        Product descriptions
        Blog posts
      Ghost Adapter
        Admin API integration
        Tag management
      Webhook Publisher
        Custom CMS support
        JSON payload
      Headless CMS
        Contentful
        Strapi
        Sanity
        Webflow
      Bulk Publishing
        Batch operations
        Queue management
    Layer 6: Feedback Loop
      Performance Tracking
        30-day snapshots
        60-day snapshots
        90-day snapshots
      Prediction vs Actual
        Traffic prediction accuracy
        Ranking prediction accuracy
        Engagement prediction accuracy
      Recalibration Engine
        Weight adjustment
        Model improvement
        Statistical validation
      ROI Calculator
        Traffic value estimation
        Content cost attribution
        Client reporting
      Churn Prediction
        Decline detection
        Proactive alerts
        Refresh recommendations
      Executive Reports
        Portfolio analytics
        Trend visualization
        C-suite presentations
```

## Reading the Mind Map

- **Center:** ChainIQ platform as the root
- **First ring:** The 6 architectural layers, each independently valuable
- **Second ring:** Major capabilities within each layer
- **Third ring:** Specific features and implementation details

Each layer builds on the one above it, but can also function independently for clients who need only a subset of the platform.
