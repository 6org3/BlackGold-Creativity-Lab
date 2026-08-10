import { assertContentWorkflowEnabled, routeError, systemOSFetch } from '../../../../../../lib/system-os';

export const dynamic = 'force-dynamic';

function valid(value) {
  return /^tpl-[a-z0-9][a-z0-9-]{2,62}$/.test(value);
}

export async function GET(request, { params }) {
  try {
    assertContentWorkflowEnabled();
    const { templateId } = await params;
    if (!valid(templateId)) return Response.json({ ok: false, error: 'template_id inválido' }, { status: 400 });
    const version = new URL(request.url).searchParams.get('version');
    return Response.json(await systemOSFetch(`/content/templates/${templateId}${version ? `?version=${encodeURIComponent(version)}` : ''}`));
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    assertContentWorkflowEnabled();
    const { templateId } = await params;
    if (!valid(templateId)) return Response.json({ ok: false, error: 'template_id inválido' }, { status: 400 });
    const body = await request.json();
    return Response.json(
      await systemOSFetch(`/content/templates/${templateId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    );
  } catch (error) {
    return routeError(error);
  }
}
