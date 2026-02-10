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

        // ConvertKit API Configuration
        const formId = env.CONVERTKIT_FORM_ID;
        const apiKey = env.CONVERTKIT_API_KEY;

        if (!formId || !apiKey) {
            console.error('ConvertKit configuration missing: CONVERTKIT_FORM_ID or CONVERTKIT_API_KEY not set.');
            throw new Error('Server configuration error');
        }

        // Subscribe to ConvertKit Form
        const convertKitResponse = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                api_key: apiKey,
                email: email,
                first_name: fullName
            })
        });

        const data = await convertKitResponse.json();

        if (!convertKitResponse.ok) {
            console.error('ConvertKit API error:', data);
            throw new Error('Failed to subscribe to ConvertKit');
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Signup successful! Please check your email to confirm your subscription.'
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
