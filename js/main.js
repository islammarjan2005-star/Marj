// Geometry Dash Clone - Main Entry Point

// Global game instance
let game;
let ui;

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Get canvas
    const canvas = document.getElementById('game-canvas');

    // Initialize audio
    await audioManager.init();

    // Load saved progress
    LevelProgress.load();

    // Create game instance
    game = new Game(canvas);

    // Create UI instance
    ui = new UI(game);

    // Initialize levels with proper ground position
    initializeLevels(game.groundY, canvas.height);

    // Apply saved player colors
    game.player.primaryColor = ui.colors[ui.primaryColorIndex];
    game.player.secondaryColor = ui.colors[ui.secondaryColorIndex];

    // Start game loop
    game.start();

    // Show loading screen and then main menu
    ui.showLoading();

    // Handle visibility change (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game.state === 'playing') {
            game.pause();
        }
    });

    // Prevent context menu on right-click
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Handle window focus
    window.addEventListener('blur', () => {
        if (game.state === 'playing') {
            game.pause();
        }
    });
});

// Utility functions for debugging
const Debug = {
    showHitboxes: false,
    invincible: false,
    speedMultiplier: 1,

    toggleHitboxes() {
        this.showHitboxes = !this.showHitboxes;
        console.log('Hitboxes:', this.showHitboxes ? 'ON' : 'OFF');
    },

    toggleInvincibility() {
        this.invincible = !this.invincible;
        console.log('Invincibility:', this.invincible ? 'ON' : 'OFF');
    },

    setSpeed(multiplier) {
        this.speedMultiplier = multiplier;
        game.gameSpeed = game.originalSpeed * multiplier;
        console.log('Speed:', multiplier + 'x');
    },

    skipToProgress(percent) {
        if (game.currentLevel) {
            game.cameraX = game.currentLevel.length * (percent / 100);
            console.log('Skipped to', percent + '%');
        }
    },

    giveAllStars() {
        LEVELS.forEach(level => {
            LevelProgress.updateProgress(level.id, 100, true);
        });
        ui.updateLevelDisplay();
        console.log('All levels completed!');
    }
};

// Keyboard shortcuts for debugging (hold Shift)
document.addEventListener('keydown', (e) => {
    if (e.shiftKey) {
        switch (e.code) {
            case 'KeyH':
                Debug.toggleHitboxes();
                break;
            case 'KeyI':
                Debug.toggleInvincibility();
                break;
            case 'Digit1':
                Debug.setSpeed(0.5);
                break;
            case 'Digit2':
                Debug.setSpeed(1);
                break;
            case 'Digit3':
                Debug.setSpeed(2);
                break;
            case 'KeyS':
                Debug.skipToProgress(50);
                break;
            case 'KeyC':
                Debug.giveAllStars();
                break;
        }
    }
});

// Service Worker for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}

// Performance monitoring
const Performance = {
    fps: 0,
    frameCount: 0,
    lastTime: performance.now(),

    update() {
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
        }
    },

    getFPS() {
        return this.fps;
    }
};

// Export for console access
window.game = null;
window.Debug = Debug;

// Set game reference after initialization
setTimeout(() => {
    window.game = game;
}, 1000);
