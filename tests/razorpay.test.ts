import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import crypto from 'crypto';
import {
  verifyWebhookSignature,
  verifyPaymentSignature,
} from '../lib/razorpay';

describe('Razorpay signature verification', () => {
  const webhookSecret = 'whsec_test_secret';
  const keySecret = 'keysec_test_secret';

  test('1. verifyWebhookSignature accepts a valid HMAC over the raw body', () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
    const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_x' } } } });
    const sig = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
    assert.equal(verifyWebhookSignature(body, sig), true);
  });

  test('2. verifyWebhookSignature rejects a signature from a different secret', () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
    const body = JSON.stringify({ event: 'payment.captured' });
    const sig = crypto.createHmac('sha256', 'attacker-secret').update(body).digest('hex');
    assert.equal(verifyWebhookSignature(body, sig), false);
  });

  test('3. verifyWebhookSignature rejects a tampered body', () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
    const body = '{"event":"payment.captured"}';
    const sig = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
    assert.equal(verifyWebhookSignature(body + ' ', sig), false);
  });

  test('4. verifyWebhookSignature returns false when the secret is unset', () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    const body = '{"event":"payment.captured"}';
    const sig = crypto.createHmac('sha256', 'whatever').update(body).digest('hex');
    assert.equal(verifyWebhookSignature(body, sig), false);
  });

  test('5. verifyPaymentSignature accepts a valid order|payment signature', () => {
    process.env.RAZORPAY_KEY_SECRET = keySecret;
    const sig = crypto.createHmac('sha256', keySecret).update('order_pFxFzdLKg2CWF7|pay_M7WvFGk7rHGtGD').digest('hex');
    assert.equal(
      verifyPaymentSignature({ orderId: 'order_pFxFzdLKg2CWF7', paymentId: 'pay_M7WvFGk7rHGtGD', signature: sig }),
      true
    );
  });

  test('6. verifyPaymentSignature rejects when the payment id is swapped', () => {
    process.env.RAZORPAY_KEY_SECRET = keySecret;
    const sig = crypto.createHmac('sha256', keySecret).update('order_pFxFzdLKg2CWF7|pay_M7WvFGk7rHGtGD').digest('hex');
    assert.equal(
      verifyPaymentSignature({ orderId: 'order_pFxFzdLKg2CWF7', paymentId: 'pay_TAMPERED', signature: sig }),
      false
    );
  });

  test('7. verifyPaymentSignature rejects an invalid hex signature', () => {
    process.env.RAZORPAY_KEY_SECRET = keySecret;
    assert.equal(
      verifyPaymentSignature({ orderId: 'order_1', paymentId: 'pay_1', signature: 'not-hex!' }),
      false
    );
  });
});