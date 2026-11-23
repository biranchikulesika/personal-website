import { NextResponse } from 'next/server';
import { ContentService } from '@/lib/services/content.service';
import { getAuthService } from '@/lib/auth';
import { sanitizeErrorMessage } from '@/lib/errors';
import {
  ContributionRequestSchema,
  PaymentLookupSchema,
} from '@/lib/validation';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const allowed = await checkRateLimit(
      rateLimitKey(request, 'contributions'),
      10,
      600,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = ContributionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid contribution payload' },
        { status: 400 },
      );
    }

    const {
      paymentId,
      orderId,
      signature,
      amount,
      name,
      email,
      note,
      source,
    } = parsed.data;

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

    // Same public shape as GET: never echo donor email or private notes.
    return NextResponse.json({
      success: true,
      contribution: {
        id: contribution.id,
        amount: contribution.amount,
        currency: contribution.currency,
        status: contribution.status,
        name: contribution.name,
        createdAt: contribution.createdAt,
      },
    });
  } catch (error) {
    const message = sanitizeErrorMessage(error, 'Failed to confirm payment');
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // Prevent unauthenticated dumping of entire contributor database and
  // reject characters that could alter the lookup query.
  const lookup = PaymentLookupSchema.safeParse({ id });
  if (!lookup.success) {
    return NextResponse.json(
      {
        error: id
          ? 'Invalid contribution id'
          : 'Unauthorized: id parameter is required',
      },
      { status: id ? 400 : 403 },
    );
  }

  const contentService = new ContentService();
  const contribution = await contentService.getContribution(lookup.data.id);

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
