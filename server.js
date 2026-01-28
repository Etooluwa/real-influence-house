require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const port = process.env.PORT || 3000;
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json());

app.post('/api/send', async (req, res) => {
    const { firstName, lastName, email, social, website, services, message } = req.body;

    const servicesList = services && services.length > 0 ? services.join(', ') : 'None selected';

    try {
        const { data, error } = await resend.emails.send({
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
            `,
        });

        if (error) {
            console.error('Error sending email:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log('Email sent successfully:', data);
        res.status(200).json({ message: 'Email sent successfully', data });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
