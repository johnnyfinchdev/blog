const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @typedef {{ ok: true, value: { email: string; discord: string; terms: boolean; turnstileToken: string; ip: string } }} NewsletterValidationSuccess
 * @typedef {{ ok: false, error: string }} NewsletterValidationFailure
 * @typedef {NewsletterValidationSuccess | NewsletterValidationFailure} NewsletterValidationResult
 */

/**
 * @param {Record<string, unknown> | null | undefined} payload
 * @param {{ ip?: string }} context
 * @returns {NewsletterValidationResult}
 */
export function validateNewsletterPayload(payload, context = {}) {
  const email = typeof payload?.email === 'string' ? payload.email.trim() : '';
  const discord = typeof payload?.discord === 'string' ? payload.discord.trim() : '';
  const terms = payload?.terms === true;
  const turnstileToken = typeof payload?.turnstileToken === 'string' ? payload.turnstileToken.trim() : '';

  if (!email || !EMAIL_REGEX.test(email)) {
    return { ok: false, error: 'El email no es válido.' };
  }

  if (!terms) {
    return { ok: false, error: 'Debes aceptar los términos y condiciones.' };
  }

  if (!turnstileToken) {
    return { ok: false, error: 'El captcha no es válido.' };
  }

  return {
    ok: true,
    value: {
      email,
      discord,
      terms: true,
      turnstileToken,
      ip: typeof context?.ip === 'string' ? context.ip : '',
    },
  };
}

export function createRateLimiter(maxRequests = 3, windowMs = 60_000) {
  const buckets = new Map();

  return function checkLimit(ip) {
    const now = Date.now();
    const bucket = buckets.get(ip) ?? [];
    const recent = bucket.filter((timestamp) => now - timestamp < windowMs);

    if (recent.length >= maxRequests) {
      buckets.set(ip, recent);
      return { allowed: false, remaining: 0 };
    }

    recent.push(now);
    buckets.set(ip, recent);
    return { allowed: true, remaining: maxRequests - recent.length };
  };
}
