
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
        typescript: true,
    });
}

// This disables the default body parser to allow us to read the raw body
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper function to buffer the request
async function buffer(readable: ReadableStream<Uint8Array>) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}


export async function POST(req: NextRequest) {
    if (!stripe || !webhookSecret) {
        console.error("Webhook Error: Stripe or webhook secret not configured.");
        return NextResponse.json({ error: 'Stripe or checkout webhook secret not configured.' }, { status: 500 });
    }

    const sig = req.headers.get('stripe-signature');
    if (!sig) {
        console.error('Webhook Error: No stripe-signature header value was provided.');
        return NextResponse.json({ error: 'No stripe-signature header value was provided.' }, { status: 400 });
    }

    const rawBody = await buffer(req.body!);

    let event: Stripe.Event;
    
    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
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

            await createOrder(
                userId,
                items,
                session.id
            );

        } catch (error) {
            console.error('Error handling checkout.session.completed event:', error);
            return NextResponse.json({ error: 'Error processing order.' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
