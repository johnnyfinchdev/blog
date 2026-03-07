import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// Marcar como endpoint dinámico (no pre-renderizado)
export const prerender = false;

export const POST: APIRoute = async (context) => {
	try {

		// Obtener los datos del JSON
		const body = await context.request.json();
		const email = body.email as string;
		let discord = body.discord as string | null;

		// Validar email
		if (!email || !email.includes('@')) {
			return new Response(
				JSON.stringify({ success: false, error: 'Email inválido' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Limpiar discord - si está vacío, convertir a null
		if (!discord || discord.trim() === '') {
			discord = null;
		}

		// Obtener el binding de KV desde el contexto de Cloudflare
		const env = context.locals.runtime.env as Record<string, any>;
		// const kv = env.NEWSLETTER_DB;
		const re = env.RESEND_API_KEY;

		if (!re) {
			console.error('RESEND binding not found');
			return new Response(
				JSON.stringify({ success: false, error: 'Error del servidor' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const resend = new Resend(re);
		console.log(re)

		const { data, error } = await resend.contacts.create({
			email: 'steve.wozniak@gmail.com',
			firstName: 'Steve',
			lastName: 'Wozniak',
			unsubscribed: false,
		});

		// // Guardar en la lista de todos los emails (subscribers:list) con formato multilínea
		// const emailListKey = 'subscribers:list';

		// // 1. Obtenemos el contenido actual. Si no existe, inicializamos con el encabezado.
		// let existingContent = (await kv.get(emailListKey)) || 'email,\n';

		// // 2. Extraemos los emails actuales para comprobar duplicados.
		// // Separamos por saltos de línea y limpiamos comas y espacios.
		// const lines = existingContent
		// 	.split('\n')
		// 	.map(line => line.replace(',', '').trim())
		// 	.filter(line => line !== '' && line !== 'email');

		// if (!lines.includes(email)) {
		// 	// 3. Si el contenido no termina en salto de línea, se lo añadimos antes de insertar
		// 	if (!existingContent.endsWith('\n')) {
		// 		existingContent += '\n';
		// 	}

		// 	// 4. Añadimos el nuevo email con su coma y salto de línea
		// 	const updatedContent = `${existingContent}${email},\n`;

		// 	await kv.put(emailListKey, updatedContent);
		// }

		// // Guardar email con discord si está disponible
		// if (discord) {
		// 	const discordEmailListKey = 'discordEmail:list';
		// 	const existingDiscordList = (await kv.get(discordEmailListKey)) || '[]';
		// 	const discordEmailList = JSON.parse(existingDiscordList) as Array<{ email: string; discord: string }>;

		// 	// Verificar si el email ya existe en la lista de discord
		// 	const emailExists = discordEmailList.some(item => item.email === email);

		// 	if (!emailExists) {
		// 		discordEmailList.push({ email, discord });
		// 		await kv.put(discordEmailListKey, JSON.stringify(discordEmailList));
		// 	}
		// }

		return new Response(
			JSON.stringify({ success: true, message: '¡Te has suscrito correctamente!' }),
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
