import assetLibrary from '../../../../lib/asset-library';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const { readJsonRequest, updateAsset } = assetLibrary;

export async function PATCH(request, { params }) {
  try {
    const { assetId } = await params;
    if (!(request.headers.get('content-type') || '').includes('application/json')) {
      return Response.json({ ok: false, error: 'Tipo de contenido no permitido.' }, { status: 415 });
    }
    const asset = await updateAsset(assetId, await readJsonRequest(request));
    return Response.json({ ok: true, asset });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    const message = status < 500 ? error.message : 'No se pudo actualizar el archivo.';
    return Response.json({ ok: false, error: message }, { status });
  }
}
