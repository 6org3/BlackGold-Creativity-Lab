import { assertContentWorkflowEnabled, routeError, systemOSFetch } from '../../../../../../../lib/system-os';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    assertContentWorkflowEnabled();
    const { contentId } = await params;
    if (!/^cnt-[A-Za-z0-9TZ-]+$/.test(contentId)) {
      return Response.json({ ok: false, error: 'content_item_id inválido' }, { status: 400 });
    }
    const body = await request.json();
    const payload = await systemOSFetch(`/content/items/${contentId}/actions`, {
      method: 'POST', body: JSON.stringify(body),
    });
    return Response.json(payload, { status: body.action === 'send_to_production' ? 202 : 200 });
  } catch (error) {
    return routeError(error);
  }
}
