export const SESSION_COOKIE = 'bg_creativity_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

const encoder = new TextEncoder();

function toBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function fromBase64Url(value) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sessionKey(secret, usages) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages,
  );
}

export async function createSessionToken(secret, ttlSeconds = SESSION_TTL_SECONDS) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const key = await sessionKey(secret, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(String(expiresAt)));
  return `${expiresAt}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(token, secret) {
  if (!token || !secret) return false;
  const [expiresAt, encodedSignature, extra] = token.split('.');
  if (extra || !/^\d+$/u.test(expiresAt) || !encodedSignature) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;

  try {
    const key = await sessionKey(secret, ['verify']);
    return crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(encodedSignature),
      encoder.encode(expiresAt),
    );
  } catch {
    return false;
  }
}
