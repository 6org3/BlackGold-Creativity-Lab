import { routeError, systemOSFetch } from '../../../../lib/system-os';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const limit = Math.max(1, Math.min(Number(new URL(request.url).searchParams.get('limit')) || 24, 60));
    return Response.json(await systemOSFetch(`/jobs?limit=${limit}`));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request) {
  try {
    const body = { ...(await request.json()), delivery_mode: 'none', publish_allowed: false };
    return Response.json(
      await systemOSFetch('/jobs', { method: 'POST', body: JSON.stringify(body) }),
      { status: 202 },
    );
  } catch (error) {
    return routeError(error);
  }
}
