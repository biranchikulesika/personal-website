import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getRazorpay } from '@/lib/razorpay';

export async function POST(req: Request) {
  try {
    const { amount, name, email, phone } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    let razorpay;
    try {
      razorpay = getRazorpay();
    } catch {
      return NextResponse.json({ error: 'Razorpay keys missing' }, { status: 500 });
    }

    const orderOptions = {
      amount: Math.round(amount * 100), // amount in paisa
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(orderOptions);

    // Save pending donation to database
    const admin = getSupabaseAdmin();
    const { error: dbError } = await admin.from('donations').insert({
      amount: amount,
      donorName: name || null,
      donorEmail: email || null,
      donorPhone: phone || null,
      razorpayOrderId: order.id,
      status: 'pending'
    } as any);

    if (dbError) {
      console.error('Error saving pending donation:', dbError);
      // The webhook upserts the donation by razorpayOrderId if this insert
      // failed, so the payment is still recorded when it gets captured.
    }

    return NextResponse.json({ orderId: order.id, amount: orderOptions.amount }, { status: 200 });

  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}