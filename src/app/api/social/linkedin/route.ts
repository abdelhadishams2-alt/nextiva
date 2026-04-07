import { NextRequest, NextResponse } from 'next/server';
import { SITE_CONFIG } from '@/config/site';

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('X-Admin-Secret');
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug, title, description } = await req.json();

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personId = process.env.LINKEDIN_PERSON_ID;

  if (!accessToken || !personId) {
    return NextResponse.json(
      { error: 'LinkedIn API credentials not configured. Add LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_ID to .env.local' },
      { status: 500 }
    );
  }

  const articleUrl = `${SITE_CONFIG.url}/${slug}`;

  try {
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: `${title}\n\n${description}\n\nRead more:` },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                originalUrl: articleUrl,
                title: { text: title },
                description: { text: description },
              },
            ],
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'LinkedIn API error', details: data }, { status: response.status });
    }

    return NextResponse.json({ success: true, postId: data.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to post to LinkedIn', details: String(error) }, { status: 500 });
  }
}
