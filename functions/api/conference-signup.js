export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { fullName, email } = body;

        if (!fullName || !email) {
            return new Response(JSON.stringify({ error: 'Name and email are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!env.RESEND_API_KEY) {
            return new Response(JSON.stringify({ error: 'Server configuration error: Missing API Key' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Send notification email to hello@realinfluencehouse.com
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Real Influence Website <website@contact.realinfluencehouse.com>',
                to: ['hello@realinfluencehouse.com'],
                subject: `Conference Interest: ${fullName}`,
                html: `
                    <h2>New Conference Interest Signup</h2>
                    <p><strong>Name:</strong> ${fullName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p>This person wants to be notified when The Art of Influence Conference tickets become available.</p>
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

        return new Response(JSON.stringify({ message: 'Signup successful', data }), {
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
