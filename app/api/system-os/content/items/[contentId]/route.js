import { assertContentWorkflowEnabled, routeError, systemOSFetch } from '../../../../../../lib/system-os';

export const dynamic = 'force-dynamic';

function valid(value) {
  return /^cnt-[A-Za-z0-9TZ-]+$/.test(value);
}

export async function GET(_request, { params }) {
  try {
    assertContentWorkflowEnabled();
    const { contentId } = await params;
    if (!valid(contentId)) return Response.json({ ok: false, error: 'content_item_id inválido' }, { status: 400 });
    return Response.json(await systemOSFetch(`/content/items/${contentId}`));
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    assertContentWorkflowEnabled();
    const { contentId } = await params;
    if (!valid(contentId)) return Response.json({ ok: false, error: 'content_item_id inválido' }, { status: 400 });
    const body = await request.json();
    return Response.json(
      await systemOSFetch(`/content/items/${contentId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    );
  } catch (error) {
    return routeError(error);
  }
}
