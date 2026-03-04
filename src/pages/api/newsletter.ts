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
		const discord = body.discord as string | null;

		// Validar email
		if (!email || !email.includes('@')) {
			return new Response(
				JSON.stringify({ success: false, error: 'Email inválido' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
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

		// Crear una entrada única con timestamp
		const subscriber: NewsletterSubscriber = {
			email,
			discord: discord || undefined,
			timestamp: Date.now(),
		};

		// Usar el email como clave (puede guardar múltiples suscripciones con un timestamp)
		const key = `subscriber:${email}:${Date.now()}`;

		// Guardar en KV
		await kv.put(key, JSON.stringify(subscriber), {
			metadata: {
				email,
				subscribedAt: new Date().toISOString(),
			},
		});

		// También guardar una lista de todos los emails para búsqueda rápida
		const emailListKey = 'subscribers:list';
		const existingList = (await kv.get(emailListKey)) || '[]';
		const emailList = JSON.parse(existingList) as string[];

		if (!emailList.includes(email)) {
			emailList.push(email);
			await kv.put(emailListKey, JSON.stringify(emailList));
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
