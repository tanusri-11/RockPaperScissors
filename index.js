const buttons = document.querySelectorAll(".choice-btn");
const resultEl = document.getElementById("result");
const playerScoreEl = document.getElementById("user-score");
const computerScoreEl = document.getElementById("computer-score");
const playerChoiceEl = document.getElementById("player-choice");
const computerChoiceEl = document.getElementById("computer-choice");
const timerEl = document.getElementById("timer-display");
const gameStatusEl = document.getElementById("game-status");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const pauseBtn = document.getElementById("pause-btn");
const scoreLimitInput = document.getElementById("score-limit");
const finalResultEl = document.getElementById("final-result");
const winConditionDisplay = document.getElementById("win-condition-display");
const popupOverlay = document.getElementById("popup-overlay");
const popupTitle = document.getElementById("popup-title");
const popupScore = document.getElementById("popup-score");
const popupMessage = document.getElementById("popup-message");
const popupPlayAgain = document.getElementById("popup-play-again");
const popupClose = document.getElementById("popup-close");

let playerScore = 0;
let computerScore = 0;
let gameActive = false;
let roundActive = false;
let playerChoice = null;
let computerChoice = null;
let countdownTimer = null;
let scoreLimit = 5;
let isPaused = false;

const choiceEmojis = {
    rock: "✊",
    paper: "✋",
    scissors: "✌️"
};

const choiceNames = {
    rock: "Rock",
    paper: "Paper",
    scissors: "Scissors"
};

// Sound effects using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function createBeep(frequency, duration, type = 'sine') {
    return new Promise((resolve) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);

        setTimeout(resolve, duration * 1000);
    });
}

function playTickSound() {
    createBeep(800, 0.1);
}

function playSuccessSound() {
    createBeep(523, 0.2).then(() => createBeep(659, 0.2)).then(() => createBeep(784, 0.3));
}

function playFailSound() {
    createBeep(200, 0.5, 'sawtooth');
}

function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    const container = document.querySelector('.popup-modal');

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(confetti);

        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 5000);
    }
}

// Event listeners
buttons.forEach((button) => {
    button.addEventListener("click", () => {
        if (!roundActive || isPaused) return;
        selectChoice(button.id);
    });
});

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);
pauseBtn.addEventListener("click", togglePause);

scoreLimitInput.addEventListener("change", () => {
    const value = parseInt(scoreLimitInput.value);
    if (value >= 1 && value <= 20) {
        scoreLimit = value;
        winConditionDisplay.textContent = scoreLimit;
    } else {
        scoreLimitInput.value = scoreLimit;
    }
});

popupPlayAgain.addEventListener("click", () => {
    hidePopup();
    resetGame();
    setTimeout(startGame, 500);
});

popupClose.addEventListener("click", hidePopup);

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (!roundActive || isPaused) return;

    switch (e.key.toLowerCase()) {
        case 'r':
            selectChoice('rock');
            break;
        case 'p':
            selectChoice('paper');
            break;
        case 's':
            selectChoice('scissors');
            break;
        case ' ':
            e.preventDefault();
            togglePause();
            break;
    }
});

function selectChoice(choice) {
    if (playerChoice) return; // Already selected

    playerChoice = choice;
    createBeep(600, 0.1); // Selection sound

    // Visual feedback for selection
    buttons.forEach(btn => btn.classList.remove('selected'));
    document.getElementById(choice).classList.add('selected');

    playerChoiceEl.textContent = choiceEmojis[choice];
    gameStatusEl.textContent = "Choice locked! Wait for time up...";
}

function togglePause() {
    if (!gameActive) return;

    isPaused = !isPaused;
    if (isPaused) {
        pauseBtn.textContent = "RESUME";
        gameStatusEl.textContent = "Game Paused - Click RESUME to continue";
        if (countdownTimer) {
            clearInterval(countdownTimer);
        }
    } else {
        pauseBtn.textContent = "PAUSE GAME";
        if (roundActive) {
            // Resume the countdown from where it left off
            const currentTime = parseInt(timerEl.textContent);
            if (currentTime > 0) {
                startCountdown(currentTime);
            }
        }
    }
}

