const fs = require('fs');
const path = require('path');

// The path to our permanent storage file
const dbPath = path.join(__dirname, 'data.json');

// 1. Load the database into memory ONCE when the server starts
let contestantsCache = [];
try {
    const data = fs.readFileSync(dbPath, 'utf8');
    contestantsCache = JSON.parse(data);
    console.log("Database successfully loaded into memory.");
} catch (err) {
    console.error("Error reading initial database file:", err);
    contestantsCache = [];
}

// Variables to handle write queuing safely
let isWriting = false;
let pendingWrite = false;

// Helper: Safely save data to file asynchronously in the background
const saveContestantsAsync = () => {
    // If a save is already in progress, flag that we need to save again after it finishes
    if (isWriting) {
        pendingWrite = true;
        return;
    }

    isWriting = true;

    // Write to the file asynchronously without blocking the server
    fs.writeFile(dbPath, JSON.stringify(contestantsCache, null, 2), (err) => {
        isWriting = false;

        if (err) {
            console.error("Error saving database file:", err);
        }

        // If another vote came in while we were writing, trigger another save
        if (pendingWrite) {
            pendingWrite = false;
            saveContestantsAsync();
        }
    });
};

// Return the blazing fast in-memory array instead of reading the disk
const getContestants = () => {
    return contestantsCache;
};

// Function to add votes safely
const addVotes = (id, numberOfVotes) => {
    // 2. Update RAM instantly (Safe from Race Conditions because Node memory is single-threaded)
    const candidate = contestantsCache.find(c => c.id === id);

    if (candidate) {
        // Add the votes in memory
        candidate.votes += numberOfVotes;

        // 3. Trigger a background save to the hard drive
        saveContestantsAsync();

        return true;
    }
    return false;
};

module.exports = { getContestants, addVotes };