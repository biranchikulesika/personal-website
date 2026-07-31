import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { amount, name, email, phone } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json({ error: 'Razorpay keys missing' }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

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
      // We still return the order so the payment can proceed, webhook can handle the rest if it misses.
    }

    return NextResponse.json({ orderId: order.id, amount: orderOptions.amount }, { status: 200 });

  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
