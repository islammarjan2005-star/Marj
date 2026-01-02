// Geometry Dash Clone - Obstacles and Level Objects

// Base obstacle class
class Obstacle {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.active = true;
        this.triggered = false;
    }

    update(player) {
        // Override in subclasses
    }

    draw(ctx, cameraX) {
        // Override in subclasses
    }

    checkCollision(player) {
        const hitbox = player.getHitbox();
        return (
            hitbox.x < this.x + this.width &&
            hitbox.x + hitbox.width > this.x &&
            hitbox.y < this.y + this.height &&
            hitbox.y + hitbox.height > this.y
        );
    }

    isOnScreen(cameraX, canvasWidth) {
        return this.x + this.width > cameraX - 100 && this.x < cameraX + canvasWidth + 100;
    }
}

// Spike obstacle (triangle)
class Spike extends Obstacle {
    constructor(x, y, direction = 'up', size = 40) {
        super(x, y, size, size, 'spike');
        this.direction = direction;
        this.size = size;
    }

    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;

        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        switch (this.direction) {
            case 'up':
                ctx.moveTo(screenX, this.y + this.size);
                ctx.lineTo(screenX + this.size / 2, this.y);
                ctx.lineTo(screenX + this.size, this.y + this.size);
                break;
            case 'down':
                ctx.moveTo(screenX, this.y);
                ctx.lineTo(screenX + this.size / 2, this.y + this.size);
                ctx.lineTo(screenX + this.size, this.y);
                break;
            case 'left':
                ctx.moveTo(screenX + this.size, this.y);
                ctx.lineTo(screenX, this.y + this.size / 2);
                ctx.lineTo(screenX + this.size, this.y + this.size);
                break;
            case 'right':
                ctx.moveTo(screenX, this.y);
                ctx.lineTo(screenX + this.size, this.y + this.size / 2);
                ctx.lineTo(screenX, this.y + this.size);
                break;
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner triangle
        ctx.fillStyle = '#2a2a4e';
        ctx.beginPath();
        const inset = this.size * 0.25;
        switch (this.direction) {
            case 'up':
                ctx.moveTo(screenX + inset, this.y + this.size - inset);
                ctx.lineTo(screenX + this.size / 2, this.y + inset);
                ctx.lineTo(screenX + this.size - inset, this.y + this.size - inset);
                break;
            case 'down':
                ctx.moveTo(screenX + inset, this.y + inset);
                ctx.lineTo(screenX + this.size / 2, this.y + this.size - inset);
                ctx.lineTo(screenX + this.size - inset, this.y + inset);
                break;
        }
        ctx.closePath();
        ctx.fill();
    }

    checkCollision(player) {
        // More precise triangle collision
        const hitbox = player.getHitbox();
        const cx = hitbox.x + hitbox.width / 2;
        const cy = hitbox.y + hitbox.height / 2;

        // Simple AABB with reduced hitbox for fairness
        const margin = this.size * 0.2;
        return (
            cx > this.x + margin &&
            cx < this.x + this.size - margin &&
            cy > this.y + margin &&
            cy < this.y + this.size - margin
        );
    }
}

// Block obstacle (solid platform)
class Block extends Obstacle {
    constructor(x, y, width = 40, height = 40, color = '#4a3a6a') {
        super(x, y, width, height, 'block');
        this.color = color;
        this.isSlope = false;
    }

    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;

        // Block body
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, this.y, this.width, this.height);

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(screenX, this.y, this.width, this.height / 4);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(screenX, this.y + this.height * 0.75, this.width, this.height / 4);

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, this.y, this.width, this.height);
    }

    handleCollision(player) {
        const hitbox = player.getHitbox();
        const playerBottom = hitbox.y + hitbox.height;
        const playerTop = hitbox.y;
        const playerRight = hitbox.x + hitbox.width;
        const playerLeft = hitbox.x;

        // Check if collision from top (landing)
        if (player.velocityY > 0 &&
            playerBottom > this.y &&
            playerBottom < this.y + this.height / 2 &&
            playerRight > this.x + 5 &&
            playerLeft < this.x + this.width - 5) {
            player.y = this.y - player.height * (player.isMini ? player.miniScale : 1);
            player.velocityY = 0;
            player.isOnGround = true;
            return 'top';
        }

        // Side collision (death for cube mode moving into block)
        if (playerRight > this.x &&
            playerLeft < this.x + 10 &&
            playerBottom > this.y + 5 &&
            playerTop < this.y + this.height - 5) {
            return 'side';
        }

        // Bottom collision
        if (player.velocityY < 0 &&
            playerTop < this.y + this.height &&
            playerTop > this.y + this.height / 2) {
            player.velocityY = 0;
            return 'bottom';
        }

        return null;
    }
}

