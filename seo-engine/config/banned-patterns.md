# Banned Writing Patterns

## Phrases to Never Use
- "In today's fast-paced world"
- "It's no secret that"
- "In conclusion"
- "Without further ado"
- "At the end of the day"
- "It goes without saying"
- "In this article, we will"
- "Let's dive in"
- "Are you ready to"
- "Look no further"
- "The landscape is evolving"
- "Game-changer"
- "Leverage" (as verb, use "use" instead)
- "Unlock the power of"
- "Take it to the next level"
- "Seamlessly"
- "Robust" (unless describing actual engineering)
- "Cutting-edge"
- "Revolutionize"
- "Empower"
- "Synergy"
- "Paradigm shift"
- "Best-in-class"
- "World-class"
- "Holistic approach"

## Soft-Generic Superlatives (NEW — added for Content Quality Phase)

These phrases are banned **unless the adjective or superlative is anchored to a specific number, date, or source URL in the same sentence**. The fact-checker subagent and quality-reviewer subagent enforce this.

- "Unmatched" — permitted only if followed by a comparison with a specific number (e.g., "unmatched at its price point — SAR 69/mo vs the next-cheapest native-ZATCA platform at SAR 99/mo[^1]")
- "Genuinely" — almost always padding ("genuinely hard to beat", "genuinely good"); remove and replace with the specific measurement
- "Comprehensive" — if used, specify what is comprehensive (e.g., "covers all 22 ZATCA wave announcements published through April 2026[^1]")
- "Powerful" — almost always vague; substitute a measured capability
- "Cleanest" / "the cleanest in the industry" — unverifiable; replace with the specific metric ("documented latency of 30ms per request[^1]")
- "Strongest" / "strongest all-rounder" — unverifiable without a methodology
- "Loved by" / "genuinely loved" — market-survey phrasing without the survey link
- "Extremely" + any adjective ("extremely reliable", "extremely fast") — substitute the number
- "Arguably" / "arguably the best" — if you have to say "arguably", you have not earned the claim
- "Truly" — almost always padding ("truly bilingual" → "bilingual, with financial statements generated in both English and Arabic from the same ledger")
- "No-compromise" / "the clearest no-compromise choice" — replace with the specific trade-offs this tool does not force
- "Value champion" — superlative without a benchmark
- "The go-to choice" — without a named condition attached ("for Saudi SMEs processing > SAR 1M in invoices per year")
- "Hard to beat" — without a specific metric being beaten
- "The industry standard" — without citing the standards body or market-share source
- "Industry-leading" / "world-leading" — unverifiable without a market-share source
- "State-of-the-art" / "bleeding-edge" — vague; substitute the capability
- "Best-of-breed" — vague; substitute the specific advantage

### Exception rule (explicit)

Any of the above is permitted if the same sentence contains BOTH:
1. A specific numeric anchor (price, date, benchmark, percentage), AND
2. A footnote citation `[^ev-id]` that the fact-checker has validated.

Example of permitted usage:
> "Wafeq's native ZATCA Phase 2 integration is the most documented in the ZATCA-approved vendor list, with Fatoora-portal acceptance tested across all 22 invoice wave announcements through April 2026[^5]."

("most documented" is anchored to the "22 wave announcements through April 2026" number AND the `[^5]` citation.)

## Structural Patterns to Avoid
- Opening with a question then immediately answering it
- Every section starting with the same sentence structure
- Bullet lists longer than 7 items without grouping
- More than 2 consecutive short paragraphs (feels like a listicle)
- Using "Furthermore" or "Moreover" as transition words
- Ending sections with "Let's explore this further"
- Starting more than 2 sections with "When it comes to..."
- Using "But first, let's understand..." as a transition

## Tone Rules
- Never address reader as "Dear reader"
- Avoid exclamation marks except in CTAs (max 1 per article)
- No emoji in body text
- Don't hedge with "might", "could potentially", "it's possible that" — be direct
- Avoid starting 3+ sentences in a row with "This" or "The"

## Quality Checks
- Every claim needs a source or is clearly marked as perspective
- Statistics must include timeframe and source
- No percentage claims without context (e.g., "40% faster" — faster than what?)

## Domain Drift Patterns (CRITICAL)

These patterns indicate the article is being forced into the website's industry.
If the topic is NOT about the website's industry, these are BANNED:

- Forcing analogies between the topic and the website's industry
- "What [topic] teaches us about [website industry]"
- "Lessons from [topic] for [website industry] professionals"
- "[Topic] and the future of [website industry]"
- Bridging unrelated topics: "[topic] is like [website industry concept] because..."
- Concluding with "how this applies to [website industry]"
- Reframing the entire article through the website's industry lens
- Using industry jargon to describe non-industry concepts
- Adding a "business implications" section when the topic is not business
- Converting a non-business article into a "leadership lessons" piece

**Exception:** If the topic IS about the website's industry, these patterns are expected and allowed.
