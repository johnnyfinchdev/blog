import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// Marcar como endpoint dinámico (no pre-renderizado)
export const prerender = false;

export const POST: APIRoute = async (context) => {
	try {

		// Obtener los datos del JSON
		const body = await context.request.json();
		const { email, discord } = body;

		// Validación básica
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

		// Intentar crear el contacto directamente
		// Resend devolverá un error si el contacto ya existe en esa audiencia
		const { data: contactData } = await resend.contacts.create({
			email: email,
			firstName: discord || '',
			unsubscribed: false,
		});

		// Si hay error porque ya existe
		if (!contactData?.id) {
			// Resend devuelve un código específico si el contacto ya existe
			return new Response(
				JSON.stringify({ success: true, existe: true, message: 'Ya suscrito' }),
				{ status: 200 }
			);
		}

		// 3. SI LLEGAMOS AQUÍ, EL CONTACTO ES NUEVO -> Enviar email
		const { error: mailError } = await resend.emails.send({
			from: 'Newsletter - Hola Developers! <newsletter@holadevelopers.blog>',
			to: [email],
			subject: 'Nos alegra que te hayas unido a la Newsletter, Developer',
			html: `        
				<h1>¡Hola Developer!</h1>
				<p>Gracias por suscribirte a esta newsletter dedicada a personas como tú, apasionadas por la programación y con muchas ganas de aprender.</p>
				<p>A partir de ahora recibirás notificaciones acerca de:</p>
				<ul>
					<li>Nuevos posts.</li>
					<li>Retos de programación.</li>
					<li>Proyectos de la comunidad.</li>
					<li>Eventos para pasar tiempo de calidad junto a la comunidad de Developers.</li>
					<li>Y mucho más.</li>
				</ul>
				
				<p>No recibirás:</p>
				<ul>
					<li>Publicidad</li>
				</ul>
				<h3>Nos vemos en el código.</h3>
				<p>Te puedes desuscribir <a href="https://resend.com/broadcasts/95b132da-b2cf-46a6-a2d5-924796aa70f9/%7B%7B%7BRESEND_UNSUBSCRIBE_URL%7D%7D%7D">aquí</a>.</p>
            `,
		});

		if (mailError) {
			console.error('Error enviando email:', mailError);
		}

		return new Response(
			JSON.stringify({ success: true, existe: false, message:'gracias'}),
			{ status: 200 }
		);

	} catch (error) {
		console.error('Error en newsletter:', error);
		return new Response(
			JSON.stringify({ success: false, error: 'Error al procesar la solicitud' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
