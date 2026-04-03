# Troubleshooting — Common Issues

> **Last Updated:** 2026-03-28
> **Covers:** 12 common problems with step-by-step solutions

---

## 1. "Unauthorized" Error on Dashboard

**Symptoms:** You see a 401 error or are redirected to the login page unexpectedly.

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Session expired (JWT tokens expire after 1 hour) | Sign out and sign back in. Your session will refresh automatically. |
| Browser cleared cookies/localStorage | Sign in again. Session data is stored in browser localStorage. |
| Account deactivated by admin | Contact your admin to verify your account status in the Admin panel. |
| Clock skew on your machine | Ensure your system clock is accurate (JWT validation is time-sensitive). |

---

## 2. Article Generation Stuck at "Researching"

**Symptoms:** The progress indicator stays on "Researching" for more than 5 minutes with no movement.

**Solutions:**
1. **Wait 3 more minutes** — Complex topics with limited online data can take longer for the 6-round research phase
2. **Refresh the page** — The SSE connection may have dropped. Refreshing reconnects and shows current progress
3. **Check the Pipeline page** — Navigate to Pipeline to see if the job is queued, active, or failed
4. **Try a different topic** — Very niche topics with minimal search results can cause research timeouts
5. **Contact admin** — If the issue persists, the Claude CLI subprocess may have crashed. Admin can check server logs

---

## 3. Generated Article Has No Images

**Symptoms:** The article is text-only despite image generation being enabled.

**Solutions:**
1. Check **Settings → Preferences → Image Generation** — ensure it's set to "Enabled"
2. If enabled but still no images, the Gemini image generation API may have timed out
3. Re-generate the article with image generation explicitly enabled in the generation options
4. Check your quota — image generation counts toward your monthly article quota

---

## 4. Output Format Is Wrong (HTML Instead of Next.js/Vue)

**Symptoms:** You expected a `.tsx` or `.vue` file but received plain HTML.

**Solutions:**
1. **Explicitly select the framework** in the generation options instead of relying on auto-detect
2. **Check your project directory** — The Project Analyzer looks for framework indicators (`package.json` with `next` or `vue` dependency, `svelte.config.js`, etc.)
3. If auto-detect keeps choosing wrong: Go to **Settings → Preferences → Default Framework** and set it manually

---

## 5. "Rate Limit Exceeded" Error

**Symptoms:** You see a 429 error with a "Retry after X seconds" message.

**What's happening:** You've exceeded the per-minute rate limit for that endpoint.

**Rate limits by plan:**

| Endpoint | Starter | Professional | Enterprise |
|----------|---------|-------------|-----------|
| Article generation | 2/min | 5/min | 15/min |
| Section editing | 5/min | 15/min | 30/min |
| API calls (plugin) | 60/min | 120/min | 200/min |

**Solutions:**
1. Wait for the `Retry-After` period shown in the error
2. If you consistently hit limits, consider upgrading your plan
3. For API integrations, implement exponential backoff in your client code

---

## 6. "Quota Exceeded" Error

**Symptoms:** You see a "Monthly quota exceeded" error when trying to generate articles.

**Solutions:**
1. Check your usage in **Settings → Usage** to see current consumption vs. limit
2. Wait for the next billing cycle to reset your quota
3. Ask your admin to increase your quota (Enterprise plans support per-user overrides)
4. Upgrade your plan for higher limits

---

## 7. Edit Takes Too Long (Spinner Won't Stop)

**Symptoms:** After clicking Edit on a section, the progress spinner runs for more than 5 minutes.

**Solutions:**
1. **Check your network** — The edit operation uses Server-Sent Events (SSE) which require a stable connection
2. **Refresh and retry** — The edit operation has a 10-minute timeout. If it hasn't completed, try again
3. **Simplify the instruction** — Very complex edit instructions (e.g., "rewrite the entire section with different examples and add tables") take longer. Try breaking into smaller edits
4. **Check the Pipeline page** — See if the edit job is queued behind other jobs

