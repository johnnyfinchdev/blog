import type { APIRoute } from 'astro';

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

		// Guardar en la lista de todos los emails (subscribers:list) como CSV
		const emailListKey = 'subscribers:list';
		// Obtenemos el string actual. Si no existe, usamos un string vacío.
		const existingList = (await kv.get(emailListKey)) || '';
		// Convertimos el string en array para verificar duplicados
		// Usamos filter para eliminar posibles elementos vacíos si el string termina en ";"
		const emailList = existingList.split(';').filter((e: string) => e.trim() !== '');
		if (!emailList.includes(email)) {
			// Añadimos el nuevo email
			emailList.push(email);
			// Lo volvemos a unir con ";" y nos aseguramos de que termine en ";"
			const updatedCSV = emailList.join(';') + ';';
			await kv.put(emailListKey, updatedCSV);
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
