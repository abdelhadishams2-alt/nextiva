# ChainIQ Canned Support Responses

> **Owner:** Solo Developer
> **Last Updated:** 2026-03-28
> **Platform:** Crisp shared inbox
> **Usage:** Copy, personalize the bracketed fields, and send. Never send a canned response without customizing it — customers can tell.

---

## Usage Guidelines

1. **Always personalize** — Replace all `[bracketed]` fields. Use the customer's first name. Reference their specific situation.
2. **Read before sending** — Ensure the canned response actually matches the customer's issue. A mismatched response is worse than a slow one.
3. **Add context** — If the customer provided specific details (error messages, screenshots), acknowledge them in your response even when using a template.
4. **Tone** — Professional but warm. These are publisher clients, not anonymous consumers. Build relationships.
5. **Follow-up** — Every canned response should either resolve the issue or set a clear expectation for what happens next.

---

## 1. Welcome / First Contact

**Use when:** A new customer reaches out for the first time via any channel.

**Crisp shortcut:** `/welcome`

```
Hi [Name],

Welcome to ChainIQ support! I'm [Your Name], and I'll be helping you today.

I've taken a look at your message and want to make sure I understand your
question correctly. [Brief restatement of their issue/question in your own
words.]

[If you can answer immediately: Here's what I'd suggest...]
[If you need more info: Could you share a bit more about [specific detail]?
That will help me give you the most accurate answer.]

In the meantime, you might find our knowledge base helpful — it covers most
common questions: [knowledge base URL]

Looking forward to helping you get the most out of ChainIQ.

Best,
[Your Name]
```

---

## 2. Bug Report Acknowledged

**Use when:** A customer reports a bug and you've triaged it but haven't started investigating yet.

**Crisp shortcut:** `/bug-ack`

```
Hi [Name],

Thank you for reporting this — I appreciate you taking the time to describe
the issue in detail. [If they included screenshots/steps: The screenshots
and reproduction steps you provided are especially helpful.]

I've logged this as [priority level: "a high-priority" / "a medium-priority"
/ "a lower-priority"] issue and it's in my investigation queue. Here's what
to expect:

- I'll investigate this within [timeframe based on priority and SLA].
- I'll update you as soon as I have findings, whether it's a fix or a
  workaround.
- If I need any additional information from you, I'll reach out.

[If a workaround exists: In the meantime, you can work around this by
[describe workaround].]

[If it's a known issue: I should mention that we're already aware of this
issue and it's being actively worked on. I expect a fix by [date].]

Reference: [Bug ID if applicable]

Best,
[Your Name]
```

---

## 3. Feature Request Logged

**Use when:** A customer requests a feature that doesn't exist yet.

**Crisp shortcut:** `/feature-req`

```
Hi [Name],

Thanks for suggesting this — [brief acknowledgment of why the feature would
be valuable, e.g., "I can see how automatic scheduling would save you
significant time with your publishing workflow"].

I've logged this as a feature request in our product backlog. While I can't
commit to a specific timeline right now, here's how feature requests work
at ChainIQ:

1. All requests are reviewed during sprint planning.
2. Features are prioritized based on customer impact and alignment with
   our roadmap.
3. When a requested feature is scheduled for development, I'll notify
   you directly.

[If a partial solution exists: While this feature isn't available yet, you
might find that [existing feature/workaround] helps with part of what
you're looking for.]

[If the feature is already planned: Great news — this is actually already
on our roadmap for [timeframe]. I'll make sure you're notified when it
ships.]

Your feedback genuinely helps shape the product, so please keep it coming.

Best,
[Your Name]
```

---

## 4. Billing Inquiry

**Use when:** A customer has a question about their invoice, plan, charges, or subscription changes.

**Crisp shortcut:** `/billing`

```
Hi [Name],

Thanks for reaching out about your billing. Let me address your question.

[Choose the relevant scenario:]

**Plan details:**
You're currently on the [plan name] plan at [price]/month, which includes
[key features]. Your next billing date is [date].

**Charge explanation:**
The charge of [amount] on [date] corresponds to [explanation: monthly
subscription / usage overage / plan upgrade proration].

**Plan change:**
I can [upgrade/downgrade] your plan to [plan name]. The change will
[take effect immediately / take effect at your next billing cycle] and
your new rate will be [amount]/month. Would you like me to proceed?

**Refund request:**
I understand your concern. [If eligible: I've processed a refund of
[amount], which should appear in your account within 5-10 business days.]
[If not eligible: Our refund policy covers [conditions]. In your case,
[explanation]. I'd like to find another way to make this right — would
[alternative: credit / extended trial / plan adjustment] work for you?]

Let me know if you have any other questions about your billing.

Best,
[Your Name]
```

---

## 5. Account Issues (Access / Permissions)

