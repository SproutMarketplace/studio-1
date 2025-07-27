
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import type { PlantListing } from '@/models';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      typescript: true,
    })
  : null;

interface CartItem extends PlantListing {
    quantity: number;
}

interface RequestBody {
    items?: CartItem[];
    userId?: string;
    priceId?: string; // For subscriptions
    type: 'one-time' | 'subscription';
}

const getStripePriceId = (priceId: string): string => {
    switch(priceId) {
        case 'pro-monthly': return process.env.STRIPE_PRO_MONTHLY_PRICE_ID!;
        case 'pro-yearly': return process.env.STRIPE_PRO_YEARLY_PRICE_ID!;
        case 'elite-monthly': return process.env.STRIPE_ELITE_MONTHLY_PRICE_ID!;
        case 'elite-yearly': return process.env.STRIPE_ELITE_YEARLY_PRICE_ID!;
        default: throw new Error('Invalid price ID');
    }
}

export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    if (!stripe) {
        const errorMessage = "Stripe is not configured on the server. The STRIPE_SECRET_KEY is missing or invalid in your .env.local file.";
        return NextResponse.json({ error: 'Checkout is currently disabled. Please contact support.' }, { status: 503 });
    }
    
    const { items, userId, type, priceId }: RequestBody = await req.json();

    if (!userId) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    try {
        if (type === 'subscription' && priceId) {
            // Subscription Logic
            if (!process.env.STRIPE_PRO_MONTHLY_PRICE_ID || !process.env.STRIPE_PRO_YEARLY_PRICE_ID || !process.env.STRIPE_ELITE_MONTHLY_PRICE_ID || !process.env.STRIPE_ELITE_YEARLY_PRICE_ID) {
                return NextResponse.json({ error: 'Subscription price IDs are not configured on the server.' }, { status: 500 });
            }
            const stripePriceId = getStripePriceId(priceId);

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price: stripePriceId,
                    quantity: 1,
                }],
                mode: 'subscription',
                subscription_data: {
                    trial_period_days: 7,
                },
                success_url: `${req.headers.get('origin')}/catalog?subscription_success=true`,
                cancel_url: `${req.headers.get('origin')}/subscription?canceled=true`,
                metadata: {
                    userId,
                    priceId,
                },
                ui_options: {
                    appearance: {
                        theme: 'stripe',
                        variables: {
                            colorPrimary: '#22764e',
                            colorBackground: '#f5f5dc',
                            colorText: '#3c3633',
                            borderRadius: '0.5rem',
                        },
                    },
                }
            });
            return NextResponse.json({ sessionId: session.id });

        } else if (type === 'one-time' && items) {
            // One-time payment logic (existing)
            const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items
                .filter(item => item.price && item.price > 0 && item.isAvailable)
                .map((item) => ({
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: item.name,
                            description: item.description.substring(0, 100),
                            images: item.imageUrls.length > 0 ? [item.imageUrls[0]] : undefined,
                        },
                        unit_amount: Math.round(item.price! * 100),
                    },
                    quantity: item.quantity,
                }));
            
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
                },
                ui_options: {
                    appearance: {
                         theme: 'stripe',
                        variables: {
                            colorPrimary: '#22764e',
                            colorBackground: '#f5f5dc',
                            colorText: '#3c3633',
                            borderRadius: '0.5rem',
                        },
                    }
                }
            });
            return NextResponse.json({ sessionId: session.id });
        } else {
             return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

    } catch (error) {
        console.error('Stripe Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
