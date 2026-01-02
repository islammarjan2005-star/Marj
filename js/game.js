// Geometry Dash Clone - Game Engine

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Canvas sizing
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Game state
        this.state = 'menu'; // menu, playing, paused, dead, complete
        this.isPracticeMode = false;

        // Level info
        this.currentLevel = null;
        this.levelId = 1;

        // Game dimensions
        this.groundY = this.canvas.height - 100;
        this.ceilingY = 0;

        // Camera
        this.cameraX = 0;
        this.gameSpeed = 8;
        this.originalSpeed = 8;

        // Player
        this.player = new Player(this);

        // Obstacles
        this.obstacles = [];

        // Practice mode
        this.checkpoints = [];
        this.lastCheckpoint = null;

        // Statistics
        this.attempts = 0;
        this.jumpCount = 0;
        this.startTime = 0;
        this.elapsedTime = 0;

        // Settings
        this.showProgressBar = true;
        this.autoRetry = false;

        // Background
        this.bgParticles = [];
        this.generateBackgroundParticles();

        // Ground pattern
        this.groundPattern = null;

        // Input
        this.setupInput();

        // Animation frame
        this.lastTime = 0;
        this.deltaTime = 0;

        // Death delay
        this.deathDelay = 0;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.groundY = this.canvas.height - 100;
    }

    setupInput() {
        // Mouse/Touch input
        const handlePress = () => {
            if (this.state === 'playing') {
                this.player.isHolding = true;
            }
        };

        const handleRelease = () => {
            this.player.isHolding = false;
        };

        window.addEventListener('mousedown', handlePress);
        window.addEventListener('mouseup', handleRelease);
        window.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handlePress();
        });
        window.addEventListener('touchend', handleRelease);

        // Keyboard input
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                if (this.state === 'playing') {
                    this.player.isHolding = true;
                }
            }

            if (e.code === 'Escape') {
                if (this.state === 'playing') {
                    this.pause();
                } else if (this.state === 'paused') {
                    this.resume();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                this.player.isHolding = false;
            }
        });
    }

    generateBackgroundParticles() {
        this.bgParticles = [];
        for (let i = 0; i < 50; i++) {
            this.bgParticles.push({
                x: Math.random() * 5000,
                y: Math.random() * this.canvas.height,
                size: 2 + Math.random() * 4,
                speed: 0.5 + Math.random() * 1,
                alpha: 0.1 + Math.random() * 0.3
            });
        }
    }

    startLevel(levelId, practiceMode = false) {
        this.levelId = levelId;
        this.currentLevel = getLevel(levelId);
        this.isPracticeMode = practiceMode;

        // Initialize level obstacles if needed
        if (this.currentLevel.obstacles.length === 0) {
            initializeLevels(this.groundY, this.canvas.height);
            this.currentLevel = getLevel(levelId);
        }

        // Reset game state
        this.cameraX = 0;
        this.obstacles = [...this.currentLevel.obstacles];
        this.checkpoints = [];
        this.lastCheckpoint = null;
        this.attempts = 0;
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.deathDelay = 0;

        // Reset all obstacles
        this.obstacles.forEach(obs => {
            if (obs.reset) obs.reset();
        });

        // Reset player
        this.player.reset();
        this.player.jumpCount = 0;

        // Start game
        this.state = 'playing';
        this.attempts++;

        // Update UI
        document.getElementById('attempt-count').textContent = this.attempts;

        // Start music
        audioManager.playMusic();

        // Show practice UI if needed
        document.getElementById('practice-ui').style.display = practiceMode ? 'flex' : 'none';
    }

    restart() {
        // Reset obstacles
        this.obstacles.forEach(obs => {
            if (obs.reset) obs.reset();
        });

        // Check for checkpoint in practice mode
        if (this.isPracticeMode && this.lastCheckpoint) {
            this.cameraX = this.lastCheckpoint.cameraX;
            this.player.reset(this.lastCheckpoint.playerX);
            this.player.y = this.lastCheckpoint.playerY;
            this.player.mode = this.lastCheckpoint.mode;
            this.player.gravityFlipped = this.lastCheckpoint.gravityFlipped;
            this.player.isMini = this.lastCheckpoint.isMini;

            // Reset obstacles state based on checkpoint
            this.obstacles.forEach((obs, index) => {
                if (this.lastCheckpoint.obstacleStates[index]) {
                    obs.triggered = this.lastCheckpoint.obstacleStates[index].triggered;
                    if (obs.collected !== undefined) {
                        obs.collected = this.lastCheckpoint.obstacleStates[index].collected;
                    }
                }
            });
        } else {
            this.cameraX = 0;
            this.player.reset();
        }

        this.attempts++;
        this.state = 'playing';
        this.deathDelay = 0;

        document.getElementById('attempt-count').textContent = this.attempts;

        // Resume music
        audioManager.resumeMusic();
    }

    addCheckpoint() {
        if (!this.isPracticeMode || this.state !== 'playing') return;

        this.lastCheckpoint = {
            cameraX: this.cameraX,
            playerX: this.player.x,
            playerY: this.player.y,
            mode: this.player.mode,
            gravityFlipped: this.player.gravityFlipped,
            isMini: this.player.isMini,
            obstacleStates: this.obstacles.map(obs => ({
                triggered: obs.triggered || false,
                collected: obs.collected || false
            }))
        };

        this.checkpoints.push({ ...this.lastCheckpoint });
        audioManager.playSound('checkpoint');
    }

    removeCheckpoint() {
        if (!this.isPracticeMode) return;

        this.checkpoints.pop();
        this.lastCheckpoint = this.checkpoints[this.checkpoints.length - 1] || null;
        audioManager.playSound('click');
    }

    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            audioManager.pauseMusic();
            document.getElementById('pause-menu').classList.add('active');
        }
    }

    resume() {
        if (this.state === 'paused') {
            this.state = 'playing';
            audioManager.resumeMusic();
            document.getElementById('pause-menu').classList.remove('active');
        }
    }

    quit() {
        this.state = 'menu';
        audioManager.stopMusic();
        document.getElementById('pause-menu').classList.remove('active');
        document.getElementById('death-screen').classList.remove('active');
        document.getElementById('complete-screen').classList.remove('active');

        // Save progress
        const progress = this.getProgress();
        LevelProgress.updateProgress(this.levelId, progress);
    }

    die() {
        if (this.player.isDead) return;

        this.player.die();
        this.state = 'dead';
        this.deathDelay = 60; // Frames to wait before showing death screen

        // Save progress
        const progress = this.getProgress();
        LevelProgress.updateProgress(this.levelId, progress);
    }

    complete() {
        this.state = 'complete';
        this.elapsedTime = Date.now() - this.startTime;

        // Update stats
        document.getElementById('complete-attempts').textContent = this.attempts;
        document.getElementById('complete-jumps').textContent = this.player.jumpCount;

        const seconds = Math.floor(this.elapsedTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        document.getElementById('complete-time').textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

        // Save completion
        LevelProgress.updateProgress(this.levelId, 100, true);

        // Play complete sound
        audioManager.playSound('complete');
        audioManager.stopMusic();

        // Show complete screen
        document.getElementById('complete-screen').classList.add('active');
    }

    getProgress() {
        if (!this.currentLevel) return 0;
        return Math.floor((this.cameraX / this.currentLevel.length) * 100);
    }

    update() {
        if (this.state !== 'playing' && this.state !== 'dead') return;

        // Handle death delay
        if (this.state === 'dead') {
            this.deathDelay--;
            this.player.updateDeathParticles();

            if (this.deathDelay <= 0) {
                document.getElementById('death-progress-text').textContent = this.getProgress() + '%';
                document.getElementById('death-screen').classList.add('active');

                if (this.autoRetry) {
                    setTimeout(() => {
                        document.getElementById('death-screen').classList.remove('active');
                        this.restart();
                    }, 500);
                }
            }
            return;
        }

        // Move camera (this is what makes the game scroll)
        this.cameraX += this.gameSpeed;

        // Keep player at fixed screen position
        this.player.x = this.cameraX + 100;

        // Update player
        this.player.update(this.deltaTime);

        // Update obstacles
        this.obstacles.forEach(obs => {
            if (obs.update) {
                obs.update(this.player);
            }
        });

        // Check collisions
        this.checkCollisions();

        // Update background particles
        this.updateBackgroundParticles();

        // Update progress bar
        if (this.showProgressBar) {
            const progress = this.getProgress();
            document.getElementById('game-progress-fill').style.width = progress + '%';
            document.getElementById('game-progress-text').textContent = progress + '%';
        }

        // Check level completion
        if (this.cameraX >= this.currentLevel.length) {
            this.complete();
        }
    }

    checkCollisions() {
        for (const obs of this.obstacles) {
            if (!obs.isOnScreen(this.cameraX, this.canvas.width)) continue;

            switch (obs.type) {
                case 'spike':
                case 'saw':
                    if (obs.checkCollision(this.player)) {
                        this.die();
                        return;
                    }
                    break;

                case 'block':
                    if (obs.checkCollision(this.player)) {
                        const collision = obs.handleCollision(this.player);
                        if (collision === 'side') {
                            this.die();
                            return;
                        }
                    }
                    break;

                case 'orb':
                    if (obs.checkCollision(this.player) && this.player.isHolding && !obs.triggered) {
                        obs.activate(this.player);
                    }
                    break;

                case 'pad':
                    if (obs.checkCollision(this.player) && !obs.triggered) {
                        obs.activate(this.player);
                    }
                    break;

                case 'portal':
                    if (obs.checkCollision(this.player) && !obs.triggered) {
                        obs.activate(this.player);
                    }
                    break;

                case 'coin':
                    if (obs.checkCollision(this.player) && !obs.collected) {
                        obs.collect();
                    }
                    break;

                case 'end':
                    if (obs.checkCollision(this.player)) {
                        this.complete();
                        return;
                    }
                    break;
            }
        }

        // Check if player fell out of bounds
        const playerHeight = this.player.height * (this.player.isMini ? this.player.miniScale : 1);
        if (this.player.y > this.canvas.height || this.player.y < -playerHeight) {
            this.die();
        }
    }

    updateBackgroundParticles() {
        this.bgParticles.forEach(particle => {
            particle.x -= particle.speed;
            if (particle.x < this.cameraX - 100) {
                particle.x = this.cameraX + this.canvas.width + Math.random() * 200;
                particle.y = Math.random() * this.canvas.height;
            }
        });
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.currentLevel) return;

        // Draw background
        this.drawBackground();

        // Draw background particles
        this.drawBackgroundParticles();

        // Draw obstacles
        this.obstacles.forEach(obs => {
            if (obs.isOnScreen(this.cameraX, this.canvas.width)) {
                obs.draw(this.ctx, this.cameraX);
            }
        });

        // Draw ground
        this.drawGround();

        // Draw player
        this.player.draw(this.ctx);

        // Draw ceiling if gravity flipped
        if (this.player.gravityFlipped || this.player.mode === 'ship' || this.player.mode === 'ufo' || this.player.mode === 'wave') {
            this.drawCeiling();
        }
    }

    drawBackground() {
        const level = this.currentLevel;

        // Background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, level.color.bg1);
        gradient.addColorStop(1, level.color.bg2);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Animated background lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 2;

        for (let i = 0; i < 10; i++) {
            const y = (i * 80 + (this.cameraX * 0.1) % 80);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawBackgroundParticles() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.bgParticles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.beginPath();
            this.ctx.arc(
                particle.x - this.cameraX,
                particle.y,
                particle.size,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    drawGround() {
        const level = this.currentLevel;

        // Ground blocks
        const blockSize = 40;
        const groundRows = 3;
        const startX = Math.floor(this.cameraX / blockSize) * blockSize;

        for (let row = 0; row < groundRows; row++) {
            for (let col = -1; col <= Math.ceil(this.canvas.width / blockSize) + 1; col++) {
                const x = startX + col * blockSize - this.cameraX;
                const y = this.groundY + row * blockSize;

                // Checkerboard pattern
                const isLight = (Math.floor((startX + col * blockSize) / blockSize) + row) % 2 === 0;

                this.ctx.fillStyle = isLight ? level.color.ground : this.shadeColor(level.color.ground, -20);
                this.ctx.fillRect(x, y, blockSize, blockSize);

                // Grid lines
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, blockSize, blockSize);
            }
        }

        // Ground top line
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.stroke();
    }

    drawCeiling() {
        const level = this.currentLevel;
        const blockSize = 40;

        // Ceiling line
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, blockSize);
        this.ctx.lineTo(this.canvas.width, blockSize);
        this.ctx.stroke();

        // Ceiling blocks
        const startX = Math.floor(this.cameraX / blockSize) * blockSize;

        for (let col = -1; col <= Math.ceil(this.canvas.width / blockSize) + 1; col++) {
            const x = startX + col * blockSize - this.cameraX;
            const isLight = Math.floor((startX + col * blockSize) / blockSize) % 2 === 0;

            this.ctx.fillStyle = isLight ? level.color.ground : this.shadeColor(level.color.ground, -20);
            this.ctx.fillRect(x, 0, blockSize, blockSize);

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, 0, blockSize, blockSize);
        }
    }

    shadeColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    gameLoop(timestamp) {
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update();
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    start() {
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}