// Platform (thin solid)
class Platform extends Block {
    constructor(x, y, width = 100) {
        super(x, y, width, 10, '#6644aa');
    }
}

// Orbs (jump pads in the air)
class Orb extends Obstacle {
    constructor(x, y, orbType = 'yellow') {
        super(x, y, 35, 35, 'orb');
        this.orbType = orbType;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.colors = {
            yellow: { main: '#ffff00', glow: '#ffff88' },
            purple: { main: '#aa00ff', glow: '#dd88ff' },
            blue: { main: '#00aaff', glow: '#88ddff' },
            green: { main: '#00ff00', glow: '#88ff88' },
            red: { main: '#ff0000', glow: '#ff8888' },
            black: { main: '#000000', glow: '#444444' }
        };
    }

    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        const centerX = screenX + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Pulse effect
        this.pulsePhase += 0.1;
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
        const radius = (this.width / 2) * pulse;

        const color = this.colors[this.orbType] || this.colors.yellow;

        // Glow
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
        gradient.addColorStop(0, color.glow);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Outer ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner fill
        ctx.fillStyle = color.main;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 4, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(centerX - 4, centerY - 4, radius / 3, 0, Math.PI * 2);
        ctx.fill();
    }

    activate(player) {
        if (this.triggered || !player.isHolding) return false;

        this.triggered = true;

        switch (this.orbType) {
            case 'yellow':
                // Normal jump
                player.velocityY = player.gravityFlipped ? 14 : -14;
                break;
            case 'purple':
                // Reverse gravity
                player.gravityFlipped = !player.gravityFlipped;
                player.velocityY = player.gravityFlipped ? 10 : -10;
                break;
            case 'blue':
                // Big jump
                player.velocityY = player.gravityFlipped ? 16 : -16;
                break;
            case 'green':
                // Same as yellow but triggers gravity flip
                player.velocityY = player.gravityFlipped ? 14 : -14;
                player.gravityFlipped = !player.gravityFlipped;
                break;
            case 'red':
                // Small boost
                player.velocityY = player.gravityFlipped ? 10 : -10;
                break;
            case 'black':
                // Negative jump (pushes down/up based on gravity)
                player.velocityY = player.gravityFlipped ? -8 : 8;
                break;
        }

        audioManager.playSound('jump');
        return true;
    }

    reset() {
        this.triggered = false;
    }
}

// Jump pads (on ground)
class JumpPad extends Obstacle {
    constructor(x, y, padType = 'yellow') {
        super(x, y, 40, 15, 'pad');
        this.padType = padType;
        this.animPhase = 0;
        this.colors = {
            yellow: '#ffff00',
            purple: '#aa00ff',
            blue: '#00aaff',
            red: '#ff0000'
        };
    }

    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        const color = this.colors[this.padType] || this.colors.yellow;

        // Base
        ctx.fillStyle = '#333366';
        ctx.fillRect(screenX, this.y, this.width, this.height);

        // Arrows
        this.animPhase += 0.1;
        const arrowOffset = Math.sin(this.animPhase) * 2;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(screenX + this.width / 2, this.y + 2 + arrowOffset);
        ctx.lineTo(screenX + 5, this.y + this.height - 2);
        ctx.lineTo(screenX + this.width - 5, this.y + this.height - 2);
        ctx.closePath();
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, this.y, this.width, this.height);
    }

    activate(player) {
        if (this.triggered) return false;

        this.triggered = true;

        switch (this.padType) {
            case 'yellow':
                player.velocityY = player.gravityFlipped ? 16 : -16;
                break;
            case 'purple':
                player.velocityY = player.gravityFlipped ? 12 : -12;
                player.gravityFlipped = !player.gravityFlipped;
                break;
            case 'blue':
                player.velocityY = player.gravityFlipped ? 20 : -20;
                break;
            case 'red':
                player.velocityY = player.gravityFlipped ? 10 : -10;
                break;
        }

        player.isOnGround = false;
        audioManager.playSound('jump');
        return true;
    }

    reset() {
        this.triggered = false;
    }
}

