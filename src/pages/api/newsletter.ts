import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// Marcar como endpoint dinámico (no pre-renderizado)
export const prerender = false;

export const POST: APIRoute = async (context) => {
	try {

		// Obtener los datos del JSON
		const body = await context.request.json();
		const { email, discord } = body;

		// 1. Validación básica
		if (!email || !email.includes('@')) {
			return new Response(JSON.stringify({ success: false, error: 'Email inválido' }), { status: 400 });
		}

		// Obtener el binding de KV desde el contexto de Cloudflare
		const env = context.locals.runtime.env as Record<string, any>;
		const RESEND_KEY = env.RESEND_API_KEY;

		if (!RESEND_KEY) {
			return new Response(JSON.stringify({ success: false, error: 'Configuración de servidor incompleta' }), { status: 500 });
		}

		const resend = new Resend(RESEND_KEY);

		const subs = await resend.contacts.list({
			limit: 10,
		});

		console.log(subs)

		// for (const sub of subs) {
		// 	if (sub.email !== email) {
		// 		// 2. Guardar en la Audiencia (Contactos) de Resend
		// 		await resend.contacts.create({
		// 			email: email,
		// 			firstName: discord || '',
		// 			unsubscribed: false,
		// 		});

		// 		// 3. Enviar email de bienvenida/confirmación
		// 		const { error: mailError } = await resend.emails.send({
		// 			from: 'Hola Developers <newsletter@holadevelopers.blog>',
		// 			to: [email],
		// 			subject: '¡Bienvenido a la Newsletter! 🚀',
		// 			html: `
        //         <h1>¡Hola ${discord || 'Developer'}!</h1>
        //         <p>Gracias por suscribirte. A partir de ahora recibirás retos, posts y novedades.</p>
        //         ${discord ? `<p>Tu usuario de Discord <strong>${discord}</strong> ha sido registrado para el canal exclusivo.</p>` : ''}
        //         <p>Nos vemos en el código.</p>
        //     `,
		// 		});
		// 		if (mailError) {
		// 			console.error('Error enviando email:', mailError);
		// 			// Podrías decidir si fallar aquí o continuar si el contacto se guardó
		// 		}
		// 	}
		// }






		return new Response(
			JSON.stringify({ success: true }),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (error) {
		console.error('Error en newsletter:', error);
		return new Response(
			JSON.stringify({ success: false, error: 'Error al procesar la solicitud' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
