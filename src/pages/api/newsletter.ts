import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { Resend } from 'resend';
import { createRateLimiter, validateNewsletterPayload } from './newsletter-validation.js';

// Marcar como endpoint dinámico (no pre-renderizado)
export const prerender = false;

const rateLimiter = createRateLimiter(5, 60_000);

export const POST: APIRoute = async (context) => {
	try {
		let body: unknown;
		try {
			body = await context.request.json();
		} catch {
			return new Response(JSON.stringify({ success: false, error: 'El cuerpo de la solicitud no es válido.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
		}

		const ip = context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
		const rateLimitResult = rateLimiter(ip);

		if (!rateLimitResult.allowed) {
			return new Response(JSON.stringify({ success: false, error: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
		}

		const validation = validateNewsletterPayload(typeof body === 'object' && body !== null ? body as Record<string, unknown> : undefined, { ip });
		if (!validation.ok) {
			return new Response(JSON.stringify({ success: false, error: validation.error }), { status: 400, headers: { 'Content-Type': 'application/json' } });
		}

		const { email, discord } = validation.value;
		const apiKey = env.RESEND_API_KEY as string | undefined;

		if (!apiKey) {
			console.error('RESEND_API_KEY no está configurada para el endpoint de newsletter.');
			return new Response(JSON.stringify({ success: false, error: 'El servicio de correos no está configurado.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
		}

		const resend = new Resend(apiKey);

		// 1. Verificación: ¿Ya existe?
		const { data: existing } = await resend.contacts.get({ email });
		if (existing && (existing as any).id) {
			return new Response(JSON.stringify({ success: true, existe: true }), { status: 200 });
		}

		// 2. Creación del contacto
		const { data: contact, error: contactError } = await resend.contacts.create({
			email,
			firstName: discord || '',
			unsubscribed: false,
		});

		if (contactError) {
			console.error('Error al crear contacto:', contactError);
			throw new Error('Error en creación de contacto');
		}

		await delay(1100);

		// 3. EL CAMBIO CLAVE: Esperar el envío y verificar el remitente
		// Usamos una constante para capturar el resultado antes de retornar nada
		const { data: mailData, error: mailError } = await resend.emails.send({
			from: 'Hola Developers! <newsletter@holadevelopers.blog>',
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
            `,
		});

		if (mailError) {
			// Si el contacto se creó pero el mail falla, Resend te dirá por qué aquí
			console.error('Resend falló al enviar:', mailError);
			return new Response(JSON.stringify({
				success: false,
				error: JSON.stringify(mailError),
			}), { status: 500 });
		}

		return new Response(JSON.stringify({ success: true, mailId: mailData?.id }), { status: 200 });

	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error desconocido';
		const details = error instanceof Error && error.stack ? error.stack : undefined;
		console.error('Error en newsletter:', message, details);
		return new Response(
			JSON.stringify({
				success: false,
				error: message,
				details: details,
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

function delay(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}