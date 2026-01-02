// Geometry Dash Clone - UI System

class UI {
    constructor(game) {
        this.game = game;
        this.currentScreen = 'loading';
        this.currentLevelIndex = 0;

        // Icon customization
        this.selectedIconType = 'cube';
        this.primaryColorIndex = 0;
        this.secondaryColorIndex = 10;

        // Color palette (GD colors)
        this.colors = [
            '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff',
            '#8000ff', '#ff00ff', '#ff0080', '#ff0000', '#ff8000',
            '#ffff00', '#80ff00', '#ffffff', '#808080', '#404040',
            '#000000', '#ff4444', '#44ff44', '#4444ff', '#ffff44',
            '#ff44ff', '#44ffff', '#ff8844', '#88ff44', '#4488ff',
            '#ff4488', '#88ff88', '#8888ff', '#ffaa44', '#44ffaa'
        ];

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Main menu buttons
        document.getElementById('play-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            this.showScreen('level-select');
        });

        document.getElementById('icon-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            this.showScreen('icon-kit');
            this.initIconKit();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            this.showScreen('settings');
        });

        // Back buttons
        document.getElementById('level-back-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            this.showScreen('main-menu');
        });

        document.getElementById('icon-back-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            this.showScreen('main-menu');
        });

        document.getElementById('settings-back-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            this.showScreen('main-menu');
        });

        // Level select
        document.getElementById('level-prev').addEventListener('click', () => {
            audioManager.playSound('click');
            this.changeLevel(-1);
        });

        document.getElementById('level-next').addEventListener('click', () => {
            audioManager.playSound('click');
            this.changeLevel(1);
        });

        document.getElementById('normal-mode-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            this.startGame(false);
        });

        document.getElementById('practice-mode-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            this.startGame(true);
        });

        // Pause menu
        document.getElementById('pause-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            this.game.pause();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            this.game.resume();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            document.getElementById('pause-menu').classList.remove('active');
            this.game.restart();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            this.game.quit();
            this.showScreen('level-select');
        });

        // Death screen
        document.getElementById('death-restart-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            document.getElementById('death-screen').classList.remove('active');
            this.game.restart();
        });

        document.getElementById('death-quit-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            this.game.quit();
            this.showScreen('level-select');
        });

        // Complete screen
        document.getElementById('complete-restart-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            document.getElementById('complete-screen').classList.remove('active');
            this.game.restart();
        });

        document.getElementById('complete-menu-btn').addEventListener('click', () => {
            audioManager.playSound('click');
            this.game.quit();
            this.showScreen('level-select');
        });

        // Practice mode buttons
        document.getElementById('checkpoint-btn').addEventListener('click', () => {
            this.game.addCheckpoint();
        });

        document.getElementById('remove-checkpoint-btn').addEventListener('click', () => {
            this.game.removeCheckpoint();
        });

        // Settings
        document.getElementById('music-volume').addEventListener('input', (e) => {
            audioManager.setMusicVolume(e.target.value / 100);
        });

        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            audioManager.setSFXVolume(e.target.value / 100);
        });

        this.setupToggleButton('progress-toggle', (active) => {
            this.game.showProgressBar = active;
            document.getElementById('game-progress-container').style.display = active ? 'flex' : 'none';
        });

        this.setupToggleButton('auto-retry-toggle', (active) => {
            this.game.autoRetry = active;
        });

        this.setupToggleButton('flip-controls-toggle', (active) => {
            // Flip controls implementation
        });

        // Icon tabs
        document.querySelectorAll('.icon-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.icon-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.selectedIconType = tab.dataset.type;
                this.updateIconPreview();
            });
        });

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyR' && this.game.state === 'dead') {
                document.getElementById('death-screen').classList.remove('active');
                this.game.restart();
            }
        });
    }

    setupToggleButton(id, callback) {
        const btn = document.getElementById(id);
        btn.addEventListener('click', () => {
            audioManager.playSound('click');
            btn.classList.toggle('active');
            const isActive = btn.classList.contains('active');
            btn.querySelector('.toggle-text').textContent = isActive ? 'ON' : 'OFF';
            callback(isActive);
        });
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }

        // Update level info if showing level select
        if (screenId === 'level-select') {
            this.updateLevelDisplay();
        }
    }

    changeLevel(direction) {
        this.currentLevelIndex += direction;
        if (this.currentLevelIndex < 0) {
            this.currentLevelIndex = LEVELS.length - 1;
        } else if (this.currentLevelIndex >= LEVELS.length) {
            this.currentLevelIndex = 0;
        }
        this.updateLevelDisplay();
    }

    updateLevelDisplay() {
        const level = LEVELS[this.currentLevelIndex];
        const progress = LevelProgress.getProgress(level.id);

        document.getElementById('level-name').textContent = level.name;

        // Update difficulty display
        const difficultyFace = document.querySelector('.difficulty-face');
        difficultyFace.className = 'difficulty-face ' + level.difficulty;
        document.querySelector('.difficulty-text').textContent =
            level.difficulty.charAt(0).toUpperCase() + level.difficulty.slice(1);

        // Update progress
        document.getElementById('level-progress').style.width = progress.progress + '%';
        document.getElementById('progress-text').textContent = progress.progress + '%';

        // Update level image background
        const levelImage = document.getElementById('level-image');
        levelImage.style.background = `linear-gradient(180deg, ${level.color.bg1} 0%, ${level.color.bg2} 100%)`;

        // Update total stars
        document.getElementById('star-count').textContent = LevelProgress.getTotalStars();
    }

    startGame(practiceMode) {
        this.showScreen('game-screen');
        const level = LEVELS[this.currentLevelIndex];
        this.game.startLevel(level.id, practiceMode);
    }

    initIconKit() {
        // Initialize color grids
        this.createColorGrid('primary-colors', this.primaryColorIndex, (index) => {
            this.primaryColorIndex = index;
            this.game.player.primaryColor = this.colors[index];
            this.updateIconPreview();
            audioManager.playSound('click');
        });

        this.createColorGrid('secondary-colors', this.secondaryColorIndex, (index) => {
            this.secondaryColorIndex = index;
            this.game.player.secondaryColor = this.colors[index];
            this.updateIconPreview();
            audioManager.playSound('click');
        });

        this.updateIconPreview();
    }

    createColorGrid(containerId, selectedIndex, onClick) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        this.colors.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch' + (index === selectedIndex ? ' selected' : '');
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', () => {
                container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                onClick(index);
            });
            container.appendChild(swatch);
        });
    }

    updateIconPreview() {
        const canvas = document.getElementById('icon-preview-canvas');
        const ctx = canvas.getContext('2d');
        const size = 80;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);

        const primaryColor = this.colors[this.primaryColorIndex];
        const secondaryColor = this.colors[this.secondaryColorIndex];

        switch (this.selectedIconType) {
            case 'cube':
                this.drawCubeIcon(ctx, size, primaryColor, secondaryColor);
                break;
            case 'ship':
                this.drawShipIcon(ctx, size, primaryColor, secondaryColor);
                break;
            case 'ball':
                this.drawBallIcon(ctx, size, primaryColor, secondaryColor);
                break;
            case 'ufo':
                this.drawUFOIcon(ctx, size, primaryColor, secondaryColor);
                break;
            case 'wave':
                this.drawWaveIcon(ctx, size, primaryColor, secondaryColor);
                break;
        }

        ctx.restore();
    }

    drawCubeIcon(ctx, size, primary, secondary) {
        ctx.fillStyle = primary;
        ctx.fillRect(-size/2, -size/2, size, size);

        ctx.fillStyle = secondary;
        ctx.fillRect(-size/3, -size/3, size/1.5, size/1.5);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(-size/2, -size/2, size, size);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(size/6, -size/8, size/6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(size/6 + 2, -size/8, size/10, 0, Math.PI * 2);
        ctx.fill();
    }

    drawShipIcon(ctx, size, primary, secondary) {
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.moveTo(size/2, 0);
        ctx.lineTo(-size/2, -size/2);
        ctx.lineTo(-size/4, 0);
        ctx.lineTo(-size/2, size/2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.moveTo(size/4, 0);
        ctx.lineTo(-size/4, -size/3);
        ctx.lineTo(-size/6, 0);
        ctx.lineTo(-size/4, size/3);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(size/2, 0);
        ctx.lineTo(-size/2, -size/2);
        ctx.lineTo(-size/4, 0);
        ctx.lineTo(-size/2, size/2);
        ctx.closePath();
        ctx.stroke();
    }

    drawBallIcon(ctx, size, primary, secondary) {
        const radius = size / 2;

        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(radius * 0.3, -radius * 0.2, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    drawUFOIcon(ctx, size, primary, secondary) {
        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.ellipse(0, -size/6, size/3, size/3, 0, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.ellipse(0, 0, size/2, size/5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, -size/6, size/3, size/3, 0, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, size/2, size/5, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawWaveIcon(ctx, size, primary, secondary) {
        ctx.fillStyle = primary;
        ctx.beginPath();
        ctx.moveTo(size/2, 0);
        ctx.lineTo(0, -size/2);
        ctx.lineTo(-size/2, 0);
        ctx.lineTo(0, size/2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = secondary;
        ctx.beginPath();
        ctx.moveTo(size/4, 0);
        ctx.lineTo(0, -size/4);
        ctx.lineTo(-size/4, 0);
        ctx.lineTo(0, size/4);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(size/2, 0);
        ctx.lineTo(0, -size/2);
        ctx.lineTo(-size/2, 0);
        ctx.lineTo(0, size/2);
        ctx.closePath();
        ctx.stroke();
    }

    drawMenuPlayerIcon() {
        const canvas = document.getElementById('menu-player-icon');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);

        const primaryColor = this.colors[this.primaryColorIndex];
        const secondaryColor = this.colors[this.secondaryColorIndex];

        this.drawCubeIcon(ctx, 40, primaryColor, secondaryColor);

        ctx.restore();
    }

    showLoading() {
        const loadingBar = document.querySelector('.loading-bar');
        let progress = 0;

        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);

                setTimeout(() => {
                    this.showScreen('main-menu');
                    this.drawMenuPlayerIcon();
                }, 500);
            }
            loadingBar.style.width = progress + '%';
        }, 100);
    }
}
