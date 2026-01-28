export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        // Parse the JSON body from the request
        const body = await request.json();
        const { firstName, lastName, email, social, website, services, message } = body;
        const servicesList = services && services.length > 0 ? services.join(', ') : 'None selected';

        if (!env.RESEND_API_KEY) {
            return new Response(JSON.stringify({ error: 'Server configuration error: Missing API Key' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Send email using Resend API via fetch
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Real Influence Website <website@contact.realinfluencehouse.com>',
                to: ['hello@realinfluencehouse.com'],
                subject: `New Inquiry from ${firstName} ${lastName}`,
                html: `
                    <h2>New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Social Media:</strong> ${social || 'N/A'}</p>
                    <p><strong>Website:</strong> ${website || 'N/A'}</p>
                    <p><strong>Services of Interest:</strong> ${servicesList}</p>
                    <p><strong>Additional Info:</strong></p>
                    <p>${message || 'No message provided'}</p>
                `
            })
        });

        const data = await resendResponse.json();

        if (!resendResponse.ok) {
            console.error('Resend API Error:', data);
            return new Response(JSON.stringify({ error: data.message || 'Failed to send email' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ message: 'Email sent successfully', data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Function Error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
