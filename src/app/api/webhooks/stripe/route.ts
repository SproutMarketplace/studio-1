
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createOrder } from '@/lib/firestoreService';
import type { OrderItem } from '@/models';

// This is the correct way to initialize Stripe in this file.
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET;

const stripe = new Stripe(stripeSecretKey!, {
    apiVersion: '2024-06-20',
    typescript: true,
});

// This disables the default body parser to allow us to read the raw body, which is required by Stripe.
export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: NextRequest) {
    if (!stripe || !webhookSecret) {
        console.error("Webhook Error: Stripe or webhook secret not configured.");
        return NextResponse.json({ error: 'Stripe webhook handler is not configured on the server.' }, { status: 500 });
    }
    
    // Read the raw request body as a buffer
    const buf = await req.arrayBuffer();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
        console.error('Webhook Error: No stripe-signature header value was provided.');
        return NextResponse.json({ error: 'No stripe-signature header value was provided.' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        // Use the buffer for verification, this is the critical step.
        event = stripe.webhooks.constructEvent(Buffer.from(buf), sig, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            const { userId, cartItems: cartItemsString } = session.metadata || {};
            if (!userId || !cartItemsString) {
                console.error('Webhook Error: Missing metadata in Stripe session.', session.id);
                return NextResponse.json({ error: 'Missing or invalid metadata in Stripe session.' }, { status: 400 });
            }

            const items: OrderItem[] = JSON.parse(cartItemsString);

            // This function contains the logic to update the plant's availability.
            await createOrder(
                userId,
                items,
                session.id
            );

        } catch (error) {
            console.error('Error handling checkout.session.completed event:', error);
            // Return a 500 so Stripe will retry the webhook for transient errors.
            return NextResponse.json({ error: 'Error processing order.' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
