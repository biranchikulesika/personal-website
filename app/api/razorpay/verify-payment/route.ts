import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyPaymentSignature } from '@/lib/razorpay';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const paymentId = body.razorpay_payment_id;
    const orderId = body.razorpay_order_id;
    const signature = body.razorpay_signature;

    if (!paymentId || !orderId || !signature) {
      return NextResponse.json({ verified: false, error: 'Missing fields' }, { status: 400 });
    }

    if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
      return NextResponse.json({ verified: false, error: 'Invalid signature' }, { status: 400 });
    }

    // Belt-and-suspenders to the webhook: record the payment immediately if
    // the pending donation row exists (the webhook still covers the general
    // case and any rows missing because create-order failed to insert them).
    const admin = getSupabaseAdmin();
    const { data: existing, error: fetchError } = await admin
      .from('donations')
      .select('*')
      .eq('razorpayOrderId', orderId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing && existing.status !== 'success') {
      const { error: updateError } = await admin
        .from('donations')
        .update({ status: 'success', razorpayPaymentId: paymentId })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    }

    return NextResponse.json({ verified: true, paymentId });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ verified: false, error: 'Internal Server Error' }, { status: 500 });
  }
}