
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { updateUserData } from '@/lib/firestoreService';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

let stripe: Stripe | null = null;
if (stripeSecretKey && !stripeSecretKey.includes('_PUT_YOUR_STRIPE_SECRET_KEY_HERE_')) {
    stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-06-20',
        typescript: true,
    });
}

export async function POST(req: NextRequest) {
    if (!stripe || !webhookSecret) {
        // If Stripe or the secret isn't configured, we cannot process the webhook.
        // Return an error to indicate a server configuration issue.
        return NextResponse.json({ error: 'Stripe Connect webhook handler is not configured on the server.' }, { status: 500 });
    }
    
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
         return NextResponse.json({ error: 'No Stripe signature found in request header.' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
    }

    // Handle the account.updated event
    if (event.type === 'account.updated') {
        const account = event.data.object as Stripe.Account;
        try {
            const userId = account.metadata?.userId;
            if (!userId) {
                console.warn(`Webhook received for account.updated but no userId in metadata. Account ID: ${account.id}`);
                // Don't return 500, as Stripe will retry but it will never succeed.
                return NextResponse.json({ received: true, message: 'No userId in metadata.' });
            }

            // Update the user document in Firestore with the onboarding status
            await updateUserData(userId, {
                stripeDetailsSubmitted: account.details_submitted,
            });

        } catch (error) {
            console.error('Error handling account.updated event:', error);
            // Return 500 so Stripe knows to retry the webhook for transient errors
            return NextResponse.json({ error: 'Error processing account update.' }, { status: 500 });
        }
    }
    
    return NextResponse.json({ received: true });
}
