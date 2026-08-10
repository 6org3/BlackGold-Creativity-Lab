import 'server-only';

const baseUrl = (process.env.SYSTEM_OS_URL || 'http://127.0.0.1:8790').replace(/\/$/, '');
const token = process.env.CONTENT_SHARED_TOKEN || '';

export async function systemOSFetch(path, options = {}) {
  if (!token) {
    throw new Error('CONTENT_SHARED_TOKEN no está configurado');
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Token': token,
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(8000),
  });
  const payload = await response.json().catch(() => ({ ok: false, error: 'invalid_response' }));
  if (!response.ok) {
    const error = new Error(payload.error || `System OS respondió ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function routeError(error) {
  const status = Number.isInteger(error?.status) ? error.status : 502;
  return Response.json(
    { ok: false, error: error?.message || 'No se pudo contactar System OS' },
    { status },
  );
}

export function assertContentWorkflowEnabled() {
  if (process.env.CONTENT_WORKFLOW_V1 !== 'true') {
    const error = new Error('El Social Media Content Workflow no está habilitado en este entorno');
    error.status = 404;
    throw error;
  }
}
