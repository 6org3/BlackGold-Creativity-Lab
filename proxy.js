import { NextResponse } from 'next/server';

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

function unauthorized() {
  const response = new NextResponse('Autenticación requerida', { status: 401 });
  response.headers.set('WWW-Authenticate', 'Basic realm="BlackGold Creativity Lab", charset="UTF-8"');
  return secure(response);
}

export function proxy(request) {
  const user = process.env.CREATIVITY_LAB_USER;
  const password = process.env.CREATIVITY_LAB_PASSWORD;
  if (user && password) {
    const expected = `Basic ${btoa(`${user}:${password}`)}`;
    if (request.headers.get('authorization') !== expected) {
      return unauthorized();
    }
  }

  const legacyMuApi = LEGACY_MUAPI_PATHS.some((path) =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`),
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
