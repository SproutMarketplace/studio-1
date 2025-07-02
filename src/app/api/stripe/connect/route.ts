
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getUserProfile, updateUserData } from '@/lib/firestoreService';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;
if (stripeSecretKey && !stripeSecretKey.includes('_PUT_YOUR_STRIPE_SECRET_KEY_HERE_')) {
    stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-06-20',
        typescript: true,
    });
}

export async function POST(req: NextRequest) {
    if (!stripe) {
        return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
    }

    const refreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL;
    const returnUrl = process.env.STRIPE_CONNECT_RETURN_URL;

    if (!refreshUrl || !returnUrl) {
        const errorMessage = "Stripe Connect return/refresh URLs are not configured on the server. Please check your .env.local file.";
        console.error("Stripe Config Error:", errorMessage);
        return NextResponse.json({ error: "Stripe connection is not configured correctly by the administrator." }, { status: 503 });
    }


    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
        }

        const userProfile = await getUserProfile(userId);
        if (!userProfile) {
            return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
        }
        
        let accountId = userProfile.stripeAccountId;

        // Create a new Stripe account for the user if they don't have one
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                email: userProfile.email,
                business_type: 'individual',
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                metadata: {
                    userId: userId, // Link our user ID to the Stripe account
                },
            });
            accountId = account.id;
            await updateUserData(userId, { stripeAccountId: accountId });
        }
        
        // Create a unique onboarding link for the user
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });

        return NextResponse.json({ url: accountLink.url });

    } catch (error) {
        console.error('Stripe Connect error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
