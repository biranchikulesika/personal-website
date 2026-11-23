import { NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/razorpay';
import { sanitizeErrorMessage } from '@/lib/errors';
import { CreateOrderSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** The amount is fixed here; the browser is only ever given a server-created order id. */
export async function POST(request: Request) {
  try {
    const parsed = CreateOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const order = await createRazorpayOrder({
      amountPaise: parsed.data.amount * 100,
      receipt: `patronage_${Date.now().toString(36)}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, 'Unable to start payment') },
      { status: 500 },
    );
  }
}
