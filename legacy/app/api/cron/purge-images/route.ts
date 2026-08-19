import { NextResponse } from 'next/server';
import { ImageCleanupService } from '@/lib/services/image-cleanup.service';

export const dynamic = 'force-dynamic';

function verifyCronAuth(request: Request): boolean {
  // In development, allow testing without auth header
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Also check query param fallback for simple webhook integrations
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');
  if (cronSecret && secretParam === cronSecret) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';
    const retentionDaysParam = url.searchParams.get('retentionDays');
    const retentionDays = retentionDaysParam ? parseInt(retentionDaysParam, 10) : undefined;

    const cleanupService = new ImageCleanupService(retentionDays);
    const result = await cleanupService.runCleanup({ dryRun, retentionDays });

    return NextResponse.json(result, { status: result.success ? 200 : 207 });
  } catch (err: any) {
    console.error('Cron purge-images execution error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}

