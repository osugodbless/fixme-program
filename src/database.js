const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define Contestant Schema
const contestantSchema = new mongoose.Schema({
    id: String,
    name: String,
    stageName: String,
    school: String,
    bio: String,
    funFact: String,
    image: String,
    votes: { type: Number, default: 0 }
});

const Contestant = mongoose.model('Contestant', contestantSchema);

// Define Transaction Schema for Idempotency
const transactionSchema = new mongoose.Schema({
    reference: { type: String, required: true, unique: true },
    contestantId: String,
    votesAdded: Number,
    date: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Connect to MongoDB
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    try {
        if (!process.env.MONGODB_URI) {
            console.warn("WARNING: MONGODB_URI is not set in your .env file!");
            return;
        }
        // Simplified connection string suitable for Mongoose 6+
        await mongoose.connect(process.env.MONGODB_URI);
        isConnected = true;
        console.log("Connected to MongoDB successfully!");
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
    }
};

// Async Helper: Get all contestants
const getContestants = async () => {
    try {
        const contestants = await Contestant.find({}).sort({ id: 1 }).lean();
        return contestants;
    } catch (err) {
        console.error("Error getting contestants:", err);
        return [];
    }
};

// Async Function to safely add votes
const addVotes = async (id, numberOfVotes) => {
    try {
        // Atomic operations ($inc) prevent race conditions intrinsically at the DB layer
        const result = await Contestant.findOneAndUpdate(
            { id: id },
            { $inc: { votes: numberOfVotes } },
            { returnDocument: 'after' } // returns the updated document
        );
        return !!result;
    } catch (err) {
        console.error("Error adding votes:", err);
        return false;
    }
};

// Idempotent Function to process payment and add votes exactly once
const processPaymentAndAddVotes = async (reference, contestantId, votesToAdd) => {
    try {
        // Attempt to save the transaction. If reference already exists, it will throw a duplicate key error (11000)
        const newTransaction = new Transaction({ reference, contestantId, votesAdded: votesToAdd });
        await newTransaction.save();

        // If we reach here, the transaction is new. Add the votes safely.
        await addVotes(contestantId, votesToAdd);
        return { success: true, status: 'processed' };
    } catch (err) {
        // 11000 is the MongoDB duplicate key error code
        if (err.code === 11000) {
            console.log(`Transaction ${reference} already processed. Skipping.`);
            return { success: true, status: 'already_processed' };
        }
        console.error("Error processing payment transaction:", err);
        return { success: false, status: 'error' };
    }
};

module.exports = { getContestants, addVotes, processPaymentAndAddVotes, Contestant, Transaction, connectDB };