**Use when:** A customer cannot access their account, has permission issues, or needs account modifications.

**Crisp shortcut:** `/account`

```
Hi [Name],

I understand you're having trouble with your account. Let me help sort
this out.

[Choose the relevant scenario:]

**Cannot log in:**
I've checked your account and it's active. Here are a few things to try:
1. Clear your browser cache and cookies for [domain].
2. Try using an incognito/private browser window.
3. Use the "Forgot Password" link to reset your password: [reset URL]
4. If you're using a social login (Google), make sure you're using the
   same Google account you signed up with.

If none of these work, let me know and I'll investigate further on my end.

**Permission issues:**
I've updated your account permissions. You should now have access to
[specific feature/area]. Please log out and back in to refresh your
session, then let me know if the issue persists.

**Account modification:**
I've made the following changes to your account: [describe changes].
These are effective immediately.

**Account deletion request:**
I can process your account deletion. Before I do, please note:
- All your data (articles, analytics, settings) will be permanently deleted.
- This action cannot be undone.
- If you'd like an export of your data first, I can provide that.
Please confirm you'd like to proceed.

Best,
[Your Name]
```

---

## 6. Password Reset Assistance

**Use when:** A customer specifically needs help resetting their password and the self-serve flow isn't working.

**Crisp shortcut:** `/password`

```
Hi [Name],

I'd be happy to help you get back into your account. Let's get your
password reset.

**Self-serve reset (fastest):**
1. Go to [login URL]
2. Click "Forgot Password"
3. Enter your email address: make sure you use the same email you
   registered with ([their email if known])
4. Check your inbox (and spam/junk folder) for the reset link
5. The link expires after 1 hour, so please use it promptly

**If the reset email isn't arriving:**
- Check your spam/junk folder
- Verify you're using the correct email address
- Some corporate email filters block automated emails — check with your
  IT team
- Try adding [our sender email] to your contacts or allowlist

**If none of the above works:**
I can manually trigger a password reset from my end. I'll need to verify
your identity first — could you confirm [verification question: the email
you used to sign up / your organization name / when you created the
account]?

Let me know how you get on.

Best,
[Your Name]
```

---

## 7. API Key Help

**Use when:** A customer needs help generating, managing, or troubleshooting their API keys.

**Crisp shortcut:** `/api-key`

```
Hi [Name],

Here's everything you need to know about managing your ChainIQ API keys.

[Choose the relevant scenario:]

**Generating a new API key:**
1. Log into your ChainIQ Dashboard
2. Navigate to Settings → API Keys
3. Click "Generate New Key"
4. Give it a descriptive name (e.g., "Production", "Development")
5. Copy the key immediately — it won't be shown again for security reasons
6. Store it securely (password manager recommended, never in source code)

**API key not working (401 Unauthorized):**
Common causes and fixes:
- **Expired key:** Generate a new one from the dashboard.
- **Wrong environment:** Make sure you're using the production key for
  production and the development key for testing.
- **Extra whitespace:** Check for leading/trailing spaces when copying.
- **Rate limit exceeded:** Our API allows [X] requests per minute. If
  you're hitting limits, contact me about increasing your allocation.

**Compromised key:**
If you believe your API key has been exposed:
1. Immediately revoke it from Settings → API Keys → Revoke
2. Generate a new key
3. Update your application with the new key
4. Let me know so I can check for any unauthorized usage

**Key permissions:**
Your [plan name] plan includes access to the following API endpoints:
[list relevant endpoints]. If you need access to additional endpoints,
[upgrade path / contact info].

Need anything else? Happy to help.

Best,
[Your Name]
```

---

## 8. Article Generation Timeout

**Use when:** A customer reports that article generation is taking too long or timing out.

**Crisp shortcut:** `/gen-timeout`

```
Hi [Name],

I'm sorry you're experiencing delays with article generation. Let me
help troubleshoot this.

**Immediate things to check:**

1. **Article length:** Longer articles (3000+ words) naturally take more
   time to generate. A typical 1500-word article should complete within
   [expected time]. Anything beyond [timeout threshold] indicates an issue.

2. **Complex prompts:** Very detailed prompts with many constraints can
   increase generation time. Try simplifying the prompt to test if that's
   the factor.

3. **Current system load:** [Check and report: "I've checked our system
   status and everything looks normal" / "We're currently experiencing
   higher than usual load, which may be causing delays"]

**What I'm doing on my end:**

I've checked your recent generation attempts and I can see that
[describe what you found: "your last 3 attempts timed out at the
[X]-minute mark" / "one article failed but the retry succeeded"].

[If it's a systemic issue: We've identified the cause — [brief
explanation] — and a fix is being deployed. Your generations should
return to normal speed within [timeframe].]

[If it's isolated: This appears to be an isolated occurrence. Could you
try generating again? If it happens a second time, please share the
article title and prompt so I can investigate the specific request.]

**Workaround:**
If you need the article urgently, try:
- Reducing the target word count
- Splitting into two shorter articles
- Removing any image generation requests from the prompt

I'll keep an eye on this and follow up if I find anything further.

Best,
[Your Name]
```

