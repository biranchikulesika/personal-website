import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/razorpay';

export async function POST(req: Request) {
  const bodyText = await req.text().catch(() => '');
  const signature = req.headers.get('x-razorpay-signature');

  if (!signature || !verifyWebhookSignature(bodyText, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (event?.event === 'payment.captured') {
    return handlePaymentCaptured(event);
  }

  if (event?.event === 'payment.failed') {
    return handlePaymentFailed(event);
  }

  return NextResponse.json({ status: 'ok' });
}

async function handlePaymentCaptured(event: any) {
  const payment = event.payload?.payment?.entity;
  if (!payment) {
    return NextResponse.json({ status: 'ok' });
  }

  const orderId = String(payment.order_id);
  const paymentId = String(payment.id);
  const amountPaise = Number(payment.amount);
  const currency = payment.currency;

  if (currency && currency !== 'INR') {
    console.warn(`Webhook currency for order ${orderId}: ${currency} (expected INR)`);
  }

  const admin = getSupabaseAdmin();

  try {
    const { data: existing, error: fetchError } = await admin
      .from('donations')
      .select('*')
      .eq('razorpayOrderId', orderId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      if (existing.amount && Math.round(Number(existing.amount) * 100) !== amountPaise) {
        console.warn(
          `Webhook amount mismatch for order ${orderId}: recorded ${existing.amount}, captured ${(amountPaise / 100).toFixed(2)}`
        );
      }

      if (existing.status !== 'success') {
        const { error: updateError } = await admin
          .from('donations')
          .update({ status: 'success', razorpayPaymentId: paymentId })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      }

      return NextResponse.json({ status: 'ok' });
    }

    // No pending row (e.g. the create-order insert failed or the row was
    // pruned). Insert the donation so the payment is never lost. A duplicate
    // webhook delivery may race this insert — fall back to an update then.
    const { error: insertError } = await admin
      .from('donations')
      .insert({
        amount: amountPaise / 100,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        status: 'success',
      } as any);

    if (insertError) {
      if (String(insertError.code) === '23505') {
        const { error: updateError } = await admin
          .from('donations')
          .update({ status: 'success', razorpayPaymentId: paymentId })
          .eq('razorpayOrderId', orderId);

        if (updateError) throw updateError;
      } else {
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Webhook payment.captured DB error:', error);
    // Non-2xx so Razorpay retries the delivery.
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }

  return NextResponse.json({ status: 'ok' });
}

async function handlePaymentFailed(event: any) {
  const payment = event.payload?.payment?.entity;
  if (!payment) {
    return NextResponse.json({ status: 'ok' });
  }

  const orderId = String(payment.order_id);
  const admin = getSupabaseAdmin();

  try {
    const { error } = await admin
      .from('donations')
      .update({ status: 'failed' })
      .eq('razorpayOrderId', orderId)
      .eq('status', 'pending');

    if (error) throw error;
  } catch (error) {
    console.error('Webhook payment.failed DB error:', error);
    return NextResponse.json({ error: 'Failed to record failure' }, { status: 500 });
  }

  return NextResponse.json({ status: 'ok' });
}