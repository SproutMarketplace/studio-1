
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getUserProfile, updateUserData } from '@/lib/firestoreService';

export async function POST(req: NextRequest) {
    // --- Start of Defensive Checks ---
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_')) {
        console.error("CRITICAL: STRIPE_SECRET_KEY is missing or invalid in .env.local");
        return NextResponse.json({ error: 'Stripe is not configured on the server. The STRIPE_SECRET_KEY is missing or invalid.' }, { status: 500 });
    }

    const refreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL;
    if (!refreshUrl) {
        console.error("CRITICAL: STRIPE_CONNECT_REFRESH_URL is not configured in .env.local");
        return NextResponse.json({ error: "Stripe Connect 'refresh_url' is not configured on the server." }, { status: 500 });
    }

    const returnUrl = process.env.STRIPE_CONNECT_RETURN_URL;
    if (!returnUrl) {
        console.error("CRITICAL: STRIPE_CONNECT_RETURN_URL is not configured in .env.local");
        return NextResponse.json({ error: "Stripe Connect 'return_url' is not configured on the server." }, { status: 500 });
    }
    // --- End of Defensive Checks ---

    try {
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2024-06-20',
            typescript: true,
        });

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
                    userId: userId,
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
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
