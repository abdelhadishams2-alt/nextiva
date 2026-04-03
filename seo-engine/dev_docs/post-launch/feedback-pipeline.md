# ChainIQ Feedback Pipeline

> End-to-end system for collecting, triaging, prioritizing, and acting on user feedback to drive continuous platform improvement.

---

## 1. Feedback Collection Channels

### 1.1 In-App Feedback Button
**Implementation:** Persistent floating feedback button on all dashboard pages (bottom-right corner).

- **Trigger:** User clicks the feedback icon or presses `Ctrl+Shift+F`
- **Form fields:**
  - Category dropdown: Bug Report, Feature Request, Content Quality, UX Issue, General Feedback
  - Free-text description (required, min 20 characters)
  - Screenshot attachment (optional, auto-capture current screen)
  - Severity self-assessment: Blocking, Annoying, Nice-to-have
- **Metadata auto-captured:** User ID, current page URL, browser/device info, subscription tier, timestamp, session duration, last action performed
- **Storage:** Feedback entries written to `feedback` table in Supabase with status `new`
- **Notification:** Slack/email alert for any feedback tagged as "Blocking" severity

### 1.2 Email Surveys
**Cadence and types:**

| Survey Type | Frequency | Trigger | Tool |
|-------------|-----------|---------|------|
| NPS (Net Promoter Score) | Quarterly | 14+ days since signup | Email (Resend/Loops) |
| Feature satisfaction | After major release | 7 days post-release | In-app modal |
| Onboarding experience | Once | Day 7 after signup | Email |
| Churn prevention | Once | 14 days of inactivity | Email |

**NPS Survey Structure:**
- Q1: "How likely are you to recommend ChainIQ to a colleague?" (0-10 scale)
- Q2: "What's the primary reason for your score?" (open text)
- Q3: "What one thing would you change about ChainIQ?" (open text)
- Target NPS: 40+ by month 6, 50+ by month 12

### 1.3 Direct User Interviews
- **Frequency:** Monthly, targeting 3-5 users per month
- **Selection criteria:** Mix of power users (top 20% by article volume), at-risk users (declining usage), and new users (< 30 days)
- **Format:** 20-minute structured call covering pain points, workflow integration, feature wishes
- **Output:** Interview notes stored in feedback pipeline, key quotes extracted for product decisions

### 1.4 Discord Community (Future — Month 6+)
- **Purpose:** Peer-to-peer support, feature discussion, beta testing community
- **Channels:** #general, #feature-requests, #bug-reports, #arabic-content, #announcements
- **Moderation:** Bot auto-tags feature requests and bugs, pipes them into feedback pipeline
- **Launch criteria:** 50+ active users before investing in community management

### 1.5 Support Interactions
- All support emails and tickets are tagged and fed into the feedback pipeline
- Common questions (asked 3+ times) trigger documentation updates
- Recurring issues (reported 5+ times) auto-escalate to P2 priority

---

## 2. Feedback Processing Pipeline

### 2.1 Intake & Tagging

Every feedback item receives the following tags upon entry:

```
Source:      [in-app | email-survey | interview | support | discord]
Category:    [bug | feature-request | ux | content-quality | performance | other]
Component:   [dashboard | bridge-server | agent-pipeline | billing | auth | editor | other]
Tier:        [starter | professional | enterprise]
Language:    [arabic | english | other]
Severity:    [blocking | annoying | nice-to-have]
Status:      [new | triaged | prioritized | scheduled | in-progress | shipped | declined]
```

### 2.2 Triage Process (Weekly)

**When:** Every Monday, 30-minute dedicated triage session.

**Steps:**
1. Review all `new` feedback items from the past week
2. Deduplicate — merge items describing the same issue, increment vote count
3. Verify bugs — attempt to reproduce, add repro steps or mark "cannot reproduce"
4. Categorize — apply correct tags if auto-tagging was inaccurate
5. Assess impact — estimate number of affected users (check if others reported similar)
6. Set status to `triaged`

