import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// Marcar como endpoint dinámico (no pre-renderizado)
export const prerender = false;

export const POST: APIRoute = async (context) => {
	try {
		// Obtener los datos del JSON
		const body = await context.request.json();
		const { email, discord } = body;

		const env = context.locals.runtime.env as Record<string, any>;
		const resend = new Resend(env.RESEND_API_KEY);

		// 1. Verificación de existencia
		const { data: existing } = await resend.contacts.get({ email });

		if (existing && (existing as any).id) {
			return new Response(JSON.stringify({ success: true, existe: true }), { status: 200 });
		}

		// 2. Crear el contacto primero
		const { error: contactError } = await resend.contacts.create({
			email: email,
			firstName: discord || '',
			unsubscribed: false,
		});

		if (contactError) {
			console.error('Error Resend Contactos:', contactError);
			throw new Error('No se pudo crear el contacto');
		}

		// 3. ENVIAR EMAIL (Aquí es donde suele fallar por tiempo)
		// Usamos una constante para capturar el resultado antes de retornar nada
		const emailResponse = await resend.emails.send({
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

		if (emailResponse.error) {
			console.error('Error Resend Email:', emailResponse.error);
			// Aunque el mail falle, el contacto ya se creó, 
			// pero notificamos el error en consola para debuggear.
		}

		// 4. Solo respondemos cuando AMBAS promesas terminaron
		return new Response(
			JSON.stringify({ success: true, existe: false, message: 'Proceso completado' }),
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
