
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import type { PlantListing, User } from '@/models';
import { getUserProfile } from '@/lib/firestoreService';

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
    subscriptionTier?: 'free' | 'pro' | 'elite';
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

const BUYER_FEE_PERCENTAGE = 0.045; // 4.5%
const SELLER_FEE_PERCENTAGE = 0.065; // 6.5%

export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
    }

    if (!stripe) {
        const errorMessage = "Stripe is not configured on the server. The STRIPE_SECRET_KEY is missing or invalid in your .env.local file.";
        return NextResponse.json({ error: 'Checkout is currently disabled. Please contact support.' }, { status: 503 });
    }
    
    const { items, userId, type, priceId, subscriptionTier }: RequestBody = await req.json();

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
            });
            return NextResponse.json({ sessionId: session.id });

        } else if (type === 'one-time' && items && items.length > 0) {
            
            // --- Logic for Split Payments with Stripe Connect ---

            // 1. Group items by seller
            const itemsBySeller: { [key: string]: CartItem[] } = items.reduce((acc, item) => {
                const sellerId = item.ownerId;
                if (!acc[sellerId]) {
                    acc[sellerId] = [];
                }
                acc[sellerId].push(item);
                return acc;
            }, {} as { [key: string]: CartItem[] });

            const sessionIds: string[] = [];
            
            // 2. Create a checkout session for each seller
            for (const sellerId in itemsBySeller) {
                const sellerItems = itemsBySeller[sellerId];
                
                const sellerProfile = await getUserProfile(sellerId);
                if (!sellerProfile?.stripeAccountId || !sellerProfile?.stripeDetailsSubmitted) {
                    // This seller can't receive payments, so we skip them for now.
                    // A more robust solution might show an error to the user in the cart.
                    console.warn(`Seller ${sellerId} has not completed Stripe onboarding. Skipping their items.`);
                    continue; 
                }

                // 3. Calculate fees
                const isBuyerElite = subscriptionTier === 'elite';
                const isSellerElite = sellerProfile.subscriptionTier === 'elite';

                const subtotalInCents = sellerItems.reduce((acc, item) => acc + (item.price! * 100 * item.quantity), 0);
                
                let totalFeeInCents = 0;
                if (!isBuyerElite) {
                    totalFeeInCents += subtotalInCents * BUYER_FEE_PERCENTAGE;
                }
                if (!isSellerElite) {
                    totalFeeInCents += subtotalInCents * SELLER_FEE_PERCENTAGE;
                }
                
                // Add the buyer's fee to the line items if they are not elite
                const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = sellerItems.map(item => ({
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
                
                if (!isBuyerElite) {
                     line_items.push({
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: 'Platform Fee',
                                description: 'For secure transactions and platform maintenance.',
                            },
                            unit_amount: Math.round(subtotalInCents * BUYER_FEE_PERCENTAGE),
                        },
                        quantity: 1,
                    });
                }

                // 4. Create the session with application_fee_amount
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items,
                    mode: 'payment',
                    success_url: `${req.headers.get('origin')}/catalog?checkout_success=true&seller_count=${Object.keys(itemsBySeller).length}`,
                    cancel_url: `${req.headers.get('origin')}/catalog?canceled=true`,
                    payment_intent_data: {
                        application_fee_amount: Math.round(totalFeeInCents),
                        transfer_data: {
                            destination: sellerProfile.stripeAccountId,
                        },
                    },
                    metadata: {
                        userId,
                        cartItems: JSON.stringify(sellerItems.map(item => ({
                            plantId: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            imageUrl: item.imageUrls[0] || "",
                            sellerId: item.ownerId,
                        }))),
                    },
                });
                sessionIds.push(session.id);
            }

            if (sessionIds.length === 0) {
                 return NextResponse.json({ error: 'Could not create a checkout session. The seller may not have completed their payment setup.' }, { status: 400 });
            }

            return NextResponse.json({ sessionIds });

        } else {
             return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

    } catch (error) {
        console.error('Stripe Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
