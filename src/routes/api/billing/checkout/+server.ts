/**
 * POST /api/billing/checkout
 * Body: { type: 'annual' | 'payg' }
 *
 * Creates a Stripe Checkout session and returns the redirect URL.
 * - annual → subscription mode ($15/year)
 * - payg   → payment mode ($5 one-time)
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const user = locals.user;
	if (!user) return json({ error: 'not_authenticated' }, { status: 401 });

	const stripeKey = process.env.STRIPE_SECRET_KEY;
	if (!stripeKey) return json({ error: 'billing_unavailable' }, { status: 503 });

	const body = await request.json();
	const type: 'annual' | 'payg' = body?.type === 'payg' ? 'payg' : 'annual';

	const annualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID;
	const paygPriceId = process.env.STRIPE_PAYG_PRICE_ID;
	const priceId = type === 'payg' ? paygPriceId : annualPriceId;
	if (!priceId) return json({ error: 'price_not_configured' }, { status: 503 });

	// Get or create Stripe customer
	const db = getDB();
	const row = await db
		.prepare(`SELECT stripe_customer_id FROM users WHERE id = ?`)
		.bind(user.id)
		.first<{ stripe_customer_id: string | null }>();

	let customerId = row?.stripe_customer_id ?? null;
	if (!customerId) {
		const customerRes = await fetch('https://api.stripe.com/v1/customers', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${stripeKey}`,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({ email: user.email })
		});
		const customer = await customerRes.json() as { id: string };
		customerId = customer.id;
		await db
			.prepare(`UPDATE users SET stripe_customer_id = ?, updated_at = ? WHERE id = ?`)
			.bind(customerId, Date.now(), user.id)
			.run();
	}

	const origin = url.origin;
	const mode = type === 'payg' ? 'payment' : 'subscription';

	const params = new URLSearchParams({
		customer: customerId,
		mode,
		'line_items[0][price]': priceId,
		'line_items[0][quantity]': '1',
		success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${origin}/billing`,
		'metadata[user_id]': user.id,
		'metadata[email]': user.email,
		'metadata[type]': type
	});

	const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${stripeKey}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: params
	});

	if (!sessionRes.ok) {
		const err = await sessionRes.json() as { error?: { message: string } };
		console.error('[billing] Stripe error:', err);
		return json({ error: 'stripe_error', detail: err?.error?.message }, { status: 502 });
	}

	const session = await sessionRes.json() as { url: string };
	return json({ url: session.url });
};

