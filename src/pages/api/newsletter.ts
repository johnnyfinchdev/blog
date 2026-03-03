import type { APIRoute } from 'astro';

// This endpoint must run on the server, not be prerendered as static output.
export const prerender = false;

export const GET: APIRoute = () => {
	return new Response(JSON.stringify({ success: false, error: 'Use POST method' }), {
		status: 405,
		headers: { 'Content-Type': 'application/json' },
	});
};

export const POST: APIRoute = async ({ request, locals }) => {
	try {
		const formData = await request.formData();
		const email = formData.get('email');
		const discord = formData.get('discord');
		const tags = formData.get('tags');

		// Validación
		if (!email || typeof email !== 'string') {
			return new Response(
				JSON.stringify({ success: false, error: 'Email is required' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// En desarrollo, obtén las variables de entorno del proceso
		const resendApiKey = process.env.RESEND_API_KEY || (locals.runtime?.env?.RESEND_API_KEY);
		const notifyEmail = process.env.NOTIFY_EMAIL || (locals.runtime?.env?.NOTIFY_EMAIL);

		if (!resendApiKey || !notifyEmail) {
			console.error('Missing RESEND_API_KEY or NOTIFY_EMAIL environment variables');
			return new Response(
				JSON.stringify({ success: false, error: 'Configuration error' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const emailBody = `
Nueva suscripción en la newsletter:

Email: ${email}
Discord: ${discord || 'Not provided'}
Tags: ${tags}

Enviado a las: ${new Date().toISOString()}
		`.trim();

		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${resendApiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				from: notifyEmail,
				to: notifyEmail,
				subject: `Nueva suscripción a la Newsletter - ${email}`,
				text: emailBody,
				html: `
					<html>
						<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333;">
							<h2>Nueva suscripción a la Newsletter</h2>
							<p><strong>Email:</strong> ${email}</p>
							<p><strong>Discord:</strong> ${discord || 'Not provided'}</p>
							<p><strong>Tags:</strong> ${tags}</p>
							<p><small>Enviado a las: ${new Date().toISOString()}</small></p>
						</body>
					</html>
				`,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			console.error('Resend API error:', error);
			return new Response(
				JSON.stringify({ success: false, error: 'Failed to send email' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		return new Response(
			JSON.stringify({ success: true }),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		console.error('Error:', error);
		return new Response(
			JSON.stringify({ success: false, error: 'Internal server error' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
