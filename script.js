
document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    let currentStage = 1;

    function nextStage() {
        // Hide current
        document.getElementById(`stage-${currentStage}`).classList.remove('active');
        document.getElementById(`stage-${currentStage}`).classList.add('hidden');

        currentStage++;

        // Show next
        const nextEl = document.getElementById(`stage-${currentStage}`);
        if (nextEl) {
            nextEl.classList.remove('hidden');
            nextEl.classList.add('active');

            // Init level logic
            if (currentStage === 2) initMemoryGame();
            if (currentStage === 3) initPatternGame();
            if (currentStage === 4) initGiftReveal();
        }
    }

    // --- STAGE 1: RIDDLE ---
    const riddleInput = document.getElementById('riddle-input');
    const riddleSubmit = document.getElementById('riddle-submit');
    const riddleError = document.getElementById('riddle-error');

    // CHANGE THIS ANSWER!
    const CORRECT_ANSWER = "keyboard";

    riddleSubmit.addEventListener('click', checkRiddle);
    riddleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkRiddle();
    });

    function checkRiddle() {
        const val = riddleInput.value.toLowerCase().trim();
        // Allow multiple valid answers if needed
        if (val === CORRECT_ANSWER || val.includes("key")) {
            nextStage();
        } else {
            riddleError.classList.remove('hidden');
            riddleInput.classList.add('shake'); // Optional animation
            setTimeout(() => riddleError.classList.add('hidden'), 2000);
        }
    }


    // --- STAGE 2: MEMORY GAME ---
    function initMemoryGame() {
        const grid = document.getElementById('memory-grid');
        const icons = ['❤️', '🎂', '🌟', '🦄', '🎁', '🌹', '🍭', '🎵'];
        // Pick 4 pairs for an 8-card grid
        const selectedIcons = icons.slice(0, 4);
        const cards = [...selectedIcons, ...selectedIcons]; // Duplicates

        // Shuffle
        cards.sort(() => 0.5 - Math.random());

        let hasFlippedCard = false;
        let lockBoard = false;
        let firstCard, secondCard;
        let matchedPairs = 0;
        const totalPairs = 4;

        grid.innerHTML = '';
        cards.forEach(icon => {
            const cardEl = document.createElement('div');
            cardEl.classList.add('memory-card');
            cardEl.innerHTML = `
                <div class="memory-card-inner">
                    <div class="memory-card-front">?</div>
                    <div class="memory-card-back">${icon}</div>
                </div>
            `;
            cardEl.addEventListener('click', flipCard);
            grid.appendChild(cardEl);
        });

        function flipCard() {
            if (lockBoard) return;
            if (this === firstCard) return;

            this.classList.add('flipped');

            if (!hasFlippedCard) {
                hasFlippedCard = true;
                firstCard = this;
                return;
            }

            secondCard = this;
            checkForMatch();
        }

        function checkForMatch() {
            // Check inner content
            let isMatch = firstCard.querySelector('.memory-card-back').innerText ===
                secondCard.querySelector('.memory-card-back').innerText;

            isMatch ? disableCards() : unflipCards();
        }

        function disableCards() {
            firstCard.removeEventListener('click', flipCard);
            secondCard.removeEventListener('click', flipCard);
            resetBoard();

            matchedPairs++;
            if (matchedPairs === totalPairs) {
                setTimeout(() => {
                    nextStage();
                }, 1000);
            }
        }

        function unflipCards() {
            lockBoard = true;
            setTimeout(() => {
                firstCard.classList.remove('flipped');
                secondCard.classList.remove('flipped');
                resetBoard();
            }, 1000);
        }

        function resetBoard() {
            [hasFlippedCard, lockBoard] = [false, false];
            [firstCard, secondCard] = [null, null];
        }
    }


    // --- STAGE 3: PATTERN GAME (SIMON SAYS) ---
    function initPatternGame() {
        const pads = document.querySelectorAll('.pad');
        const statusMsg = document.getElementById('pattern-status');
        let sequence = [];
        let playerSequence = [];
        let round = 0;
        const MAX_ROUNDS = 3;

        function startGame() {
            sequence = [];
            playerSequence = [];
            round = 0;
            nextRound();
        }

        function nextRound() {
            round++;
            statusMsg.innerText = `Watch level ${round}`;
            playerSequence = [];
            const nextColor = Math.floor(Math.random() * 4);
            sequence.push(nextColor);

            disableInput();
            playSequence(sequence);
        }

        function playSequence(seq) {
            let i = 0;
            const interval = setInterval(() => {
                const padId = seq[i];
                activatePad(padId);
                i++;
                if (i >= seq.length) {
                    clearInterval(interval);
                    enableInput();
                }
            }, 800);
        }

        function activatePad(id) {
            const pad = document.querySelector(`.pad[data-id="${id}"]`);
            pad.classList.add('active');
            setTimeout(() => pad.classList.remove('active'), 400);
        }

        function handlePadClick(e) {
            const id = parseInt(e.target.dataset.id);
            activatePad(id);
            playerSequence.push(id);

            // Check correctness immediately
            const verificationIndex = playerSequence.length - 1;
            if (playerSequence[verificationIndex] !== sequence[verificationIndex]) {
                statusMsg.innerText = "Wrong! Try again.";
                setTimeout(startGame, 1000); // Restart game
                return;
            }

            // Check if round complete
            if (playerSequence.length === sequence.length) {
                if (round === MAX_ROUNDS) {
                    statusMsg.innerText = "Correct!";
                    disableInput();
                    setTimeout(nextStage, 1000);
                } else {
                    statusMsg.innerText = "Good...";
                    setTimeout(nextRound, 1000);
                }
            }
        }

        function enableInput() {
            statusMsg.innerText = "Your turn";
            pads.forEach(pad => pad.addEventListener('click', handlePadClick));
        }

        function disableInput() {
            pads.forEach(pad => pad.removeEventListener('click', handlePadClick));
        }

        // Start delay
        setTimeout(startGame, 1000);
    }


    // --- STAGE 4: REVEAL ---
    function initGiftReveal() {
        const giftBox = document.getElementById('gift-box');
        const giftContainer = document.getElementById('gift-container');
        const celebrationContainer = document.getElementById('celebration-container');
        const restartBtn = document.getElementById('restart-btn');

        giftBox.addEventListener('click', () => {
            giftContainer.style.opacity = '0';
            setTimeout(() => {
                giftContainer.classList.add('hidden');
                celebrationContainer.classList.remove('hidden');
                void celebrationContainer.offsetWidth;
                celebrationContainer.classList.add('visible');
                launchConfetti();
            }, 800);
        });

        restartBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }


    // --- CONFETTI UTIL ---
    function launchConfetti() {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        function randomInRange(min, max) { return Math.random() * (max - min) + min; }
        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }

});
