import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { password } = await request.json();
  const secret = process.env['ADMIN_SECRET'];

  if (!secret || password !== secret) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieStore = await cookies();

  cookieStore.set('admin_session', secret, {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return NextResponse.json({ ok: true });
}
