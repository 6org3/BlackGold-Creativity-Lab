import { assertContentWorkflowEnabled, routeError, systemOSFetch } from '../../../../../../../lib/system-os';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    assertContentWorkflowEnabled();
    const { templateId } = await params;
    if (!/^tpl-[a-z0-9][a-z0-9-]{2,62}$/.test(templateId)) {
      return Response.json({ ok: false, error: 'template_id inválido' }, { status: 400 });
    }
    const body = await request.json();
    return Response.json(await systemOSFetch(`/content/templates/${templateId}/actions`, {
      method: 'POST', body: JSON.stringify(body),
    }));
  } catch (error) {
    return routeError(error);
  }
}