// Portal (changes game mode or gravity)
class Portal extends Obstacle {
    constructor(x, y, portalType = 'cube', height = 150) {
        super(x, y, 30, height, 'portal');
        this.portalType = portalType;
        this.animPhase = 0;
        this.colors = {
            cube: { from: '#00ff00', to: '#00aa00' },
            ship: { from: '#ff00ff', to: '#aa00aa' },
            ball: { from: '#ff8800', to: '#aa5500' },
            ufo: { from: '#ffff00', to: '#aaaa00' },
            wave: { from: '#00ffff', to: '#00aaaa' },
            robot: { from: '#8888ff', to: '#5555aa' },
            spider: { from: '#ff4444', to: '#aa2222' },
            gravity_up: { from: '#0088ff', to: '#0055aa' },
            gravity_down: { from: '#ffaa00', to: '#aa7700' },
            mini: { from: '#ff88ff', to: '#aa55aa' },
            normal_size: { from: '#88ffff', to: '#55aaaa' },
            dual_on: { from: '#ff8888', to: '#aa5555' },
            dual_off: { from: '#88ff88', to: '#55aa55' }
        };
    }

    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        this.animPhase += 0.05;

        const color = this.colors[this.portalType] || this.colors.cube;

        // Portal glow
        const gradient = ctx.createLinearGradient(screenX - 20, 0, screenX + this.width + 20, 0);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.3, color.from + '44');
        gradient.addColorStop(0.5, color.from + '88');
        gradient.addColorStop(0.7, color.from + '44');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(screenX - 20, this.y, this.width + 40, this.height);

        // Portal frame
        ctx.strokeStyle = color.from;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(screenX, this.y);
        ctx.lineTo(screenX + this.width / 2, this.y - 10);
        ctx.lineTo(screenX + this.width, this.y);
        ctx.lineTo(screenX + this.width, this.y + this.height);
        ctx.lineTo(screenX + this.width / 2, this.y + this.height + 10);
        ctx.lineTo(screenX, this.y + this.height);
        ctx.closePath();
        ctx.stroke();

        // Animated particles
        ctx.fillStyle = color.from;
        for (let i = 0; i < 5; i++) {
            const particleY = this.y + ((this.animPhase * 50 + i * 30) % this.height);
            const particleSize = 3 + Math.sin(this.animPhase + i) * 2;
            ctx.beginPath();
            ctx.arc(screenX + this.width / 2, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mode icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        let icon = '';
        switch (this.portalType) {
            case 'cube': icon = '■'; break;
            case 'ship': icon = '▶'; break;
            case 'ball': icon = '●'; break;
            case 'ufo': icon = '◯'; break;
            case 'wave': icon = '◆'; break;
            case 'robot': icon = '▣'; break;
            case 'spider': icon = '◈'; break;
            case 'gravity_up': icon = '↑'; break;
            case 'gravity_down': icon = '↓'; break;
            case 'mini': icon = 'S'; break;
            case 'normal_size': icon = 'L'; break;
        }
        ctx.fillText(icon, screenX + this.width / 2, this.y + this.height / 2 + 6);
    }

    activate(player) {
        if (this.triggered) return false;

        this.triggered = true;

        switch (this.portalType) {
            case 'cube':
            case 'ship':
            case 'ball':
            case 'ufo':
            case 'wave':
            case 'robot':
            case 'spider':
                player.mode = this.portalType;
                break;
            case 'gravity_up':
                player.gravityFlipped = true;
                break;
            case 'gravity_down':
                player.gravityFlipped = false;
                break;
            case 'mini':
                player.isMini = true;
                break;
            case 'normal_size':
                player.isMini = false;
                break;
            case 'dual_on':
                player.isDual = true;
                break;
            case 'dual_off':
                player.isDual = false;
                break;
        }

        audioManager.playSound('click');
        return true;
    }

    reset() {
        this.triggered = false;
    }
}

// Coin (collectible)
class Coin extends Obstacle {
    constructor(x, y, coinType = 'gold') {
        super(x, y, 25, 25, 'coin');
        this.coinType = coinType;
        this.collected = false;
        this.rotationPhase = Math.random() * Math.PI * 2;
    }

    draw(ctx, cameraX) {
        if (this.collected) return;

        const screenX = this.x - cameraX;
        const centerX = screenX + this.width / 2;
        const centerY = this.y + this.height / 2;

        this.rotationPhase += 0.05;
        const scaleX = Math.cos(this.rotationPhase);

        const color = this.coinType === 'gold' ? '#ffdd00' : '#aaaaaa';
        const innerColor = this.coinType === 'gold' ? '#ffff88' : '#dddddd';

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scaleX, 1);

        // Coin body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
        ctx.fill();

