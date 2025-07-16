
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createOrder } from '@/lib/firestoreService';
import type { OrderItem } from '@/models';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET;

let stripe: Stripe | null = null;
if (stripeSecretKey && !stripeSecretKey.includes('_PUT_YOUR_STRIPE_SECRET_KEY_HERE_')) {
    stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-06-20',
    });
}

export async function POST(req: NextRequest) {
    if (!stripe || !webhookSecret) {
        return NextResponse.json({ error: 'Stripe or checkout webhook secret not configured.' }, { status: 500 });
    }

    const sig = req.headers.get('stripe-signature');
    if (!sig) {
        return NextResponse.json({ error: 'No stripe-signature header value was provided.' }, { status: 400 });
    }

    let event: Stripe.Event;
    
    try {
        const body = await req.text();
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            const { userId, cartItems: cartItemsString } = session.metadata || {};
            if (!userId || !cartItemsString) {
                throw new Error('Missing metadata in Stripe session.');
            }

            // Correctly parse the JSON string from metadata
            const items = JSON.parse(cartItemsString);

            await createOrder({
                userId: userId,
                items: items,
                totalAmount: session.amount_total ? session.amount_total / 100 : 0,
                stripeSessionId: session.id,
            });

        } catch (error) {
            console.error('Error handling checkout.session.completed event:', error);
            // Return 500 so Stripe knows to retry the webhook
            return NextResponse.json({ error: 'Error processing order.' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
