import { NextResponse } from 'next/server';
import { ContentService } from '@/lib/services/content.service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    const contentService = new ContentService();
    const result = await contentService.processRazorpayWebhook(rawBody, signature);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Webhook verification failed' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      status: 'ok',
      received: true,
      event: result.event,
      contributionId: result.contribution?.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
