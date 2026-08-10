import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

export function POST(request) {
  const response = NextResponse.redirect(new URL('/login', request.url), 303);
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/', sameSite: 'lax' });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
