// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				id: string;
				email: string;
				name?: string | null;
				companyName?: string | null;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				ENVIRONMENT: string;
				NODE_ENV: string;
				CONTACT_EMAIL_TO: string;
				FROM_EMAIL: string;
				VITE_BASE_URL?: string;
				// D1 Database
				DB: D1Database;
				// R2 Asset Storage
				ASSETS_BUCKET: R2Bucket;
				// Secrets Store Bindings
				ANTHROPIC_API_KEY: { get: () => Promise<string> };
				RESEND_API_KEY: { get: () => Promise<string> };
				// Cloudflare Workers AI for agentic scoping
				AI?: Ai;
				// Logging configuration
				LOG_LEVEL?: string;
				LOG_ENABLE_CONSOLE?: string;
				LOG_ENABLE_CLOUDFLARE?: string;
				LOG_ENABLE_STRUCTURED?: string;
				LOG_ENABLE_ANALYTICS_ENGINE?: string;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};

