
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createOrder, updateUserData } from '@/lib/firestoreService';
import type { OrderItem } from '@/models';

// Initialize Stripe outside the handler, but check for keys inside.
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
    typescript: true,
}) : null;

export const config = {
    api: {
        bodyParser: false,
    },
};

const getTierFromPriceId = (priceId: string): 'pro' | 'elite' | null => {
    switch (priceId) {
        case process.env.STRIPE_PRO_MONTHLY_PRICE_ID:
        case process.env.STRIPE_PRO_YEARLY_PRICE_ID:
            return 'pro';
        case process.env.STRIPE_ELITE_MONTHLY_PRICE_ID:
        case process.env.STRIPE_ELITE_YEARLY_PRICE_ID:
            return 'elite';
        default:
            return null;
    }
}

export async function POST(req: NextRequest) {
    if (!stripe || !webhookSecret) {
        console.error("CRITICAL: Stripe or webhook secret not configured on the server.");
        return NextResponse.json({ error: 'Stripe webhook handler is not configured.' }, { status: 500 });
    }
    
    const buf = await req.arrayBuffer();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
        return NextResponse.json({ error: 'No stripe-signature header value was provided.' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(Buffer.from(buf), sig, webhookSecret);
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            const { userId, cartItems: cartItemsString, priceId } = session.metadata || {};
            
            if (!userId) {
                console.error('Webhook Error: Missing userId in Stripe session metadata.', session.id);
                return NextResponse.json({ error: 'Missing userId in metadata.' }, { status: 400 });
            }

            if (session.mode === 'subscription' && priceId) {
                // It's a subscription checkout
                try {
                    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                    const tier = getTierFromPriceId(priceId);
                    
                    if (tier) {
                         await updateUserData(userId, {
                            subscriptionTier: tier,
                            stripeSubscriptionId: subscription.id,
                            stripeSubscriptionStatus: subscription.status,
                            stripeCustomerId: subscription.customer as string,
                        });
                    } else {
                         console.error(`Webhook Error: Invalid priceId ${priceId} for subscription.`);
                    }
                } catch (subError) {
                    console.error('Stripe Subscription retrieval failed:', subError);
                    return NextResponse.json({ error: 'Failed to retrieve subscription details.' }, { status: 500 });
                }
               
            } else if (session.mode === 'payment' && cartItemsString) {
                // It's a one-time purchase
                const items: OrderItem[] = JSON.parse(cartItemsString);
                await createOrder(userId, items, session.id);
            }
            break;
            
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
             const subscriptionUpdated = event.data.object as Stripe.Subscription;
             const customerId = subscriptionUpdated.customer as string;

             // You need a way to find your user by stripeCustomerId
             // This assumes you store the stripeCustomerId on your user object
             const user = null; // FIND USER BY customerId
             
             if (user) {
                //  await updateUserData(user.id, {
                //      stripeSubscriptionStatus: subscriptionUpdated.status,
                //      // If deleted, maybe revert their tier to 'free'
                //      subscriptionTier: subscriptionUpdated.status === 'active' ? 'pro' : 'free', // Add more logic here
                //  });
             } else {
                 console.warn(`Webhook Warning: No user found with stripeCustomerId ${customerId}. This is expected if the user document is not yet created or found.`);
             }
            break;
            
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
