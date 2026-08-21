import crypto from 'node:crypto';
import type { Contribution } from '@/lib/types';

/**
 * Verify Razorpay payment signature from client checkout modal.
 *
 * Formula: HMAC_SHA256(order_id + "|" + razorpay_payment_id, secret) == razorpay_signature
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret?: string;
}): boolean {
  const secret = params.secret || process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !params.orderId || !params.paymentId || !params.signature) {
    return false;
  }

  try {
    const text = `${params.orderId}|${params.paymentId}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'utf8');
    const signatureBuf = Buffer.from(params.signature, 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}

/**
 * Verify Razorpay webhook signature from X-Razorpay-Signature header.
 *
 * Formula: HMAC_SHA256(raw_request_body, webhook_secret) == x_razorpay_signature
 */
export function verifyWebhookSignature(params: {
  rawBody: string;
  signature: string;
  secret?: string;
}): boolean {
  const secret = params.secret || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !params.rawBody || !params.signature) {
    return false;
  }

  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(params.rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'utf8');
    const signatureBuf = Buffer.from(params.signature, 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}

/**
 * Parse and normalize Razorpay webhook payload into a Contribution domain object.
 * Handles `payment.captured`, `order.paid`, and `payment.authorized` events.
 */
export function parseRazorpayWebhookEvent(payload: Record<string, unknown>): {
  event: string;
  contribution: Contribution | null;
} {
  const event = (payload.event as string) || 'unknown';
  const contains = payload.payload as Record<string, unknown> | undefined;

  if (!contains) {
    return { event, contribution: null };
  }

  const paymentEntity = (contains.payment as { entity?: Record<string, unknown> })?.entity;
  const orderEntity = (contains.order as { entity?: Record<string, unknown> })?.entity;

  if (!paymentEntity && !orderEntity) {
    return { event, contribution: null };
  }

  const paymentId = (paymentEntity?.id as string) || undefined;
  const orderId =
    (paymentEntity?.order_id as string) ||
    (orderEntity?.id as string) ||
    undefined;

  const rawAmount =
    (paymentEntity?.amount as number) ||
    (orderEntity?.amount as number) ||
    0;

  // Razorpay amounts are in paise (1 INR = 100 paise)
  const amountInRupees = Math.round(rawAmount / 100);

  const notes =
    (paymentEntity?.notes as Record<string, string>) ||
    (orderEntity?.notes as Record<string, string>) ||
    {};

  const name =
    notes.name ||
    notes.patronName ||
    (paymentEntity?.description as string) ||
    'Anonymous Patron';

  const email =
    (paymentEntity?.email as string) ||
    notes.email ||
    undefined;

  const note =
    notes.note ||
    notes.message ||
    undefined;

  const status: Contribution['status'] =
    event === 'payment.captured' || event === 'order.paid'
      ? 'captured'
      : event === 'payment.failed'
        ? 'failed'
        : 'pending';

  const id = paymentId || orderId || `contrib_${Date.now()}`;
  const createdAt = paymentEntity?.created_at
    ? new Date((paymentEntity.created_at as number) * 1000).toISOString()
    : new Date().toISOString();

  const contribution: Contribution = {
    id,
    orderId,
    paymentId,
    amount: amountInRupees,
    currency: (paymentEntity?.currency as string) || 'INR',
    status,
    name,
    email,
    note,
    createdAt,
    source: 'razorpay',
  };

  return { event, contribution };
}
