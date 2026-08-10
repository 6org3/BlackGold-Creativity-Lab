import fs from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const contentRoot = process.env.CONTENT_ARTIFACT_ROOT || '/content/results';
const contentTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export async function GET(_request, { params }) {
  const { jobId, filename } = await params;
  if (!/^img-[A-Za-z0-9TZ-]+$/.test(jobId) || !/^[A-Za-z0-9][A-Za-z0-9_.-]{2,180}$/.test(filename)) {
    return Response.json({ ok: false, error: 'artifact inválido' }, { status: 400 });
  }
  const extension = path.extname(filename).toLowerCase();
  if (!contentTypes[extension]) {
    return Response.json({ ok: false, error: 'tipo no permitido' }, { status: 415 });
  }
  const root = path.resolve(contentRoot, jobId);
  const target = path.resolve(root, filename);
  if (path.dirname(target) !== root) {
    return Response.json({ ok: false, error: 'ruta inválida' }, { status: 400 });
  }
  try {
    const bytes = await fs.readFile(/* turbopackIgnore: true */ target);
    return new Response(bytes, {
      headers: {
        'Content-Type': contentTypes[extension],
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return Response.json({ ok: false, error: 'artifact no encontrado' }, { status: 404 });
  }
}
