import { NextResponse } from 'next/server';
import { ContentService } from '@/lib/services/content.service';
import { NewsletterSubscriberSchema } from '@/lib/validation';
import { getAuthService } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = NewsletterSubscriberSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessage =
        parsed.error.issues?.[0]?.message || 'Invalid email address';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const service = new ContentService();
    const result = await service.subscribeToNewsletter(
      parsed.data.email,
      parsed.data.source || 'website'
    );

    return NextResponse.json({
      success: true,
      message: result.message,
      subscriber: {
        id: result.subscriber.id,
        email: result.subscriber.email,
        createdAt: result.subscriber.createdAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Subscription failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    try {
      const authService = getAuthService();
      await authService.requireAdmin();
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const service = new ContentService();
    const subscribers = await service.getSubscribers();
    return NextResponse.json({
      success: true,
      count: subscribers.length,
      subscribers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to retrieve subscribers';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
