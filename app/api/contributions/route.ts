import { NextResponse } from 'next/server';
import { ContentService } from '@/lib/services/content.service';

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
      source,
    } = body;

    if (!paymentId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'paymentId and positive amount are required' },
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
      source: source || (orderId || signature ? 'razorpay' : 'mock'),
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