### 2.3 Prioritization (RICE Framework)

Each triaged item is scored using RICE:

| Factor | Description | Scale |
|--------|-------------|-------|
| **R**each | How many users will this affect in the next quarter? | Number of users |
| **I**mpact | How much will this improve the experience? | 3 = massive, 2 = high, 1 = medium, 0.5 = low, 0.25 = minimal |
| **C**onfidence | How confident are we in the estimates? | 100% = high, 80% = medium, 50% = low |
| **E**ffort | Person-weeks to implement | Number (lower = better) |

**RICE Score = (Reach x Impact x Confidence) / Effort**

Items scoring above 50 are fast-tracked to the next sprint. Items below 10 are reviewed quarterly and either scheduled or declined with explanation.

### 2.4 Backlog Integration

Prioritized items flow into the product backlog:

1. **Create task in STATUS.md** — Add the item under the appropriate phase with RICE score
2. **Link to feedback** — Reference the original feedback item IDs for traceability
3. **Notify reporters** — When an item is scheduled, email the users who reported it: "Your feedback is being worked on, expected in [timeframe]"
4. **Close the loop** — When shipped, email reporters: "The improvement you requested is now live" with link to changelog

---

## 3. Feedback-to-Feature Workflow

```
User submits feedback
    |
    v
Auto-tagged & stored in Supabase (status: new)
    |
    v
Weekly triage (Monday) --> Dedup, verify, categorize (status: triaged)
    |
    v
RICE scoring --> Items ranked (status: prioritized)
    |
    v
Sprint planning --> High-score items scheduled (status: scheduled)
    |
    v
Development --> (status: in-progress)
    |
    v
Release --> (status: shipped) --> Notify reporters --> Changelog entry
```

### Declined Items
- Items declined receive a status of `declined` with a reason
- Reporters are notified with a clear explanation: "We've decided not to implement this because [reason]. Here's an alternative approach..."
- Declined items are reviewed quarterly in case context has changed

---

## 4. Feedback Metrics & Reporting

### Weekly Report (Generated Every Monday)
- Total feedback items received this week (by channel and category)
- Top 5 most-requested features (by vote count)
- Bug report trends (new vs resolved)
- Average time from feedback to triage
- Average time from triage to shipped (for completed items)

### Monthly Report
- NPS score trend (if survey was conducted)
- Feedback volume trend (growing = more engagement, declining = check if widget is visible)
- Feature request completion rate (shipped / total prioritized)
- Top feedback themes with action plan
- User satisfaction indicators from support interactions

### Quarterly Report
- Full RICE backlog review and re-prioritization
- NPS trend analysis with segment breakdown (by tier, by language)
- Competitive feedback analysis — are users comparing us to specific competitors?
- Strategic alignment check — does feedback align with roadmap priorities?

---

## 5. Feedback Quality Standards

### Response Time SLAs
| Feedback Type | Acknowledgment | Resolution/Response |
|---------------|---------------|-------------------|
| Blocking bug | 2 hours | 24 hours |
| Non-blocking bug | 24 hours | 1 week |
| Feature request | 48 hours | Next triage cycle |
| General feedback | 48 hours | Acknowledged |

### Communication Templates
- **Acknowledgment:** "Thanks for your feedback! We've logged this as [category] and it will be reviewed in our next triage session on [date]."
- **Scheduled:** "Great news — your suggestion has been prioritized and scheduled for our [timeframe] release."
- **Shipped:** "The improvement you requested is now live! [Link to changelog]. We'd love to hear if it addresses your needs."
- **Declined:** "After careful consideration, we've decided not to pursue this direction because [reason]. We appreciate you taking the time to share your thoughts."

---

*Last updated: 2026-03-28*
*Review cadence: Monthly*
*Owner: Chain Reaction SEO — ChainIQ Product*
