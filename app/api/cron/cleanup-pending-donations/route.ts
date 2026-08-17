import { NextResponse } from 'next/server';
import { DonationService } from '@/lib/services/donation.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const daysParam = url.searchParams.get('days');
    const olderThanDays = daysParam ? parseInt(daysParam, 10) : 30; // default to 1 month (30 days)

    if (isNaN(olderThanDays) || olderThanDays < 0) {
      return NextResponse.json({ error: 'Invalid days parameter' }, { status: 400 });
    }

    const donationService = new DonationService();
    const deletedCount = await donationService.deleteExpiredPending(olderThanDays);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} pending payment record(s) older than ${olderThanDays} days`,
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Cleanup pending donations cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