---

## 9. Prompt Guard False Positive

**Use when:** A customer's legitimate content is being blocked by the Prompt Guard safety system.

**Crisp shortcut:** `/prompt-guard`

```
Hi [Name],

I understand that your content was flagged by our safety system (Prompt
Guard) and you believe this was a false positive. I take these reports
seriously — we want the guard to block genuinely harmful content while
allowing legitimate publisher content through without friction.

**What I need from you to investigate:**

1. The exact prompt or content that was blocked (you can paste it here
   or send it via email if you prefer)
2. The error message or block reason displayed (e.g., "Content flagged
   for [category]")
3. Whether this is a one-time occurrence or if similar content is being
   consistently blocked

**What happens next:**

1. I'll review the flagged content against our safety rules.
2. If it's a false positive, I'll adjust the relevant rule to prevent
   it from happening again. This typically takes [1-2 business days].
3. I'll notify you once the adjustment is made so you can retry.

[If you've already reviewed and it IS a false positive:]
I've reviewed your content and confirmed this was a false positive. The
issue was [brief technical explanation: e.g., "a keyword overlap with a
restricted category"]. I've adjusted the rule and your content should
now pass through without issues. Please retry and let me know if it
works.

[If the content WAS legitimately flagged:]
After reviewing the content, I found that it was flagged because
[explanation]. Our content policies [link to content policy] restrict
[specific type of content]. If you'd like to discuss this further or
believe the policy should be adjusted for your use case, I'm happy to
have that conversation.

Thank you for your patience — getting this balance right is important
to us.

Best,
[Your Name]
```

---

## 10. Data Export Request

**Use when:** A customer wants to export their data from ChainIQ (articles, analytics, account data).

**Crisp shortcut:** `/data-export`

```
Hi [Name],

Absolutely — your data is yours and you can export it at any time.
Here's how to get what you need:

**Self-serve export (available now):**

1. **Articles:** Dashboard → Articles → Select articles → Export
   - Formats available: JSON, CSV, Markdown
   - Includes: title, content, metadata, generation parameters, publish
     status

2. **Analytics:** Dashboard → Analytics → Date range → Export
   - Formats available: CSV
   - Includes: page views, engagement metrics, performance scores

3. **Account data:** Dashboard → Settings → Data → Export My Data
   - Includes: profile, preferences, API key metadata (not the keys
     themselves), usage history

**Full data export (GDPR-style):**

If you need a complete export of all data associated with your account
(including internal records, support history, and audit logs), I can
prepare this for you. This takes [1-3 business days] and will be
delivered as a ZIP file containing:

- All articles with full metadata (JSON)
- Complete analytics history (CSV)
- Account and profile data (JSON)
- Usage and billing history (CSV)
- Support conversation exports (if applicable)

Would you like me to initiate a full export?

[If the customer is leaving / account deletion context:]
I understand. Before I process the export, I want to make sure you
have everything you need. Is there anything about ChainIQ that we
could improve? Your feedback would be genuinely valuable. Either way,
I'll have your export ready within [timeframe].

**Data format notes:**
- All exports use UTF-8 encoding (supports Arabic and other MENA
  region character sets)
- Dates are in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
- Large exports may be split into multiple files

Let me know which option works best for you.

Best,
[Your Name]
```

---

## Response Maintenance Schedule

| Task | Frequency | Action |
|------|-----------|--------|
| Review response accuracy | Monthly | Verify all URLs, feature references, and process steps are current |
| Add new responses | As needed | When a new common question pattern emerges (3+ similar inquiries) |
| Update pricing/plan references | When pricing changes | Search all responses for plan names and prices |
| Review tone and effectiveness | Quarterly | Check CSAT scores for conversations using canned responses |
| Retire obsolete responses | Quarterly | Remove responses for deprecated features |

---

## Response Performance Tracking

Track which canned responses are used most frequently and their effectiveness:

| Response | Uses/Month | Avg CSAT | Notes |
|----------|-----------|----------|-------|
| Welcome | — | — | Baseline |
| Bug Acknowledged | — | — | — |
| Feature Request | — | — | — |
| Billing | — | — | — |
| Account Issues | — | — | — |
| Password Reset | — | — | — |
| API Key Help | — | — | — |
| Gen Timeout | — | — | — |
| Prompt Guard FP | — | — | — |
| Data Export | — | — | — |

Fill this table monthly during the support metrics review. If a response consistently scores below 3.5 CSAT, rewrite it.
