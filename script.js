
document.addEventListener('DOMContentLoaded', () => {
    const giftBox = document.getElementById('gift-box');
    const giftContainer = document.getElementById('gift-container');
    const celebrationContainer = document.getElementById('celebration-container');

    giftBox.addEventListener('click', () => {
        openGift();
    });

    function openGift() {
        // 1. Animate box out
        giftContainer.style.opacity = '0';
        
        setTimeout(() => {
            giftContainer.classList.add('hidden');
            
            // 2. Show celebration
            celebrationContainer.classList.remove('hidden');
            // Force reflow
            void celebrationContainer.offsetWidth; 
            celebrationContainer.classList.add('visible');

            // 3. Launch Confetti
            launchConfetti();

        }, 800);
    }

    function launchConfetti() {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
            return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            
            // since particles fall down, start a bit higher than random
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
        
        // Big decorative burst at the start
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
});