---

## 8. API Key Not Working from CMS Plugin

**Symptoms:** Your WordPress or Shopify plugin returns "Invalid API key" errors.

**Solutions:**
1. **Verify the key is active** — Go to **Settings → API Keys** and check the key status
2. **Copy the key again** — Keys are only shown once at creation. If you lost it, revoke and create a new one
3. **Check the key prefix** — Ensure you're using the full key, not a truncated display value
4. **Verify the bridge URL** — Your CMS plugin must be configured with the correct bridge server URL
5. **Check rate limits** — Plugin API keys have separate rate limits (60-200/min depending on plan)

---

## 9. Data Connection (GSC/GA4) Failed

**Symptoms:** After authorizing Google Search Console or Google Analytics, the connection shows as "Error" or "Disconnected."

**Solutions:**
1. **Re-authorize** — Go to **Settings → Connections**, disconnect the failed connection, and reconnect
2. **Check permissions** — Ensure you authorized read access to the correct GSC property
3. **Google API quota** — Google APIs have daily quota limits. If you've made many requests, wait 24 hours
4. **OAuth token expired** — ChainIQ automatically refreshes tokens, but if the refresh token is revoked in your Google account, you'll need to re-authorize
5. **Check the property list** — Ensure the GSC property URL matches your site exactly (including `https://` vs `http://`)

---

## 10. Dashboard Loads Slowly

**Symptoms:** Pages take more than 3 seconds to load, especially the Articles or Pipeline pages.

**Solutions:**
1. **Check your internet connection** — The dashboard makes API calls to the bridge server
2. **Reduce data volume** — If you have 1000+ articles, use filters to limit the list view
3. **Clear browser cache** — Old cached assets can cause conflicts after updates
4. **Check bridge server health** — Navigate to `{bridge-url}/health` to verify the server is responsive
5. **Contact admin** — Server might need a restart or resource upgrade

---

## 11. Arabic/RTL Content Rendering Issues

**Symptoms:** Arabic text appears left-to-right, layout is mirrored incorrectly, or Arabic fonts look wrong.

**Solutions:**
1. **Select Arabic explicitly** — Don't rely on auto-detection for Arabic topics. Set language to "ar" in generation options
2. **Check the output** — Arabic articles should have `dir="rtl"` on the `<html>` or `<body>` element
3. **Font loading** — Arabic articles use `Noto Sans Arabic` or similar Arabic-optimized fonts. If fonts look wrong, ensure font loading is not blocked by CSP
4. **CSS logical properties** — ChainIQ uses CSS logical properties (`margin-inline-start` instead of `margin-left`) for RTL support. If your site overrides these with physical properties, RTL layout may break

---

## 12. Prompt Injection Blocked

**Symptoms:** Your edit instruction was rejected with a "Content blocked by security filter" message.

**What happened:** ChainIQ's prompt guard detected patterns in your edit instruction that resemble prompt injection attempts. This is a security feature that protects against adversarial inputs.

**Common false positives and solutions:**
- **Mentioning "system" or "instructions"** — If your article is about systems or instruction manuals, rephrase: instead of "add a section about system instructions," try "add a section about setup guidelines"
- **Using imperative language** — "Ignore the previous format and write..." may trigger the guard. Instead, describe the desired outcome: "Change the format to a numbered list"
- **Technical content** — If writing about security or AI topics, some technical terms may trigger the guard. Try paraphrasing

If you believe the block is a false positive, contact your admin. They can review the prompt guard logs and adjust patterns.

---

## Still Need Help?

If your issue isn't listed here:

1. **Check the FAQ** — See [Account & Billing FAQ](../faq/account-billing.md) and [Article Generation FAQ](../faq/article-generation.md)
2. **Check server status** — Navigate to `{bridge-url}/health` for real-time server health
3. **Contact support** — Email admin@chainreactionseo.com with:
   - Your account email
   - The error message (screenshot if possible)
   - When the issue started
   - Steps to reproduce
