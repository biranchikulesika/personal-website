import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ContentService } from '../lib/services/content.service';
import { NewsletterSubscriberSchema } from '../lib/validation';
import { setContentRepositoryForTesting } from '../lib/repositories';
import { InMemoryTestContentRepository } from './in-memory-test-content-repository';
import { POST, GET } from '../app/api/newsletter/route';

describe('Newsletter Subscribers', () => {
  let mockRepo: InMemoryTestContentRepository;
  let service: ContentService;

  beforeEach(() => {
    mockRepo = new InMemoryTestContentRepository();
    setContentRepositoryForTesting(mockRepo);
    service = new ContentService();
  });

  test('NewsletterSubscriberSchema accepts valid emails and normalizes them', () => {
    const parsed = NewsletterSubscriberSchema.parse({
      email: '  USER@Example.Com ',
      source: 'homepage',
    });
    assert.equal(parsed.email, 'user@example.com');
    assert.equal(parsed.source, 'homepage');
  });

  test('NewsletterSubscriberSchema rejects invalid emails', () => {
    assert.throws(() => {
      NewsletterSubscriberSchema.parse({ email: 'not-an-email' });
    });
    assert.throws(() => {
      NewsletterSubscriberSchema.parse({ email: '' });
    });
  });

  test('ContentService.subscribeToNewsletter stores subscriber into repository', async () => {
    const res = await service.subscribeToNewsletter('reader@example.com', 'hero');
    assert.equal(res.success, true);
    assert.equal(res.subscriber.email, 'reader@example.com');

    const subscribers = await service.getSubscribers();
    assert.equal(subscribers.length, 1);
    assert.equal(subscribers[0].email, 'reader@example.com');
    assert.equal(subscribers[0].status, 'active');
  });

  test('ContentService.subscribeToNewsletter is idempotent on repeated subscriptions', async () => {
    await service.subscribeToNewsletter('fan@example.com', 'hero');
    const second = await service.subscribeToNewsletter('fan@example.com', 'about');
    assert.equal(second.success, true);

    const subscribers = await service.getSubscribers();
    assert.equal(subscribers.length, 1);
  });

  test('ContentService.deleteSubscriber removes subscriber', async () => {
    const sub = await service.subscribeToNewsletter('todelete@example.com');
    assert.equal((await service.getSubscribers()).length, 1);

    const deleted = await service.deleteSubscriber(sub.subscriber.id);
    assert.equal(deleted, true);
    assert.equal((await service.getSubscribers()).length, 0);
  });

  test('POST /api/newsletter accepts valid subscription and responds with JSON', async () => {
    const req = new Request('http://localhost:3000/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'api-test@example.com', source: 'footer' }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.subscriber.email, 'api-test@example.com');
  });

  test('POST /api/newsletter rejects invalid payload with 400', async () => {
    const req = new Request('http://localhost:3000/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bad-email' }),
    });

    const res = await POST(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('GET /api/newsletter requires authenticated admin session', async () => {
    const res = await GET();
    assert.equal(res.status, 403);
  });
});
