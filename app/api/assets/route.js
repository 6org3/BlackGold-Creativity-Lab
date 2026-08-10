import assetLibrary from '../../../lib/asset-library';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const { createUploadsFromRequest, readIndex, readJsonRequest, upsertGeneratedAsset } = assetLibrary;

function errorResponse(error) {
  const status = Number.isInteger(error?.status) ? error.status : 500;
  const message = status < 500 || status === 507 ? error.message : 'No se pudo gestionar el archivo.';
  return Response.json({ ok: false, error: message }, { status });
}

export async function GET() {
  try {
    return Response.json({ ok: true, assets: await readIndex() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const asset = await upsertGeneratedAsset(await readJsonRequest(request));
      return Response.json({ ok: true, asset });
    }
    if (!contentType.includes('multipart/form-data')) {
      return Response.json({ ok: false, error: 'Tipo de contenido no permitido.' }, { status: 415 });
    }
    const assets = await createUploadsFromRequest(request);
    return Response.json({ ok: true, assets }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
