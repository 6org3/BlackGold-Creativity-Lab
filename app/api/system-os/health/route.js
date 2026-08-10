import fs from 'node:fs';
import { routeError, systemOSFetch } from '../../../../lib/system-os';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dispatcher = await systemOSFetch('/health');
    const driveConfig = process.env.RCLONE_CONFIG || '/rclone/rclone.conf';
    return Response.json({
      ok: true,
      dispatcher: dispatcher.ok,
      drive: fs.existsSync(/* turbopackIgnore: true */ driveConfig),
      provider: 'System OS + ComfyUI',
      premium: process.env.ENABLE_MUAPI === 'true',
    });
  } catch (error) {
    return routeError(error);
  }
}
