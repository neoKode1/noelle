/**
 * Queue helper — Vercel replacement for Cloudflare Queues
 *
 * Sends a job message by POSTing JSON to BUILDER_QUEUE_URL
 * (the Retools Builder Queue HTTP trigger endpoint).
 *
 * Set these environment variables in Vercel:
 *   BUILDER_QUEUE_URL   — e.g. https://retools-builder-queue-dev.nexartis.workers.dev
 *   BUILDER_QUEUE_TOKEN — Bearer token for the trigger endpoint
 */

export async function sendToQueue(message: unknown): Promise<void> {
	const url = process.env.BUILDER_QUEUE_URL;
	if (!url) throw new Error('BUILDER_QUEUE_URL environment variable is not set');

	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	const token = process.env.BUILDER_QUEUE_TOKEN;
	if (token) headers['Authorization'] = `Bearer ${token}`;

	const res = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify(message)
	});

	if (!res.ok) {
		throw new Error(`Queue trigger failed: ${res.status} ${await res.text()}`);
	}
}

