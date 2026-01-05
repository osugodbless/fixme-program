const axios = require('axios');
require('dotenv').config();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// 1. Initialize Payment (Get the payment URL)
const initializePayment = async (name, email, amount, reference) => {
    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                name: name,
                email: email,
                amount: amount * 100, // Paystack expects amount in Kobo (e.g., 500 Naira = 50000 kobo)
                reference: reference,
                callback_url: `${process.env.BASE_URL}/verify-vote` // Where to go after payment
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.data; // Returns authorization_url
    } catch (error) {
        console.error(error);
        return null;
    }
};

// 2. Verify Payment (Check if they actually paid)
const verifyPayment = async (reference) => {
    try {
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
            }
        );
        return response.data.data;
    } catch (error) {
        return null;
    }
};

module.exports = { initializePayment, verifyPayment };