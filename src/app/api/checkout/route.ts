import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import type { PlantListing } from '@/models';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const isStripeDisabled = !stripeSecretKey || stripeSecretKey.includes('_PUT_YOUR_STRIPE_SECRET_KEY_HERE_');

let stripe: Stripe | null = null;
if (!isStripeDisabled) {
    stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-06-20',
    });
} else {
    console.warn("STRIPE DISABLED: Stripe secret key is missing or is a placeholder. Checkout will be disabled.");
}

interface CartItem extends PlantListing {
    quantity: number;
}

export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    if (isStripeDisabled || !stripe) {
        return NextResponse.json({ error: 'Checkout is currently disabled. Please contact support.' }, { status: 503 });
    }

    try {
        const { items }: { items: CartItem[] } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
        }
        
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items
            .filter(item => item.price && item.price > 0)
            .map((item) => {
                return {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: item.name,
                            description: item.description.substring(0, 100),
                            images: item.imageUrls.length > 0 ? [item.imageUrls[0]] : undefined,
                        },
                        unit_amount: Math.round(item.price! * 100), // Price in cents
                    },
                    quantity: item.quantity,
                };
            });
        
        if (line_items.length === 0) {
            return NextResponse.json({ error: 'Your cart contains no items available for purchase.' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${req.headers.get('origin')}/catalog?success=true`,
            cancel_url: `${req.headers.get('origin')}/catalog?canceled=true`,
        });

        return NextResponse.json({ sessionId: session.id });

    } catch (error) {
        console.error('Stripe Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
