export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { fullName, email } = await request.json();

        if (!fullName || !email) {
            return new Response(JSON.stringify({ error: 'Name and email are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Send notification email to the business
        const emailContent = `
New Discount Signup for Digital Learning!

Name: ${fullName}
Email: ${email}
Signup Time: ${new Date().toISOString()}

This person signed up for the 10% off Digital Learning discount.
        `.trim();

        // Send via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'The Real Influence House <notifications@realinfluencehouse.com>',
                to: ['hello@realinfluencehouse.com'],
                subject: `New Discount Signup: ${fullName}`,
                text: emailContent
            })
        });

        if (!resendResponse.ok) {
            const errorData = await resendResponse.json();
            console.error('Resend API error:', errorData);
            throw new Error('Failed to send notification email');
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Signup successful! Check your email for the discount code.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Discount signup error:', error);
        return new Response(JSON.stringify({ error: 'Failed to process signup' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
