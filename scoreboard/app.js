const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs'); // Used for file I/O

const app = express();
const PORT = 80; // Change to port 80

// Define the end time as a constant at the start of the file (ISO string format)
const END_TIME = '2024-12-05T02:00:00Z'; // Example: set the end time to December 31, 2024 at 11:59:59 PM UTC
const endTime = new Date(END_TIME); // Convert it into a Date object
const refreshRate = 30000;
const remoteIp = "10.138.0.4";

// Middleware to parse JSON requests
app.use(express.json());

// Scoreboard data
let scores = {};
let scoreHistory = [];
let submittedFlags = {}; // Tracks flags submitted by teams

// List of valid flags
const validFlags = {
    FLAG1: 10,
    FLAG2: 20,
    FLAG3: 30,
};

// Initialize flag tracking for each team
function initializeFlagsForTeam(team) {
    if (!submittedFlags[team]) {
        submittedFlags[team] = {};
        for (const flag in validFlags) {
            submittedFlags[team][flag] = false;
        }
    }
}

// Function to fetch data from the `/king.txt` service
async function fetchTeam() {
    try {
        // Fetch from 10.138.0.2
        const response = await axios.get(`http://${remoteIp}:9999/`);
        let team = response.data.trim().toLowerCase(); // Convert team name to lowercase
        if (team && !isCompetitionEnded()) {
            scores[team] = (scores[team] || 0) + 1;
            initializeFlagsForTeam(team);
            scoreHistory.push({ time: new Date().toISOString(), team, score: scores[team] });
            saveDataToDisk(); // Save data on every update
        }
    } catch (error) {
        console.error('Error fetching team:', error.message);
    }
}

// Endpoint for flag submission
app.post('/api/submit-flag', (req, res) => {
    let { team, flag } = req.body;

    if (!team || !flag) {
        return res.status(400).json({ message: 'Team and flag are required' });
    }

    team = team.toLowerCase(); // Convert team name to lowercase

    if (!validFlags[flag]) {
        return res.status(400).json({ message: 'Invalid flag' });
    }

    if (isCompetitionEnded()) {
        return res.status(400).json({ message: 'Competition has ended. No more flags can be submitted.' });
    }

    initializeFlagsForTeam(team);

    if (submittedFlags[team][flag]) {
        return res.status(400).json({ message: 'Flag already submitted by this team' });
    }

    // Update score and mark the flag as submitted
    scores[team] = (scores[team] || 0) + validFlags[flag];
    submittedFlags[team][flag] = true;
    scoreHistory.push({ time: new Date().toISOString(), team, score: scores[team] });

    saveDataToDisk(); // Save data on every update

    res.json({ message: 'Flag submitted successfully', newScore: scores[team] });
});

// Check if the competition has ended based on the current time
function isCompetitionEnded() {
    return new Date() >= endTime;
}

// Function to save data to disk
function saveDataToDisk() {
    const data = JSON.stringify({ scores, scoreHistory, submittedFlags, endTime }, null, 2);
    fs.writeFileSync('scoreboardData.json', data);
}

// Function to load data from disk on server startup
function loadDataFromDisk() {
    if (fs.existsSync('scoreboardData.json')) {
        const data = JSON.parse(fs.readFileSync('scoreboardData.json', 'utf8'));
        scores = data.scores || {};
        scoreHistory = data.scoreHistory || [];
        submittedFlags = data.submittedFlags || {};
    }
}

// Load saved data when the server starts
loadDataFromDisk();

// Fetch data every second (1000 ms)
setInterval(fetchTeam, refreshRate);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Root route for the scoreboard (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Flag submission page
app.get('/flag', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/flag.html'));
});

// API endpoint for scoreboard data
app.get('/api/scores', (req, res) => {
    // Prepare the response data with the flag submission count
    const scoresWithFlagCounts = Object.keys(scores).map(team => {
        const flagsSubmitted = Object.values(submittedFlags[team] || {}).filter(flag => flag === true).length;
        return { team, score: scores[team], flagsSubmitted };
    });

    res.json({ scores: scoresWithFlagCounts, scoreHistory, endTime: END_TIME });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Web app running on http://localhost:${PORT}`);
});
