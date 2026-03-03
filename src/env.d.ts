/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare/env" />

declare namespace App {
	interface Locals {
		runtime: {
			env: Env;
		};
	}
}

interface Env {
	RESEND_API_KEY: string;
	NOTIFY_EMAIL: string;
}

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			RESEND_API_KEY?: string;
			NOTIFY_EMAIL?: string;
		}
	}
}

type PagesFunction<Env = unknown, Params extends string = any, Data extends Record<string, unknown> = Record<string, unknown>> = (
	context: PagesFunction.Context<Env, Params, Data>
) => Response | Promise<Response> | undefined | Promise<undefined>;

namespace PagesFunction {
	interface Context<Env = unknown, Params extends string = any, Data extends Record<string, unknown> = Record<string, unknown>> {
		request: Request;
		functionPath: string;
		waitUntil: (promise: Promise<any>) => void;
		passThroughOnException: () => void;
		env: Env;
		params: Record<Params, string | undefined>;
		data: Data;
	}
}