function startGame() {
    // Initialize audio context on user interaction
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    scoreLimit = parseInt(scoreLimitInput.value) || 5;
    gameActive = true;
    isPaused = false;
    playerScore = 0;
    computerScore = 0;
    playerScoreEl.textContent = playerScore;
    computerScoreEl.textContent = computerScore;
    finalResultEl.innerHTML = "";

    startBtn.disabled = true;
    scoreLimitInput.disabled = true;
    pauseBtn.disabled = false;
    pauseBtn.textContent = "PAUSE GAME";

    startRound();
}

function startRound() {
    if (!gameActive || isPaused) return;

    roundActive = true;
    playerChoice = null;
    computerChoice = null;

    // Reset displays
    playerChoiceEl.textContent = "❓";
    computerChoiceEl.textContent = "❓";
    playerChoiceEl.className = "choice-display";
    computerChoiceEl.className = "choice-display";
    resultEl.textContent = "Make your choice now!";
    resultEl.className = "result";

    // Enable buttons
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('selected');
    });

    // Start countdown
    startCountdown(3);
}

function startCountdown(startTime) {
    let timeLeft = startTime;
    timerEl.textContent = timeLeft;
    timerEl.className = "timer-display countdown";
    gameStatusEl.textContent = "Choose your weapon! Time is ticking...";

    // Play initial tick
    playTickSound();

    countdownTimer = setInterval(() => {
        if (isPaused) return;

        timeLeft--;
        timerEl.textContent = timeLeft;

        if (timeLeft > 0) {
            playTickSound();
        }

        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            endRound();
        }
    }, 1000);
}

function endRound() {
    roundActive = false;
    timerEl.className = "timer-display";
    timerEl.textContent = "⏱️";

    // Disable buttons
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove('selected');
    });

    // Generate computer choice
    const choices = ["rock", "paper", "scissors"];
    computerChoice = choices[Math.floor(Math.random() * choices.length)];
    computerChoiceEl.textContent = choiceEmojis[computerChoice];

    // If player didn't choose, they forfeit
    if (!playerChoice) {
        playerChoiceEl.textContent = "😴";
        gameStatusEl.textContent = "Too slow! You forfeited this round.";
        resultEl.textContent = "💔 Time's up! Computer wins by default.";
        resultEl.className = "result lose";
        computerScore++;
        computerScoreEl.textContent = computerScore;
        computerChoiceEl.className = "choice-display winner";
        playerChoiceEl.className = "choice-display loser";
        playFailSound();
    } else {
        // Determine winner
        const result = determineWinner(playerChoice, computerChoice);
        displayResult(result, playerChoice, computerChoice);
    }

    // Check if game is over
    setTimeout(() => {
        if (playerScore >= scoreLimit || computerScore >= scoreLimit) {
            endGame();
        } else {
            startRound(); // Start next round immediately
        }
    }, 1000); // Reduced from 2000ms to 1000ms
}

function determineWinner(playerSelection, computerSelection) {
    if (playerSelection === computerSelection) {
        return "tie";
    } else if (
        (playerSelection === "rock" && computerSelection === "scissors") ||
        (playerSelection === "paper" && computerSelection === "rock") ||
        (playerSelection === "scissors" && computerSelection === "paper")
    ) {
        playerScore++;
        playerScoreEl.textContent = playerScore;
        return "win";
    } else {
        computerScore++;
        computerScoreEl.textContent = computerScore;
        return "lose";
    }
}

