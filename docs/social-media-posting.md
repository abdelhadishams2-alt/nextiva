# Social Media Auto-Posting — What We Built & How You Benefit (Step 8)

## Overview

A hidden admin page at `/admin/social` that lets you post any article to X (Twitter) and LinkedIn with one click. Each article shows its title, URL, and two buttons — "Post to X" and "Post to LinkedIn".

**No coding needed to post.** Just open the page, click a button, and the article is posted with the title, description, and link.

---

## How It Works

```
You open /admin/social
    ↓
See all 16 articles listed with buttons
    ↓
Click "Post to X" on the Shopify article
    ↓
API sends tweet: "From Zero to First Sale... [link]"
    ↓
Tweet appears on your @mansati X account
```

Same flow for LinkedIn.

---

## Setup Required (One Time)

### For X (Twitter)

1. Go to [developer.x.com](https://developer.x.com)
2. Create a developer account (free)
3. Create a new project and app
4. Generate these 4 keys:
   - API Key
   - API Secret
   - Access Token
   - Access Token Secret
5. Add them to your `.env.local`:

```
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_token_secret
```

### For LinkedIn

1. Go to [linkedin.com/developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Request the `w_member_social` permission
4. Generate an access token
5. Find your LinkedIn Person ID (from your profile URL or API)
6. Add to `.env.local`:

```
LINKEDIN_ACCESS_TOKEN=your_access_token
LINKEDIN_PERSON_ID=your_person_id
```

---

## How To Use

1. Open your website at `/admin/social`
2. You'll see all 16 articles listed
3. Click **"Post to X"** → article is posted to your X/Twitter account
4. Click **"Post to LinkedIn"** → article is posted to your LinkedIn profile
5. Status shows "Posted!" (green) or error message (red)

---

## What Gets Posted

### On X (Twitter)
```
From Zero to First Sale: Building a Shopify Store for the Saudi Market

A comprehensive guide to creating a Shopify store for the Saudi market.

https://mansati.com/article-shopify-saudi
```

### On LinkedIn
A rich post with:
- Your caption (title + description)
- Article link preview card (uses the OG tags from Step 7)
- Thumbnail image from the article

---

## How You Benefit

| Without This | With This |
|-------------|-----------|
| Manually copy article title, write a tweet, paste the link | One click |
| Forget to post some articles | All articles visible on one page |
| Inconsistent formatting across posts | Every post has the same professional format |
| No way to track which articles were posted | Status shows "Posted!" after successful post |

---

## Security

- The admin page is accessible at `/admin/social` — it has **no authentication**
- Anyone who knows the URL can see it (but can't post without API keys)
- The API keys are in `.env.local` (server-side only, never exposed to the browser)
- For production, consider adding basic authentication or restricting the route

---

## Files Created

| File | What |
|------|------|
| `src/app/api/social/x/route.ts` | API route that posts to X/Twitter using OAuth 1.0a |
| `src/app/api/social/linkedin/route.ts` | API route that posts to LinkedIn using OAuth 2.0 |
| `src/app/[locale]/admin/social/page.tsx` | Admin page with article list and post buttons |
| `src/styles/admin-social.css` | Admin page styling |
| `src/config/articles.ts` | Article registry (titles, slugs, images, categories) |

---

## Adding New Articles

When you write a new article:

1. Add the article page as usual
2. Add an entry to `src/config/articles.ts`:

```ts
{
  slug: 'new-article-slug',
  title: 'Your New Article Title',
  description: 'Short description for social media posts.',
  image: '/assets/articles/new-article-image.webp',
  category: 'Category Name',
},
```

3. The article automatically appears on the admin social posting page
4. Click the buttons to post it to X and LinkedIn

---

## Best Practices for Posting

| Tip | Why |
|-----|-----|
| Post to X and LinkedIn at different times | Each platform has different peak hours |
| Post X in the morning (9-11 AM Saudi time) | Highest engagement for business content |
| Post LinkedIn on Tuesday-Thursday | Business professionals are most active mid-week |
| Don't post all 16 articles at once | Space them out, 2-3 per week |
| Repost top-performing articles monthly | Evergreen content deserves multiple posts |
