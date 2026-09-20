import { NextResponse } from 'next/server';
import { ContentService } from '@/lib/services/content.service';
import { getAuthService } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      paymentId,
      orderId,
      signature,
      amount,
      name,
      email,
      note,
      source = 'razorpay',
    } = body;

    if (!paymentId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'paymentId and positive amount are required' },
        { status: 400 },
      );
    }

    // Manual/offline contributions require authenticated administrative privileges
    if (source === 'manual') {
      let isAuthorized = false;
      try {
        const authService = getAuthService();
        await authService.requireAdmin();
        isAuthorized = true;
      } catch {
        isAuthorized = false;
      }

      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'Unauthorized: Manual contribution recording requires administrative privileges' },
          { status: 403 },
        );
      }
    } else if (source === 'razorpay') {
      // Razorpay payments MUST carry a verifiable signature. If the key secret
      // is unconfigured, there is no way to verify authenticity, so reject
      // rather than record unauthenticated contributions.
      if (!process.env.RAZORPAY_KEY_SECRET) {
        return NextResponse.json(
          { error: 'Payment verification is not configured on server' },
          { status: 500 },
        );
      }
      if (!orderId || !signature) {
        return NextResponse.json(
          { error: 'orderId and signature are required for Razorpay payment verification' },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid contribution source' },
        { status: 400 },
      );
    }

    const contentService = new ContentService();
    const contribution = await contentService.confirmPayment({
      paymentId,
      orderId,
      signature,
      amount,
      name,
      email,
      note,
      source,
    });

    return NextResponse.json({
      success: true,
      contribution,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to confirm payment';
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // Prevent unauthenticated dumping of entire contributor database
  if (!id) {
    return NextResponse.json(
      { error: 'Unauthorized: id parameter is required' },
      { status: 403 },
    );
  }

  const contentService = new ContentService();
  const contribution = await contentService.getContribution(id);

  if (!contribution) {
    return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
  }

  // Sanitize response to return only public confirmation fields, omitting donor email and internal notes
  const publicConfirmation = {
    id: contribution.id,
    amount: contribution.amount,
    currency: contribution.currency,
    status: contribution.status,
    name: contribution.name,
    createdAt: contribution.createdAt,
  };

  return NextResponse.json({ contribution: publicConfirmation });
}
