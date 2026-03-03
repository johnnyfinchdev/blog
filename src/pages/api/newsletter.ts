import type { APIRoute } from 'astro';

// NOTE: make sure you set CF_TURNSTILE_SECRET in your environment (.env) before running.
// you can obtain a secret key from https://dash.cloudflare.com/ and the Turnstile settings for your site.

export const get: APIRoute = () => {
  return new Response(JSON.stringify({ success: false, error: 'method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const post: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const token = form.get('cf-turnstile-response')?.toString();

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'no token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const secret = process.env.CF_TURNSTILE_SECRET;
    if (!secret) {
      return new Response(
        JSON.stringify({ success: false, error: 'CF_TURNSTILE_SECRET not defined' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const verifyBody = new URLSearchParams({ secret, response: token });

    const verifyRes = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verifyBody.toString(),
    });

    const result = await verifyRes.json();
    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: 'verification failed', details: result }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // TODO: add your newsletter subscription logic here. For example, send the email to a
    // mailing list provider or save it in a database. You can access form.get('email') etc.

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('newsletter API error', err);
    return new Response(JSON.stringify({ success: false, error: 'internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
