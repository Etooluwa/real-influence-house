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

        let emailResult = { success: false, error: null };
        let ckResult = { success: false, error: null };

        // 1. Send Notification Email (Resend)
        if (env.RESEND_API_KEY) {
            try {
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

                if (resendResponse.ok) {
                    emailResult.success = true;
                } else {
                    const data = await resendResponse.json();
                    emailResult.error = data.message || 'Resend API returned error';
                    console.error('Resend API Error:', data);
                }
            } catch (e) {
                emailResult.error = e.message;
                console.error('Resend Fetch Error:', e);
            }
        } else {
            emailResult.error = "Missing RESEND_API_KEY";
            console.warn('Missing RESEND_API_KEY');
        }

        // 2. Subscribe to ConvertKit (Best Effort)
        if (env.CONVERTKIT_API_KEY && env.CONVERTKIT_FORM_ID) {
            try {
                const ckResponse = await fetch(`https://api.convertkit.com/v3/forms/${env.CONVERTKIT_FORM_ID}/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json; charset=utf-8' },
                    body: JSON.stringify({
                        api_key: env.CONVERTKIT_API_KEY,
                        email: email,
                        first_name: fullName
                    })
                });

                if (ckResponse.ok) {
                    ckResult.success = true;
                } else {
                    const data = await ckResponse.json();
                    ckResult.error = data.message || 'ConvertKit API returned error';
                    console.error('ConvertKit API Error:', data);
                }
            } catch (ckError) {
                ckResult.error = ckError.message;
                console.error('ConvertKit Subscription Error:', ckError);
            }
        } else {
            ckResult.error = "Missing ConvertKit Configuration";
            console.warn('Missing ConvertKit Configuration');
        }

        // Determine Final Status
        // Success if at least one service worked, or if we attempted at least one and it wasn't a total configuration failure
        // Actually, if simply ONE succeeds, we treat it as success for the user.
        if (emailResult.success || ckResult.success) {
            return new Response(JSON.stringify({
                message: 'Signup processed successfully',
                email: emailResult,
                convertkit: ckResult
            }), {
                status: 200, // OK
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            // Both failed
            return new Response(JSON.stringify({
                error: 'Failed to process signup',
                details: { email: emailResult, convertkit: ckResult }
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (err) {
        console.error('Function Error:', err);
        return new Response(JSON.stringify({ error: `Internal server error: ${err.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
