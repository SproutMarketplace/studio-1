
import { NextResponse, type NextRequest } from 'next/server';
import Shippo from 'shippo';

// Initialize Shippo client
// The type assertion is safe because we check for the key's existence.
const shippo = new Shippo(process.env.SHIPPO_API_KEY as string);

export async function POST(req: NextRequest) {
    if (!process.env.SHIPPO_API_KEY || process.env.SHIPPO_API_KEY.includes('_PUT_YOUR_SHIPPO_API_KEY_HERE_')) {
        return NextResponse.json({ error: 'Shippo API key is not configured on the server.' }, { status: 500 });
    }

    try {
        // In a real app, you'd get these details from the request body,
        // which would be populated with the buyer's address from the order
        // and the seller's address from their profile.
        // const { fromAddress, toAddress, parcel } = await req.json();

        // For now, we'll use placeholder data.
        // IMPORTANT: This example uses a Shippo test address.
        // Replace with actual seller address in a real implementation.
        const fromAddress = {
            name: "Shawn Ippotle",
            street1: "215 Clayton St.",
            city: "San Francisco",
            state: "CA",
            zip: "94117",
            country: "US",
            phone: "+1 555 341 9393",
            email: "shippotest@goshippo.com"
        };
        
        // This would be the buyer's address from the order.
        const toAddress = {
            name: "Mr Hippo",
            street1: "965 Mission St",
            city: "San Francisco",
            state: "CA",
            zip: "94103",
            country: "US",
            phone: "+1 555 341 9393",
            email: "hippo@goshippo.com"
        };
        
        // This would come from the seller in the dialog.
        const parcel = {
            length: "10",
            width: "5",
            height: "5",
            distance_unit: "in",
            weight: "2",
            mass_unit: "lb"
        };

        // 1. Create a shipment object
        const shipment = await shippo.shipment.create({
            address_from: fromAddress,
            address_to: toAddress,
            parcels: [parcel],
            async: false
        });

        // Check if rates were returned
        if (!shipment.rates || shipment.rates.length === 0) {
            return NextResponse.json({ error: "Could not retrieve shipping rates for this shipment." }, { status: 400 });
        }

        // 2. Find the cheapest rate (e.g., USPS Priority)
        const rate = shipment.rates.find((r: any) => r.provider === 'USPS' && r.servicelevel.token === 'usps_priority');
        if (!rate) {
             return NextResponse.json({ error: 'Could not find a suitable shipping rate.' }, { status: 400 });
        }

        // 3. Purchase the label
        const transaction = await shippo.transaction.create({
            rate: rate.object_id,
            label_file_type: "PDF",
            async: false
        });

        // 4. Check the transaction status
        if (transaction.status === "SUCCESS") {
            return NextResponse.json({
                labelUrl: transaction.label_url,
                trackingNumber: transaction.tracking_number
            });
        } else {
             return NextResponse.json({ error: 'Failed to create shipping label.', details: transaction.messages }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Shippo API Error:', error);
        return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status: 500 });
    }
}
