import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/lib/session';

export const runtime = 'nodejs';

function constantTimeEqual(received, expected, secret) {
  const left = createHmac('sha256', secret).update(received).digest();
  const right = createHmac('sha256', secret).update(expected).digest();
  return timingSafeEqual(left, right);
}

function loginRedirect(request, error) {
  const url = new URL('/login', request.url);
  url.searchParams.set('error', error);
  return NextResponse.redirect(url, 303);
}

export async function POST(request) {
  const expectedUser = process.env.CREATIVITY_LAB_USER;
  const expectedPassword = process.env.CREATIVITY_LAB_PASSWORD;
  const sessionSecret = process.env.CREATIVITY_LAB_SESSION_SECRET;

  if (!expectedUser || !expectedPassword || !sessionSecret || sessionSecret.length < 32) {
    return loginRedirect(request, 'config');
  }

  const form = await request.formData();
  const user = String(form.get('user') ?? '');
  const password = String(form.get('password') ?? '');
  const validUser = constantTimeEqual(user, expectedUser, sessionSecret);
  const validPassword = constantTimeEqual(password, expectedPassword, sessionSecret);

  if (!validUser || !validPassword) {
    return loginRedirect(request, 'credentials');
  }

  const response = NextResponse.redirect(new URL('/', request.url), 303);
  const forwardedProtocol = request.headers.get('x-forwarded-proto');
  response.cookies.set(SESSION_COOKIE, await createSessionToken(sessionSecret), {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: forwardedProtocol === 'https:' || forwardedProtocol === 'https',
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
