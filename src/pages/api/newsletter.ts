import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// Marcar como endpoint dinámico (no pre-renderizado)
export const prerender = false;

export const POST: APIRoute = async (context) => {
	try {
		// Obtener los datos del JSON
		const body = await context.request.json();
		const { email, discord } = body;

		// 1. Validación de entrada
		if (!email || !email.includes('@')) {
			return new Response(JSON.stringify({ success: false, error: 'Email inválido' }), { status: 400 });
		}

		const env = context.locals.runtime.env as Record<string, any>;
		const RESEND_KEY = env.RESEND_API_KEY;
		const resend = new Resend(RESEND_KEY);

		// 2. BUSCAR SI EL CONTACTO EXISTE
		// En el SDK actual, get({ email }) es la forma directa.
		const { data: existingContact } = await resend.contacts.get({
			email: email
		});

		// Si existe, detenemos el proceso para no reenviar el email de bienvenida
		if (existingContact && existingContact.id) {
			return new Response(
				JSON.stringify({ success: true, existe: true, message: 'Ya suscrito' }),
				{ status: 200 }
			);
		}

		// 3. CREAR EL CONTACTO
		const { data: contactData, error: contactError } = await resend.contacts.create({
			email: email,
			firstName: discord || '',
			unsubscribed: false,
		});

		if (contactError) {
			throw new Error(contactError.message);
		}

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
            `,
		});

		if (mailError) {
			console.error('Error de Resend al enviar mail:', mailError);
		}

		return new Response(
			JSON.stringify({ success: true, existe: false, message: 'Suscrito correctamente' }),
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
