
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import type { PlantListing } from '@/models';

// This is the correct way to initialize Stripe in an API Route.
// It will only be instantiated if the secret key is provided in .env.local.
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })
  : null;

interface CartItem extends PlantListing {
    quantity: number;
}

export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    if (!stripe) {
        const errorMessage = "Stripe is not configured. The server is missing a valid STRIPE_SECRET_KEY. Please check your server's environment variables.";
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
            .filter(item => item.price && item.price > 0 && item.isAvailable)
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
                    imageUrl: item.imageUrls[0] || "",
                    sellerId: item.ownerId,
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
