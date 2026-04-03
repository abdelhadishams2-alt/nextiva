# ChainIQ Platform Expansion Roadmap — Gantt Chart

```mermaid
gantt
    title ChainIQ Platform Expansion Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section External Dependencies
    Submit Google OAuth consent screen       :milestone, oauth-submit, 2026-04-06, 0d
    Google OAuth verification (2-6 weeks)    :active, oauth-verify, 2026-04-06, 42d
    Apply for Semrush API access             :milestone, sem-submit, 2026-04-06, 0d
    Semrush API approved                     :sem-approve, 2026-04-06, 14d
    Apply for Ahrefs API access              :milestone, ahr-submit, 2026-04-06, 0d
    Ahrefs API approved                      :ahr-approve, 2026-04-06, 14d
    WordPress plugin submission              :wp-submit, 2026-05-25, 28d
    Shopify app submission                   :shop-submit, 2026-07-20, 14d

    section Phase A — Foundation + Data Core
    Sprint 1: Infrastructure Foundation      :crit, s1, 2026-04-06, 14d
    Server deploy + HTTPS + security         :s1a, 2026-04-06, 5d
    DB migrations + RLS + partitioning       :s1b, 2026-04-08, 8d
    Route splitting refactor                 :s1c, 2026-04-06, 12d
    Design tokens + RTL foundation           :s1d, 2026-04-13, 5d
    Sprint 2: Data Connectors                :crit, s2, 2026-04-20, 14d
    Google OAuth2 flow                       :s2a, 2026-04-20, 10d
    GSC Search Analytics client              :s2b, 2026-04-24, 8d
    GA4 Reporting API client                 :s2c, 2026-04-27, 8d
    Content inventory crawler                :s2d, 2026-04-27, 8d
    Sprint 3: Intelligence Seed              :crit, s3, 2026-05-04, 14d
    Ingestion scheduler                      :s3a, 2026-05-04, 5d
    Decay detection engine                   :s3b, 2026-05-06, 10d
    Keyword gap analyzer                     :s3c, 2026-05-08, 10d
    Connections + inventory dashboards       :s3d, 2026-05-11, 7d
    Phase A Complete                         :milestone, m-pa, 2026-05-18, 0d

    section Phase B — Intelligence + Quality + Publishing
    Sprint 4: Intelligence Engine            :s4, 2026-05-18, 14d
    Topic recommender                        :s4a, 2026-05-18, 10d
    Cannibalization detection                :s4b, 2026-05-22, 8d
    Quality gate (7-signal scoring)          :s4c, 2026-05-25, 10d
    Sprint 5: Publishing Pipeline            :s5, 2026-06-01, 14d
    WordPress plugin + Yoast/RankMath        :s5a, 2026-06-01, 10d
    Image pipeline                           :s5b, 2026-06-05, 7d
    Auto-revision loop                       :s5c, 2026-06-08, 7d
    Vertical Slice Demo Ready                :milestone, m-vs, 2026-06-15, 0d
    Sprint 6: Competitive Intelligence       :s6, 2026-06-15, 14d
    Semrush integration                      :s6a, 2026-06-15, 8d
    Ahrefs integration                       :s6b, 2026-06-20, 8d
    Deep gap analysis                        :s6c, 2026-06-23, 5d
    Sprint 7: Pilot Hardening                :s7, 2026-06-29, 14d
    Feedback tracking                        :s7a, 2026-06-29, 7d
    Weekly action brief                      :s7b, 2026-07-02, 5d
    48h unattended operation test            :s7c, 2026-07-07, 5d
    SRMG Pilot Live                          :milestone, m-pilot, 2026-07-13, 0d

    section Phase C — Voice + Publishing Expansion
    Sprint 8: Voice Intelligence Core        :s8, 2026-07-13, 14d
    Stylometric corpus analysis              :s8a, 2026-07-13, 10d
    AI/human classification                  :s8b, 2026-07-17, 8d
    Writer clustering                        :s8c, 2026-07-20, 8d
    Sprint 9: Voice Profiles + Publishing    :s9, 2026-07-27, 14d
    Voice persona generation                 :s9a, 2026-07-27, 8d
    Style cloning in pipeline                :s9b, 2026-07-31, 8d
    Shopify app                              :s9c, 2026-08-01, 7d
    Sprint 10: Multi-CMS + Bulk              :s10, 2026-08-10, 14d
    Ghost adapter                            :s10a, 2026-08-10, 7d
    Bulk publishing                          :s10b, 2026-08-14, 7d
    Design hardening sprint                  :s10c, 2026-08-17, 7d
    Sprint 11: Voice Polish                  :s11, 2026-08-24, 14d
    Voice Intelligence Live                  :milestone, m-voice, 2026-09-07, 0d

    section Phase D — Feedback Loop + Polish
    Sprint 12: Prediction Engine             :s12, 2026-09-07, 14d
    Prediction vs actual comparison          :s12a, 2026-09-07, 10d
    Accuracy scoring                         :s12b, 2026-09-11, 8d
    Sprint 13: Recalibration                 :s13, 2026-09-21, 14d
    Recalibration engine                     :s13a, 2026-09-21, 10d
    ROI calculation                          :s13b, 2026-09-25, 8d
    Sprint 14: Executive Reporting           :s14, 2026-10-05, 14d
    Performance reports                      :s14a, 2026-10-05, 10d
    Churn prediction                         :s14b, 2026-10-09, 8d
    Portfolio analytics                      :s14c, 2026-10-12, 7d
    Sprint 15: Platform Polish               :s15, 2026-10-19, 14d
    Feedback Loop Complete                   :milestone, m-feedback, 2026-11-02, 0d

    section Phase E — Enterprise Expansion
    Headless CMS adapters                    :s16, 2026-11-02, 28d
    Advanced NLP (TF-IDF, entity salience)   :s17, 2026-11-16, 21d
    Conversion attribution                   :s18, 2026-11-30, 14d
    Seasonal adjustment                      :s19, 2026-12-07, 14d
    Enterprise Feature Complete              :milestone, m-enterprise, 2026-12-21, 0d
```

## Key Milestones

| Milestone | Target Date | Revenue Impact |
|-----------|------------|---------------|
| Phase A Complete (data flowing) | May 18, 2026 | Pre-revenue; Tier 1 ($3K/mo) becomes sellable |
| Vertical Slice Demo (end-to-end) | June 15, 2026 | SRMG demo-ready |
| SRMG Pilot Live | July 13, 2026 | First revenue: $5K/month |
| Voice Intelligence Live | September 7, 2026 | Premium tier unlocked: $8-12K/month |
| Feedback Loop Complete | November 2, 2026 | Data moat activates; self-improving platform |
| Enterprise Feature Complete | December 21, 2026 | Full platform; market expansion |
