import { NextRequest, NextResponse } from 'next/server';
import { SITE_CONFIG } from '@/config/site';

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('X-Admin-Secret');
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug, title, description } = await req.json();

  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return NextResponse.json(
      { error: 'Twitter API credentials not configured. Add TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET to .env.local' },
      { status: 500 }
    );
  }

  const url = `${SITE_CONFIG.url}/${slug}`;
  const tweet = `${title}\n\n${description}\n\n${url}`;

  try {
    // Twitter API v2 - Create Tweet
    // Uses OAuth 1.0a User Context
    const crypto = await import('crypto');

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: apiKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: accessToken,
      oauth_version: '1.0',
    };

    const baseUrl = 'https://api.twitter.com/2/tweets';
    const paramString = Object.keys(oauthParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`)
      .join('&');

    const signatureBase = `POST&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`;
    const signature = crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64');

    oauthParams['oauth_signature'] = signature;

    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
      .join(', ');

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: tweet }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Twitter API error', details: data }, { status: response.status });
    }

    return NextResponse.json({ success: true, tweetId: data.data?.id, url: `https://x.com/lkwjd/status/${data.data?.id}` });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to post to X', details: String(error) }, { status: 500 });
  }
}
