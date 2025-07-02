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