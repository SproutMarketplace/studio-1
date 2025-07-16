
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
        console.error("Webhook Error: Stripe or webhook secret not configured.");
        return NextResponse.json({ error: 'Stripe or checkout webhook secret not configured.' }, { status: 500 });
    }

    const sig = req.headers.get('stripe-signature');
    if (!sig) {
        return NextResponse.json({ error: 'No stripe-signature header value was provided.' }, { status: 400 });
    }

    let event: Stripe.Event;
    
    try {
        // Use req.arrayBuffer() and Buffer.from() to get the raw body for verification.
        // This is the correct way to handle this in Next.js App Router.
        const bodyBuffer = await req.arrayBuffer();
        const body = Buffer.from(bodyBuffer);
        
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            const { userId, cartItems: cartItemsString } = session.metadata || {};
            if (!userId || !cartItemsString) {
                console.error('Webhook Error: Missing metadata in Stripe session.', session.id);
                throw new Error('Missing or invalid metadata in Stripe session.');
            }

            const items: OrderItem[] = JSON.parse(cartItemsString);

            // The createOrder function now handles creating separate orders per seller
            await createOrder(
                userId,
                items,
                session.id
            );

        } catch (error) {
            console.error('Error handling checkout.session.completed event:', error);
            // Return 500 so Stripe knows to retry the webhook
            return NextResponse.json({ error: 'Error processing order.' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
