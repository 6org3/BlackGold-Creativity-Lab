import { routeError, systemOSFetch } from '../../../../../lib/system-os';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    const { jobId } = await params;
    if (!/^img-[A-Za-z0-9TZ-]+$/.test(jobId)) {
      return Response.json({ ok: false, error: 'job_id inválido' }, { status: 400 });
    }
    return Response.json(await systemOSFetch(`/jobs/${jobId}`));
  } catch (error) {
    return routeError(error);
  }
}
