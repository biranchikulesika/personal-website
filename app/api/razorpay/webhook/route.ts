import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyText)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(bodyText);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = String(payment.order_id);
      const paymentId = String(payment.id);

      const admin = getSupabaseAdmin();
      
      // Update donation status to success
      const { error: dbError } = await admin
        .from('donations')
        .update({
          status: 'success',
          razorpayPaymentId: paymentId
        })
        .eq('razorpayOrderId', orderId);

      if (dbError) {
        console.error('Webhook DB Update Error:', dbError);
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
