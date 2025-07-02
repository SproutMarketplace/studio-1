
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import type { PlantListing } from '@/models';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

let stripe: Stripe | null = null;
if (stripeSecretKey && !stripeSecretKey.includes('_PUT_YOUR_STRIPE_SECRET_KEY_HERE_')) {
    stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-06-20',
    });
}

interface CartItem extends PlantListing {
    quantity: number;
}

export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    if (!stripe) {
        const errorMessage = "Checkout is currently disabled. The server is missing a valid Stripe secret key. Please check your server's environment variables.";
        console.error("Stripe Error:", errorMessage);
        return NextResponse.json({ error: 'Checkout is currently disabled. Please contact support.' }, { status: 503 });
    }

    try {
        const { items, userId }: { items: CartItem[], userId: string } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
        }
        
        if (!userId) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
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
            success_url: `${req.headers.get('origin')}/catalog?checkout_success=true`,
            cancel_url: `${req.headers.get('origin')}/catalog?canceled=true`,
            metadata: {
                userId,
                cartItems: JSON.stringify(items.map(item => ({
                    plantId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    imageUrl: item.imageUrls[0] || "", // Pass only the first URL
                    sellerId: item.ownerId
                }))),
            }
        });

        return NextResponse.json({ sessionId: session.id });

    } catch (error) {
        console.error('Stripe Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
