import briefAssistant from '../../../lib/brief-assistant';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const { generateBrief, loadCreativeContext } = briefAssistant;

export async function POST(request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 24 * 1024) return Response.json({ ok: false, error: 'El brief supera el límite permitido.' }, { status: 413 });
    const input = await request.json();
    const { context, mode } = await loadCreativeContext();
    return Response.json({ ok: true, ...generateBrief(input, context), context_mode: mode });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || 'No se pudo completar el brief.' }, { status: 400 });
  }
}
