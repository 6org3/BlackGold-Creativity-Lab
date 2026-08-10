import { assertContentWorkflowEnabled, routeError, systemOSFetch } from '../../../../../lib/system-os';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    assertContentWorkflowEnabled();
    const source = new URL(request.url).searchParams;
    const query = new URLSearchParams();
    for (const key of ['status', 'objective', 'pillar', 'platform']) {
      if (source.get(key)) query.set(key, source.get(key));
    }
    return Response.json(await systemOSFetch(`/content/templates?${query}`));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request) {
  try {
    assertContentWorkflowEnabled();
    const body = await request.json();
    return Response.json(
      await systemOSFetch('/content/templates', { method: 'POST', body: JSON.stringify(body) }),
      { status: 201 },
    );
  } catch (error) {
    return routeError(error);
  }
}
