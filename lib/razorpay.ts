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

/** Server-side Razorpay credentials. The key id is public; the secret is not. */
function getRazorpayCredentials(): { keyId: string; secret: string } | null {
  const keyId =
    process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return keyId && secret ? { keyId, secret } : null;
}

async function razorpayApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const credentials = getRazorpayCredentials();
  if (!credentials) throw new Error('Razorpay is not configured on server');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://api.razorpay.com/v1${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${Buffer.from(`${credentials.keyId}:${credentials.secret}`).toString('base64')}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      // Never log the response body — it can contain account details.
      throw new Error(`Razorpay API request failed (${response.status})`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

/** Create an order on Razorpay so the amount is fixed server-side before checkout. */
export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const order = await razorpayApi<{
    id: string;
    amount: number;
    currency: string;
  }>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: 'INR',
      receipt: input.receipt,
      notes: input.notes || {},
    }),
  });
  if (!order.id || order.amount !== input.amountPaise) {
    throw new Error('Razorpay returned an unexpected order');
  }
  return { id: order.id, amount: order.amount, currency: order.currency };
}

/**
 * Re-read an order from Razorpay. The client signature only covers
 * order_id|payment_id, so this is how the server proves the amount.
 */
export async function getRazorpayOrder(
  orderId: string,
): Promise<{ id: string; amount: number; currency: string }> {
  const order = await razorpayApi<{
    id: string;
    amount: number;
    currency: string;
  }>(`/orders/${encodeURIComponent(orderId)}`);
  if (!order.id || !Number.isFinite(order.amount)) {
    throw new Error('Razorpay returned an unexpected order');
  }
  return { id: order.id, amount: order.amount, currency: order.currency };
}

/** Razorpay's stable event id, used to make webhook handling exactly-once. */
export function extractWebhookEventId(
  payload: Record<string, unknown>,
): string | null {
  const candidates = [
    payload.event_id,
    payload.id,
    (payload.payload as Record<string, unknown> | undefined)?.event_id,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && /^[A-Za-z0-9_-]{1,200}$/.test(value)) {
      return value;
    }
  }
  return null;
}

/**
 * Parse and normalize Razorpay webhook payload into a Contribution domain object.
 * Handles `payment.captured`, `order.paid`, `payment.authorized`, and refunds.
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
  const refundEntity = (contains.refund as { entity?: Record<string, unknown> })?.entity;

  if (!paymentEntity && !orderEntity && !refundEntity) {
    return { event, contribution: null };
  }

  const isRefund = event.startsWith('refund.');
  const paymentId =
    (paymentEntity?.id as string) ||
    (refundEntity?.payment_id as string) ||
    undefined;
  const orderId =
    (paymentEntity?.order_id as string) ||
    (orderEntity?.id as string) ||
    undefined;

  const rawAmount =
    (paymentEntity?.amount as number) ||
    (orderEntity?.amount as number) ||
    0;

  // Razorpay amounts are in paise (1 INR = 100 paise); keep paise precision.
  const amountInRupees = rawAmount / 100;

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
    isRefund
      ? 'refunded'
      : event === 'payment.captured' || event === 'order.paid'
        ? 'captured'
        : event === 'payment.failed'
          ? 'failed'
          : 'pending';

  // Without a stable provider id we cannot deduplicate or correlate rows.
  if (!paymentId && !orderId) return { event, contribution: null };

  const id: string = paymentId || orderId || '';
  const createdAt = paymentEntity?.created_at
    ? new Date((paymentEntity.created_at as number) * 1000).toISOString()
    : new Date().toISOString();

  const contribution: Contribution = {
    id,
    orderId,
    paymentId,
    amount: amountInRupees,
    currency: typeof paymentEntity?.currency === 'string' ? paymentEntity.currency : 'INR',
    status,
    name,
    email,
    note,
    createdAt,
    source: 'razorpay',
  };

  return { event, contribution };
}
