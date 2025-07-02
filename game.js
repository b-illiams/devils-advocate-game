// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDLavbwLXHKQXbwgDqRjTtjkltWyrAeG9M",
  authDomain: "devil-s-advocate-bedab.firebaseapp.com",
  databaseURL: "https://devil-s-advocate-bedab-default-rtdb.firebaseio.com",
  projectId: "devil-s-advocate-bedab",
  storageBucket: "devil-s-advocate-bedab.firebasestorage.app",
  messagingSenderId: "227194595235",
  appId: "1:227194595235:web:3381cd10a97b72e85b9c16",
  measurementId: "G-Q8Z5TXJZ8Q"
};

function createLobby(playerName) {
  const lobbyCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  const lobbyRef = ref(db, `lobbies/${lobbyCode}`);
  
  const hostPlayer = {
    name: playerName,
    role: null,
    score: 0,
    side: null
  };

  set(lobbyRef, {
    players: [hostPlayer],
    host: playerName,
    state: "waiting"
  });

  return lobbyCode;
}

function joinLobby(lobbyCode, playerName) {
  const playersRef = ref(db, `lobbies/${lobbyCode}/players`);
  
  push(playersRef, {
    name: playerName,
    role: null,
    score: 0,
    side: null
  });
}

function watchLobby(lobbyCode) {
  const playersRef = ref(db, `lobbies/${lobbyCode}/players`);
  onValue(playersRef, snapshot => {
    const data = snapshot.val();
    if (data) {
      players = Object.values(data);
      console.log("Current players:", players);
      // You can trigger UI updates here
    }
  });
}

document.getElementById("join-lobby-btn").addEventListener("click", () => {
  const name = document.getElementById("player-name-input").value.trim();
  const codeInput = document.getElementById("lobby-code-input").value.trim();
  const status = document.getElementById("lobby-status");

  if (!name) {
    status.textContent = "Name is required.";
    return;
  }

  let lobbyCode;
  if (codeInput) {
    joinLobby(codeInput, name);
    lobbyCode = codeInput;
    status.textContent = `Joined lobby ${lobbyCode}. Waiting for others...`;
  } else {
    lobbyCode = createLobby(name);
    status.textContent = `Created lobby ${lobbyCode}. Share this code to invite players.`;
  }

  watchLobby(lobbyCode); // starts real-time sync
});


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === Initial Setup ===
const roles = ["Devil's Advocate", "Defendant", "Plaintiff", "Jester", "Jury"];
let players = []; // Filled with player objects: { name, role, score, side }
let currentStatement = "";
let devilIndex = null;

// === Sample Statements ===
const statements = [
  "Artificial intelligence will replace most jobs.",
  "Pineapple belongs on pizza.",
  "Success is more about who you know than what you know.",
  "Children shouldn't use screens before age 10."
];

// === Role Assignment ===
function assignRoles() {
  const shuffledRoles = [...roles];
  while (shuffledRoles.length < players.length) shuffledRoles.push("Jury");

  shuffledRoles.sort(() => 0.5 - Math.random()); // Shuffle roles
  players.forEach((p, i) => {
    p.role = shuffledRoles[i];
    p.score = p.score || 0;
    if (p.role === "Devil's Advocate") devilIndex = i;
  });
}

// === Statement Selection ===
function drawStatement() {
  const randomIndex = Math.floor(Math.random() * statements.length);
  currentStatement = statements[randomIndex];
}

// === Side Locking ===
function lockSides() {
  players.forEach(p => {
    if (p.role === "Defendant") p.side = "Agree";
    else if (p.role === "Plaintiff") p.side = "Disagree";
    else if (p.role === "Devil's Advocate") {
      p.trueSide = Math.random() < 0.5 ? "Agree" : "Disagree";
      p.side = p.trueSide === "Agree" ? "Disagree" : "Agree";
    }
  });
}

// === Voting Logic ===
function voteDevil(votedIndex) {
  if (votedIndex === devilIndex) {
    players.forEach(p => {
      if (p.voted === devilIndex) p.score += 1;
    });
  } else {
    players[devilIndex].score += 1;
  }

  // Jester scoring logic
  players.forEach((p, i) => {
    if (p.role === "Jester" && p.voted === i) p.score += 2;
  });

  // Side majority bonus
  const sideCount = players.reduce((tally, p) => {
    tally[p.side] = (tally[p.side] || 0) + 1;
    return tally;
  }, {});

  const majoritySide = sideCount["Agree"] > sideCount["Disagree"] ? "Agree" : "Disagree";
  players.forEach(p => {
    if (p.side === majoritySide && ["Defendant", "Plaintiff", "Devil's Advocate"].includes(p.role)) {
      p.score += 1;
    }
  });

}