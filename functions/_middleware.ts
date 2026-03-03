import staticFormsPlugin from '@cloudflare/pages-plugin-static-forms';

interface NewsletterFormData {
	email: string;
	discord?: string;
	tags: string;
}

async function sendNotificationEmail(
	email: string,
	discord: string | undefined,
	tags: string,
	env: Env
): Promise<Response> {
	const resendApiKey = env.RESEND_API_KEY;
	const notifyEmail = env.NOTIFY_EMAIL;

	if (!resendApiKey || !notifyEmail) {
		console.error('Missing RESEND_API_KEY or NOTIFY_EMAIL environment variables');
		return new Response('Configuration error', { status: 500 });
	}

	const emailBody = `
                        Nueva suscripción en la newsletter:

                        Email: ${email}
                        Discord: ${discord || 'Not provided'}
                        Tags: ${tags}

                        Enviado a las: ${new Date().toISOString()}
                            `.trim();

	try {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${resendApiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				from: notifyEmail,
				to: notifyEmail,
				subject: `Nueva suscripción a a la Newsletter - ${email}`,
				text: emailBody,
				html: `
					<html>
						<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333;">
							<h2>Nueva suscripción a a la Newsletter</h2>
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
			return new Response('Failed to send notification', { status: 500 });
		}

		return new Response(null, {
			status: 302,
			headers: {
				'Location': '/thanks',
			},
		});
	} catch (error) {
		console.error('Error sending email:', error);
		return new Response('An error occurred while processing your request', {
			status: 500,
		});
	}
}

export const onRequest: PagesFunction = staticFormsPlugin({
	respondWith: async ({ formData, name }) => {
		if (name !== 'newsletter') {
			// Let other forms be handled by default behavior
			return undefined;
		}

		const email = formData.get('email');
		const discord = formData.get('discord');
		const tags = formData.get('tags');

		if (!email || typeof email !== 'string') {
			return new Response('Email is required', { status: 400 });
		}

		// Access the environment from the context
		// The env is passed through the Pages Functions context
		const env = (globalThis as any).env as Env;

		const discordValue = discord && typeof discord === 'string' ? discord : undefined;
		const tagsValue = tags && typeof tags === 'string' ? tags : '';

		return sendNotificationEmail(email, discordValue, tagsValue, env);
	},
});
