const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { getContestants, addVotes } = require('./src/database');
const { initializePayment, verifyPayment } = require('./src/paystack');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const VOTE_COST = 200; // 1 Vote = 100 Naira

// API: Get all contestants
app.get('/api/contestants', (req, res) => {
    res.json(getContestants());
});

// API: Start Voting Process
app.post('/api/vote/start', async (req, res) => {
    const { contestantId, name, email, amount } = req.body;
    
    // Generate a unique reference: Vote_ContestantID_Timestamp
    const reference = `VOTE_${contestantId}_${Date.now()}`;
    
    // Call Paystack
    const paymentData = await initializePayment(name, email, amount, reference);
    
    if (paymentData) {
        res.json({ status: true, url: paymentData.authorization_url });
    } else {
        res.status(500).json({ status: false, message: "Payment initialization failed" });
    }
});

// API: Verify Vote (Called automatically by Paystack after payment)
app.get('/verify-vote', async (req, res) => {
    const reference = req.query.reference; // Paystack sends this in the URL
    
    const paymentDetails = await verifyPayment(reference);
    
    if (paymentDetails && paymentDetails.status === 'success') {
        // Extract info from our custom reference "VOTE_ID_TIME"
        const parts = reference.split('_'); 
        const contestantId = parts[1];
        const amountPaid = paymentDetails.amount / 100; // Convert back to Naira
        
        // Calculate Votes
        const votesToAdd = Math.floor(amountPaid / VOTE_COST);
        
        // Update "Database"
        addVotes(contestantId, votesToAdd);

        // Get the name for the success message
        const allContestants = getContestants();
        const candidate = allContestants.find(c => c.id === contestantId);
        
        // Redirect user to success page
        res.redirect(`/success.html?votes=${votesToAdd}&name=${candidate ? candidate.name : 'Candidate'}`);
    } else {
        res.send("Payment verification failed.");
    }
});

const PORT = process.env.PORT || 3000;
const baseURL = process.env.BASE_URL || `http://localhost:${PORT}`;
app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Application Accessible at: ${baseURL}`);
});