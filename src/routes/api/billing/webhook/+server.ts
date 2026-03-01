/**
 * POST /api/billing/webhook
 * Stripe webhook handler — verifies HMAC-SHA256 signature using Node.js crypto.
 *
 * Handles:
 *   checkout.session.completed  → set plan='pro' (annual) or increment payg usage
 *   customer.subscription.deleted → downgrade to free
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createHmac, timingSafeEqual } from 'crypto';
import { getDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!webhookSecret) {
		console.error('[webhook] STRIPE_WEBHOOK_SECRET not set');
		return json({ error: 'not_configured' }, { status: 503 });
	}

	const rawBody = await request.arrayBuffer();
	const bodyBuffer = Buffer.from(rawBody);
	const sigHeader = request.headers.get('stripe-signature') ?? '';

	// Parse Stripe-Signature header: t=timestamp,v1=sig,...
	const parts = Object.fromEntries(
		sigHeader.split(',').map((p) => {
			const idx = p.indexOf('=');
			return [p.slice(0, idx), p.slice(idx + 1)];
		})
	);
	const timestamp = parts['t'];
	const receivedSig = parts['v1'];
	if (!timestamp || !receivedSig) {
		return json({ error: 'invalid_signature' }, { status: 400 });
	}

	// Validate timestamp is within 5-minute tolerance
	if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
		return json({ error: 'timestamp_too_old' }, { status: 400 });
	}

	// Compute expected signature
	const signedPayload = `${timestamp}.${bodyBuffer.toString('utf-8')}`;
	const expectedSig = createHmac('sha256', webhookSecret)
		.update(signedPayload, 'utf-8')
		.digest('hex');

	const a = Buffer.from(receivedSig, 'hex');
	const b = Buffer.from(expectedSig, 'hex');
	if (a.length !== b.length || !timingSafeEqual(a, b)) {
		return json({ error: 'invalid_signature' }, { status: 400 });
	}

	// Parse event
	let event: { type: string; data: { object: Record<string, unknown> } };
	try {
		event = JSON.parse(bodyBuffer.toString('utf-8'));
	} catch {
		return json({ error: 'invalid_json' }, { status: 400 });
	}

	const db = getDB();
	const obj = event.data.object;

	if (event.type === 'checkout.session.completed') {
		const meta = (obj.metadata ?? {}) as Record<string, string>;
		const userId = meta.user_id;
		const type = meta.type ?? 'annual';
		const customerId = obj.customer as string | undefined;

		if (userId) {
			if (type === 'annual') {
				// Upgrade to pro
				await db
					.prepare(
						`UPDATE users SET plan = 'pro', stripe_customer_id = ?, stripe_subscription_id = ?, updated_at = ? WHERE id = ?`
					)
					.bind(customerId ?? null, obj.subscription ?? null, Date.now(), userId)
					.run();
			}
			// payg: usage was already checked/decremented at job creation time; nothing extra needed
		}
	} else if (event.type === 'customer.subscription.deleted') {
		const customerId = obj.customer as string | undefined;
		if (customerId) {
			await db
				.prepare(`UPDATE users SET plan = 'free', stripe_subscription_id = NULL, updated_at = ? WHERE stripe_customer_id = ?`)
				.bind(Date.now(), customerId)
				.run();
		}
	}

	return json({ received: true });
};

