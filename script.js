
document.addEventListener('DOMContentLoaded', () => {

    // --- AUDIO SYSTEM (Web Audio API) ---
    const AudioEngine = {
        ctx: null,
        init() {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        },
        playTone(freq, type, duration) {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.index = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        },
        playSuccess() {
            this.playTone(440, 'sine', 0.1); // A
            setTimeout(() => this.playTone(554, 'sine', 0.1), 100); // C#
            setTimeout(() => this.playTone(659, 'sine', 0.2), 200); // E
        },
        playError() {
            this.playTone(150, 'sawtooth', 0.3);
        },
        playClick() {
            this.playTone(800, 'triangle', 0.05);
        },
        playMagical() {
            // Sparkly arpeggio
            [523, 659, 783, 1046, 1318, 1568].forEach((f, i) => {
                setTimeout(() => this.playTone(f, 'sine', 0.3), i * 50);
            });
        }
    };


    // --- VISUAL FX SYSTEM (Canvas Particles) ---
    const ParticleSystem = {
        canvas: document.getElementById('bg-canvas'),
        ctx: null,
        particles: [],
        init() {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.animate();

            // Mouse trail
            document.addEventListener('mousemove', (e) => {
                // Add particles on move
                if (Math.random() > 0.5)
                    this.addParticle(e.clientX, e.clientY);
            });
        },
        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        },
        addParticle(x, y) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1,
                color: `hsl(${Math.random() * 60 + 300}, 100%, 70%)`,
                size: Math.random() * 4 + 1
            });
        },
        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                p.size *= 0.95;

                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = p.life;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();

                if (p.life <= 0) this.particles.splice(i, 1);
            }
            requestAnimationFrame(() => this.animate());
        }
    };


    // --- GAME LOGIC ---
    let currentStage = 1;

    // START BUTTON
    document.getElementById('start-btn').addEventListener('click', () => {
        AudioEngine.init();
        AudioEngine.playMagical();
        ParticleSystem.init();

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('main-container').classList.remove('hidden');
        updateProgress();
    });

    function updateProgress() {
        const percent = ((currentStage - 1) / 4) * 100;
        document.getElementById('progress-bar').style.width = `${percent}%`;
    }

    function nextStage() {
        AudioEngine.playSuccess();
        document.getElementById(`stage-${currentStage}`).classList.remove('active');
        document.getElementById(`stage-${currentStage}`).classList.add('hidden');

        currentStage++;
        updateProgress();

        const nextEl = document.getElementById(`stage-${currentStage}`);
        if (nextEl) {
            nextEl.classList.remove('hidden');
            setTimeout(() => nextEl.classList.add('active'), 50); // Slight delay for animation

            if (currentStage === 2) initMemoryGame();
            if (currentStage === 3) initPatternGame();
            if (currentStage === 4) initGiftReveal();
        }
    }


    // --- STAGE 1: RIDDLE ---
    const riddleInput = document.getElementById('riddle-input');
    const riddleSubmit = document.getElementById('riddle-submit');
    const riddleError = document.getElementById('riddle-error');
    const CORRECT_ANSWER = "keyboard";

    riddleSubmit.addEventListener('click', checkRiddle);
    riddleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            checkRiddle();
        }
    });

    function checkRiddle() {
        const val = riddleInput.value.toLowerCase().trim();
        if (val === CORRECT_ANSWER || val.includes("key")) {
            nextStage();
        } else {
            AudioEngine.playError();
            riddleError.classList.remove('hidden');
            setTimeout(() => riddleError.classList.add('hidden'), 2000);
        }
    }


    // --- STAGE 2: MEMORY GAME ---
    function initMemoryGame() {
        const grid = document.getElementById('memory-grid');
        const icons = ['❤️', '🎂', '🌟', '🦄', '🎁', '🌹', '🍭', '🎵'];
        const selectedIcons = icons.slice(0, 4);
        const cards = [...selectedIcons, ...selectedIcons].sort(() => 0.5 - Math.random());

        let hasFlippedCard = false, lockBoard = false;
        let firstCard, secondCard, matchedPairs = 0;

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
            if (lockBoard || this === firstCard) return;
            AudioEngine.playClick();
            this.classList.add('flipped');
            if (!hasFlippedCard) {
                hasFlippedCard = true; firstCard = this; return;
            }
            secondCard = this;
            checkForMatch();
        }

        function checkForMatch() {
            let isMatch = firstCard.querySelector('.memory-card-back').innerText ===
                secondCard.querySelector('.memory-card-back').innerText;
            isMatch ? disableCards() : unflipCards();
        }

        function disableCards() {
            firstCard.removeEventListener('click', flipCard);
            secondCard.removeEventListener('click', flipCard);
            AudioEngine.playTone(600, 'sine', 0.1); // Small success
            resetBoard();
            matchedPairs++;
            if (matchedPairs === 4) setTimeout(nextStage, 1000);
        }

        function unflipCards() {
            lockBoard = true;
            AudioEngine.playError();
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


    // --- STAGE 3: PATTERN GAME ---
    function initPatternGame() {
        const pads = document.querySelectorAll('.pad');
        const statusMsg = document.getElementById('pattern-status');
        let sequence = [], playerSequence = [], round = 0, MAX_ROUNDS = 3;

        function startGame() {
            sequence = []; playerSequence = []; round = 0;
            nextRound();
        }

        function nextRound() {
            round++;
            statusMsg.innerText = `Level ${round}`;
            playerSequence = [];
            sequence.push(Math.floor(Math.random() * 4));
            disableInput();
            setTimeout(() => playSequence(sequence), 500);
        }

        function playSequence(seq) {
            let i = 0;
            const interval = setInterval(() => {
                activatePad(seq[i]);
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
            // Sound based on ID
            const freqs = [261, 329, 392, 523]; // C E G C
            AudioEngine.playTone(freqs[id], 'sine', 0.3);
            setTimeout(() => pad.classList.remove('active'), 400);
        }

        function handlePadClick(e) {
            const id = parseInt(e.target.dataset.id);
            activatePad(id);
            playerSequence.push(id);

            if (playerSequence[playerSequence.length - 1] !== sequence[playerSequence.length - 1]) {
                statusMsg.innerText = "Try again!";
                AudioEngine.playError();
                setTimeout(startGame, 1000);
                return;
            }

            if (playerSequence.length === sequence.length) {
                if (round === MAX_ROUNDS) {
                    statusMsg.innerText = "Perfect!";
                    disableInput();
                    setTimeout(nextStage, 1000);
                } else {
                    setTimeout(nextRound, 1000);
                }
            }
        }

        function enableInput() {
            pads.forEach(pad => pad.addEventListener('click', handlePadClick));
        }

        function disableInput() {
            pads.forEach(pad => pad.removeEventListener('click', handlePadClick));
        }

        setTimeout(startGame, 1000);
    }


    // --- STAGE 4: REVEAL ---
    function initGiftReveal() {
        const giftBox = document.getElementById('gift-box');
        const giftContainer = document.getElementById('gift-container');
        const celebrationContainer = document.getElementById('celebration-container');
        const restartBtn = document.getElementById('restart-btn');

        giftBox.addEventListener('click', () => {
            AudioEngine.playMagical();
            giftContainer.style.opacity = '0';
            setTimeout(() => {
                giftContainer.classList.add('hidden');
                celebrationContainer.classList.remove('hidden');
                void celebrationContainer.offsetWidth;
                celebrationContainer.classList.add('visible');
                launchConfetti();

                // Final full progress
                document.getElementById('progress-bar').style.width = '100%';
            }, 800);
        });

        restartBtn.addEventListener('click', () => window.location.reload());
    }

    // --- CONFETTI ---
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
