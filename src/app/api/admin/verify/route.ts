import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return NextResponse.json(
      { error: 'ADMIN_SECRET not configured on the server.' },
      { status: 500 }
    );
  }

  if (secret !== adminSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