function displayResult(result, playerChoice, computerChoice) {
    let message = "";
    let resultClass = "result";

    if (result === "tie") {
        message = `🤝 It's a tie! Both chose ${choiceNames[playerChoice]}`;
        resultClass += " tie";
        gameStatusEl.textContent = "No points awarded!";
        playerChoiceEl.className = "choice-display";
        computerChoiceEl.className = "choice-display";
        createBeep(400, 0.3);
    } else if (result === "win") {
        message = `🎉 You Win! ${choiceNames[playerChoice]} beats ${choiceNames[computerChoice]}`;
        resultClass += " win";
        gameStatusEl.textContent = "Point to you!";
        playerChoiceEl.className = "choice-display winner";
        computerChoiceEl.className = "choice-display loser";
        playSuccessSound();
    } else {
        message = `💔 You Lose! ${choiceNames[computerChoice]} beats ${choiceNames[playerChoice]}`;
        resultClass += " lose";
        gameStatusEl.textContent = "Point to computer!";
        playerChoiceEl.className = "choice-display loser";
        computerChoiceEl.className = "choice-display winner";
        playFailSound();
    }

    resultEl.textContent = message;
    resultEl.className = resultClass;
}

function endGame() {
    gameActive = false;
    roundActive = false;
    startBtn.disabled = false;
    scoreLimitInput.disabled = false;
    pauseBtn.disabled = true;

    const isVictory = playerScore >= scoreLimit;

    // Show popup with effects
    showGameEndPopup(isVictory);

    gameStatusEl.textContent = "Game Over! Check the popup for results.";
    timerEl.textContent = isVictory ? "🏆" : "😔";
}

function showGameEndPopup(isVictory) {
    popupOverlay.classList.add('show');

    if (isVictory) {
        popupTitle.textContent = "🏆 VICTORY!";
        popupTitle.className = "popup-title victory";
        popupScore.textContent = `You won ${playerScore}-${computerScore}!`;
        popupMessage.innerHTML = `
                    🎉 Congratulations! You dominated the battlefield! 🎉<br>
                    You proved your reflexes and strategy are superior!<br>
                    Ready for another epic battle?
                `;

        // Victory effects
        playSuccessSound();
        setTimeout(() => {
            createConfetti();
        }, 500);
    } else {
        popupTitle.textContent = "😔 DEFEAT!";
        popupTitle.className = "popup-title defeat";
        popupScore.textContent = `Computer won ${computerScore}-${playerScore}!`;
        popupMessage.innerHTML = `
                    💔 The computer got the best of you this time! 💔<br>
                    Don't give up - practice makes perfect!<br>
                    Better luck next time! Want to try again?
                `;

        // Defeat sound
        playFailSound();
    }
}

function hidePopup() {
    popupOverlay.classList.remove('show');

    // Clean up any remaining confetti
    const confettiElements = document.querySelectorAll('.confetti');
    confettiElements.forEach(confetti => {
        if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti);
        }
    });
}

function resetGame() {
    // Clear any active timers
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }

    gameActive = false;
    roundActive = false;
    isPaused = false;
    playerScore = 0;
    computerScore = 0;
    playerChoice = null;
    computerChoice = null;

    // Reset UI
    playerScoreEl.textContent = playerScore;
    computerScoreEl.textContent = computerScore;
    playerChoiceEl.textContent = "❓";
    computerChoiceEl.textContent = "❓";
    playerChoiceEl.className = "choice-display";
    computerChoiceEl.className = "choice-display";
    resultEl.textContent = "Ready for battle?";
    resultEl.className = "result";
    timerEl.textContent = "⏱️";
    timerEl.className = "timer-display";
    gameStatusEl.textContent = "Set your winning rounds and click START BATTLE!";
    finalResultEl.innerHTML = "";

    // Reset buttons
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove('selected');
    });

    startBtn.disabled = false;
    scoreLimitInput.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = "PAUSE GAME";
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function () {
    resetGame();
    console.log('🎮 Rock Paper Scissors Game Loaded Successfully!');

    // Add keyboard shortcuts info
    console.log('⌨️ Keyboard shortcuts: R = Rock, P = Paper, S = Scissors, Space = Pause/Resume');
});

// Handle visibility change (when tab becomes inactive)
document.addEventListener('visibilitychange', function () {
    if (document.hidden && gameActive && roundActive && !isPaused) {
        togglePause();
    }
});
