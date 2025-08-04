
import { NextResponse, type NextRequest } from 'next/server';
import Mailjet from 'node-mailjet';
import * as z from 'zod';

// Schema for validating the request body
const contactSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    message: z.string().min(10).max(500),
});

export async function POST(req: NextRequest) {
    // --- Start of Defensive Checks ---
    const mailjetApiKey = process.env.MAILJET_API_KEY;
    const mailjetSecretKey = process.env.MAILJET_SECRET_KEY;
    const receiverEmail = process.env.CONTACT_FORM_RECEIVER_EMAIL;

    if (!mailjetApiKey || !mailjetSecretKey || !receiverEmail) {
        console.error("CRITICAL: Mailjet environment variables are missing.");
        return NextResponse.json({ error: 'Email service is not configured on the server.' }, { status: 500 });
    }
    // --- End of Defensive Checks ---

    try {
        const body = await req.json();
        const parsedData = contactSchema.safeParse(body);

        if (!parsedData.success) {
            return NextResponse.json({ error: 'Invalid form data.', details: parsedData.error.flatten() }, { status: 400 });
        }

        const { name, email, message } = parsedData.data;

        const mailjet = new Mailjet({
            apiKey: mailjetApiKey,
            apiSecret: mailjetSecretKey,
        });

        const request = mailjet
            .post('send', { version: 'v3.1' })
            .request({
                Messages: [
                    {
                        From: {
                            Email: receiverEmail, // Use a verified sender email in Mailjet
                            Name: "Sprout Contact Form"
                        },
                        To: [
                            {
                                Email: receiverEmail,
                                Name: "Sprout Admin"
                            }
                        ],
                        Subject: `New Contact Form Message from ${name}`,
                        TextPart: `
                            You have a new message from your website contact form.
                            
                            Name: ${name}
                            Email: ${email}
                            
                            Message:
                            ${message}
                        `,
                        HTMLPart: `
                            <h3>You have a new message from your website contact form.</h3>
                            <p><b>Name:</b> ${name}</p>
                            <p><b>Email:</b> <a href="mailto:${email}">${email}</a></p>
                            <p><b>Message:</b></p>
                            <p>${message.replace(/\n/g, "<br>")}</p>
                        `,
                        ReplyTo: {
                           Email: email,
                           Name: name
                        }
                    }
                ]
            });

        await request;

        return NextResponse.json({ message: 'Message sent successfully!' }, { status: 200 });

    } catch (error) {
        console.error('Mailjet Error:', error);
        // It's good practice to check for specific Mailjet error structures if available
        // For now, a generic error is returned.
        return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
    }
}
