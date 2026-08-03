import test from 'node:test';
import assert from 'node:assert/strict';

import { createRateLimiter, validateNewsletterPayload } from './newsletter-validation.js';

test('rejects invalid email addresses', () => {
  const result = validateNewsletterPayload({
    email: 'not-an-email',
    terms: true,
    turnstileToken: 'token-123',
  }, { ip: '203.0.113.1' });

  assert.equal(result.ok, false);
  assert.match(result.error, /email/i);
});

test('rejects missing or false terms acceptance', () => {
  const result = validateNewsletterPayload({
    email: 'user@example.com',
    terms: false,
    turnstileToken: 'token-123',
  }, { ip: '203.0.113.1' });

  assert.equal(result.ok, false);
  assert.match(result.error, /términos/i);
});

test('accepts valid payloads with trimmed values', () => {
  const result = validateNewsletterPayload({
    email: '  user@example.com  ',
    discord: '  dev#123  ',
    terms: true,
    turnstileToken: 'token-123',
  }, { ip: '203.0.113.1' });

  assert.equal(result.ok, true);
  assert.equal(result.value.email, 'user@example.com');
  assert.equal(result.value.discord, 'dev#123');
});

test('rate limiter blocks repeated requests after the threshold', () => {
  const limiter = createRateLimiter(2, 60000);
  const first = limiter('203.0.113.2');
  const second = limiter('203.0.113.2');
  const third = limiter('203.0.113.2');

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
});
