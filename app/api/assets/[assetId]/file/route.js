import assetLibrary from '../../../../../lib/asset-library';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const { getUploadedFile } = assetLibrary;

export async function GET(_request, { params }) {
  try {
    const { assetId } = await params;
    const { asset, path, size } = await getUploadedFile(assetId);
    const disposition = asset.kind === 'image' ? 'inline' : 'attachment';
    return new Response(Readable.toWeb(createReadStream(path)), {
      headers: {
        'Content-Type': asset.content_type,
        'Content-Length': String(size),
        'Content-Disposition': `${disposition}; filename="${asset.safe_name}"`,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    const message = status < 500 ? error.message : 'No se pudo leer el archivo.';
    return Response.json({ ok: false, error: message }, { status });
  }
}
