const fs = require('fs');
const path = require('path');

// The path to our permanent storage file
const dbPath = path.join(__dirname, 'data.json');

// Helper: Read data from file
const getContestants = () => {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
};

// Helper: Save data to file
const saveContestants = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Function to add votes safely
const addVotes = (id, numberOfVotes) => {
    const contestants = getContestants(); // 1. Get current list
    const candidate = contestants.find(c => c.id === id);
    
    if (candidate) {
        candidate.votes += numberOfVotes; // 2. Add votes
        saveContestants(contestants);     // 3. Save back to file immediately
        return true;
    }
    return false;
};

module.exports = { getContestants, addVotes };