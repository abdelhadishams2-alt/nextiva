# ChainIQ Service Map — All 12 Services by Layer

```mermaid
graph TD
    subgraph "Layer 0: Foundation (Built)"
        AB["Auth & Bridge Server<br/>36+ endpoints, security hardened"]
        DA["Dashboard API<br/>Full CRUD, admin panel"]
        AU["Admin & User Management<br/>User CRUD, quotas, plans"]
        AN["Analytics<br/>Generation stats, usage metrics"]
    end

    subgraph "Layer 1: Data Ingestion (New)"
        DI["Data Ingestion Service<br/>GSC | GA4 | Semrush | Ahrefs | Crawler"]
    end

    subgraph "Layer 2: Content Intelligence (New)"
        CI["Content Intelligence<br/>Decay Detection | Gap Analysis<br/>Topic Recommender | Cannibalization"]
    end

    subgraph "Layer 3: Voice Intelligence (New)"
        VI["Voice Intelligence<br/>Corpus Analysis | AI/Human Classifier<br/>Writer Clustering | Persona Generation"]
    end

    subgraph "Layer 4: Generation Pipeline (Existing + Extended)"
        AP["Article Pipeline<br/>4-Agent Pipeline, 7 Adapters"]
        UE["Universal Engine<br/>11 Languages, RTL, 7 Adapters"]
        QG["Quality Gate (New)<br/>60-Point SEO Checklist<br/>7-Signal Scoring | Auto-Revision"]
    end

    subgraph "Layer 5: Universal Publishing (New)"
        PB["Publishing Service<br/>WordPress | Shopify | Ghost<br/>Contentful | Strapi | Webhook"]
    end

    subgraph "Layer 6: Feedback Loop (New)"
        FL["Feedback Loop<br/>30/60/90-Day Tracking<br/>Prediction vs Actual | Recalibration"]
    end

    %% Data flow between layers
    DI -->|"Performance data<br/>per URL per client"| CI
    DI -->|"Content inventory<br/>for corpus analysis"| VI
    CI -->|"Scored topic<br/>recommendations"| AP
    VI -->|"Writer personas<br/>with style DNA"| AP
    AP --> QG
    QG -->|"Scored & revised<br/>articles"| UE
    UE -->|"Framework-adapted<br/>content"| PB
    PB -->|"Published article<br/>URLs"| FL
    FL -->|"Recalibrated weights<br/>& accuracy data"| CI

    %% Foundation supports everything
    AB -.->|"Auth & routing"| DI
    AB -.->|"Auth & routing"| CI
    AB -.->|"Auth & routing"| VI
    AB -.->|"Auth & routing"| AP
    AB -.->|"Auth & routing"| PB
    AB -.->|"Auth & routing"| FL
    DA -.->|"API layer"| AN
    DA -.->|"API layer"| AU

    %% Styling
    classDef built fill:#2d6a4f,stroke:#1b4332,color:#fff
    classDef newService fill:#1d3557,stroke:#0d1b2a,color:#fff
    classDef extended fill:#6a4c93,stroke:#4a3466,color:#fff

    class AB,DA,AU,AN built
    class DI,CI,VI,QG,PB,FL newService
    class AP,UE extended
```

## Legend

| Color | Meaning |
|-------|---------|
| Green | Existing service (built in v1) |
| Blue | New service (platform expansion) |
| Purple | Existing service being extended |

## Data Flow Summary

1. **Data Ingestion** pulls raw performance data from Google Search Console, Google Analytics, Semrush, and Ahrefs, plus crawls website content
2. **Content Intelligence** analyzes that data to detect decaying content, find keyword gaps, and produce scored topic recommendations
3. **Voice Intelligence** uses the crawled content inventory to analyze writer portfolios and generate reusable voice profiles
4. **Article Pipeline** receives topic recommendations and voice personas, then generates articles through the 4-agent pipeline
5. **Quality Gate** scores each article against a 60-point SEO checklist and 7-signal rubric, auto-revising until quality thresholds are met
6. **Universal Engine** adapts the content for the target framework and language
7. **Publishing Service** pushes the final article to WordPress, Shopify, Ghost, or any connected CMS as a draft
8. **Feedback Loop** tracks published articles at 30, 60, and 90 days, compares predictions vs. actuals, and sends recalibrated weights back to Content Intelligence -- closing the loop and making the system smarter over time
