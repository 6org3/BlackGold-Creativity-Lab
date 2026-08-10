const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Builds redirects against the canonical public origin. Reverse proxies may
 * expose the application to Next.js as localhost even when the browser is on
 * lab.blackgoldec.com, so request.url is only the development fallback.
 */
export function publicLocation(pathname, request) {
  const configuredOrigin = process.env.CREATIVITY_LAB_PUBLIC_URL?.trim();
  const fallback = new URL(request.url);

  if (!configuredOrigin) return new URL(pathname, fallback);

  try {
    const publicOrigin = new URL(configuredOrigin);
    if (!HTTP_PROTOCOLS.has(publicOrigin.protocol)) return new URL(pathname, fallback);
    return new URL(pathname, publicOrigin);
  } catch {
    return new URL(pathname, fallback);
  }
}