        // Star in center
        ctx.fillStyle = color;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 0);

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    collect() {
        if (!this.collected) {
            this.collected = true;
            audioManager.playSound('coin');
            return true;
        }
        return false;
    }

    reset() {
        this.collected = false;
    }
}

// Saw blade (rotating hazard)
class SawBlade extends Obstacle {
    constructor(x, y, size = 60) {
        super(x, y, size, size, 'saw');
        this.size = size;
        this.rotation = 0;
    }

    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        const centerX = screenX + this.size / 2;
        const centerY = this.y + this.size / 2;

        this.rotation += 0.15;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);

        // Saw body
        ctx.fillStyle = '#333344';
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Teeth
        const teethCount = 12;
        ctx.fillStyle = '#1a1a2e';
        for (let i = 0; i < teethCount; i++) {
            const angle = (Math.PI * 2 / teethCount) * i;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * this.size / 3, Math.sin(angle) * this.size / 3);
            ctx.lineTo(Math.cos(angle - 0.15) * this.size / 2, Math.sin(angle - 0.15) * this.size / 2);
            ctx.lineTo(Math.cos(angle + 0.15) * this.size / 2, Math.sin(angle + 0.15) * this.size / 2);
            ctx.closePath();
            ctx.fill();
        }

        // Center
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 6, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    checkCollision(player) {
        const hitbox = player.getHitbox();
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;
        const px = hitbox.x + hitbox.width / 2;
        const py = hitbox.y + hitbox.height / 2;

        const dist = Math.sqrt((cx - px) ** 2 + (cy - py) ** 2);
        return dist < (this.size / 2 - 5 + hitbox.width / 2 - 5);
    }
}

// Moving platform
class MovingBlock extends Block {
    constructor(x, y, width, height, moveType = 'vertical', distance = 100, speed = 2) {
        super(x, y, width, height, '#5544aa');
        this.startX = x;
        this.startY = y;
        this.moveType = moveType;
        this.distance = distance;
        this.speed = speed;
        this.phase = 0;
    }

    update() {
        this.phase += 0.02;

        if (this.moveType === 'vertical') {
            this.y = this.startY + Math.sin(this.phase) * this.distance;
        } else if (this.moveType === 'horizontal') {
            this.x = this.startX + Math.sin(this.phase) * this.distance;
        }
    }
}

// Decoration (non-collidable visual element)
class Decoration extends Obstacle {
    constructor(x, y, width, height, decorType = 'block') {
        super(x, y, width, height, 'decoration');
        this.decorType = decorType;
        this.animPhase = Math.random() * Math.PI * 2;
    }

    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        this.animPhase += 0.02;

        switch (this.decorType) {
            case 'glow_block':
                const gradient = ctx.createRadialGradient(
                    screenX + this.width / 2, this.y + this.height / 2, 0,
                    screenX + this.width / 2, this.y + this.height / 2, this.width
                );
                gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(screenX - this.width / 2, this.y - this.height / 2, this.width * 2, this.height * 2);
                break;

            case 'pulse':
                const pulse = 0.5 + Math.sin(this.animPhase) * 0.5;
                ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(screenX + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'chain':
                ctx.strokeStyle = '#666688';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(screenX + this.width / 2, this.y);
                ctx.lineTo(screenX + this.width / 2, this.y + this.height);
                ctx.stroke();
                break;
        }
    }

    checkCollision() {
        return false; // Decorations don't collide
    }
}

// End trigger (level completion)
class EndTrigger extends Obstacle {
    constructor(x, y, height = 400) {
        super(x, y, 50, height, 'end');
    }

    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;

        // Finish line
        const gradient = ctx.createLinearGradient(screenX, 0, screenX + this.width, 0);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, this.y, this.width, this.height);

        // Checkered pattern
        const squareSize = 20;
        for (let row = 0; row < this.height / squareSize; row++) {
            for (let col = 0; col < 2; col++) {
                if ((row + col) % 2 === 0) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.fillRect(
                        screenX + col * squareSize + 5,
                        this.y + row * squareSize,
                        squareSize,
                        squareSize
                    );
                }
            }
        }
    }

    checkCollision(player) {
        const hitbox = player.getHitbox();
        return hitbox.x + hitbox.width > this.x;
    }
}

// Export obstacle types
const ObstacleTypes = {
    Spike,
    Block,
    Platform,
    Orb,
    JumpPad,
    Portal,
    Coin,
    SawBlade,
    MovingBlock,
    Decoration,
    EndTrigger
};
