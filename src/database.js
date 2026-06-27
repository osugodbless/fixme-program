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
            { new: true } // returns the updated document
        );
        return !!result;
    } catch (err) {
        console.error("Error adding votes:", err);
        return false;
    }
};

module.exports = { getContestants, addVotes, Contestant, connectDB };