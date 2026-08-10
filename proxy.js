import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from './lib/session';

const LEGACY_MUAPI_PATHS = [
  '/studio',
  '/agents',
  '/assistant',
  '/workflow',
  '/api/agents',
  '/api/api/v1',
  '/api/app',
  '/api/v1',
  '/api/workflow',
];

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/icon.svg'];

function secure(response) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  );
  return response;
}

function isPublic(pathname) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function unauthenticated(request) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return secure(
      NextResponse.json(
        { ok: false, error: 'authentication_required', message: 'Inicia sesión en Creativity Lab.' },
        { status: 401 },
      ),
    );
  }

  const loginUrl = new URL('/login', request.url);
  return secure(NextResponse.redirect(loginUrl));
}

export async function proxy(request) {
  const pathname = request.nextUrl.pathname;
  const sessionSecret = process.env.CREATIVITY_LAB_SESSION_SECRET;

  if (!sessionSecret || sessionSecret.length < 32) {
    return secure(
      NextResponse.json(
        { ok: false, error: 'session_not_configured', message: 'Falta configurar la sesión segura.' },
        { status: 503 },
      ),
    );
  }

  if (!isPublic(pathname)) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!(await verifySessionToken(token, sessionSecret))) {
      return unauthenticated(request);
    }
  }

  const legacyMuApi = LEGACY_MUAPI_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  if (legacyMuApi && process.env.ENABLE_MUAPI !== 'true') {
    return secure(
      NextResponse.json(
        {
          ok: false,
          error: 'premium_provider_disabled',
          message: 'MuAPI está aislado. Usa System OS o habilita el proveedor premium de forma explícita.',
        },
        { status: 503 },
      ),
    );
  }

  return secure(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
