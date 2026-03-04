import type { APIRoute } from 'astro';

interface NewsletterSubscriber {
	email: string;
	discord?: string;
	timestamp: number;
}

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
		const kv = env.NEWSLETTER_DB;

		if (!kv) {
			console.error('KV binding not found');
			return new Response(
				JSON.stringify({ success: false, error: 'Error del servidor' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Guardar en la lista de todos los emails (subscribers:list)
		const emailListKey = 'subscribers:list';
		const existingList = (await kv.get(emailListKey)) || '[]';
		const emailList = JSON.parse(existingList) as string[];

		if (!emailList.includes(email)) {
			emailList.push(email);
			await kv.put(emailListKey, JSON.stringify(emailList));
		}

		// Guardar email con discord si está disponible
		if (discord) {
			const discordEmailListKey = 'discordEmail:list';
			const existingDiscordList = (await kv.get(discordEmailListKey)) || '[]';
			const discordEmailList = JSON.parse(existingDiscordList) as Array<{ email: string; discord: string }>;

			// Verificar si el email ya existe en la lista de discord
			const emailExists = discordEmailList.some(item => item.email === email);
			
			if (!emailExists) {
				discordEmailList.push({ email, discord });
				await kv.put(discordEmailListKey, JSON.stringify(discordEmailList));
			}
		}

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
