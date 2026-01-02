// Geometry Dash Clone - Player System

class Player {
    constructor(game) {
        this.game = game;

        // Position and physics
        this.x = 100;
        this.y = 0;
        this.velocityY = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;

        // Player dimensions
        this.width = 40;
        this.height = 40;

        // Game mode
        this.mode = 'cube'; // cube, ship, ball, ufo, wave, robot, spider
        this.gravity = 0.8;
        this.jumpForce = -14;
        this.isOnGround = false;
        this.isDead = false;
        this.isHolding = false;

        // Mini mode
        this.isMini = false;
        this.miniScale = 0.6;

        // Dual mode
        this.isDual = false;

        // Gravity flipped
        this.gravityFlipped = false;

        // Visual customization
        this.primaryColor = '#00ff00';
        this.secondaryColor = '#00ffff';
        this.iconId = 0;

        // Trail
        this.trail = [];
        this.trailEnabled = true;

        // Jump statistics
        this.jumpCount = 0;
        this.canJump = true;

        // Orb interaction
        this.orbActivated = false;

        // Death particles
        this.deathParticles = [];

        // Ship specific
        this.shipVelocityY = 0;

        // Wave specific
        this.waveDirection = 0;

        // Robot/Spider specific
        this.isCharging = false;
        this.chargeTime = 0;
    }

    reset(x = 100) {
        this.x = x;
        this.y = this.game.groundY - this.height;
        this.velocityY = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.isDead = false;
        this.isOnGround = true;
        this.canJump = true;
        this.orbActivated = false;
        this.trail = [];
        this.deathParticles = [];
        this.mode = 'cube';
        this.gravityFlipped = false;
        this.isMini = false;
        this.isDual = false;
        this.shipVelocityY = 0;
        this.waveDirection = 0;
    }

    update(deltaTime) {
        if (this.isDead) {
            this.updateDeathParticles();
            return;
        }

        const effectiveGravity = this.gravityFlipped ? -this.gravity : this.gravity;
        const effectiveJumpForce = this.gravityFlipped ? -this.jumpForce : this.jumpForce;
        const scale = this.isMini ? this.miniScale : 1;
        const currentHeight = this.height * scale;

        switch (this.mode) {
            case 'cube':
                this.updateCube(effectiveGravity, effectiveJumpForce, currentHeight);
                break;
            case 'ship':
                this.updateShip(effectiveGravity, currentHeight);
                break;
            case 'ball':
                this.updateBall(effectiveGravity, effectiveJumpForce, currentHeight);
                break;
            case 'ufo':
                this.updateUFO(effectiveGravity, effectiveJumpForce, currentHeight);
                break;
            case 'wave':
                this.updateWave(currentHeight);
                break;
            case 'robot':
                this.updateRobot(effectiveGravity, effectiveJumpForce, currentHeight);
                break;
            case 'spider':
                this.updateSpider(effectiveGravity, currentHeight);
                break;
        }

        // Update trail
        if (this.trailEnabled) {
            this.trail.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                alpha: 1,
                size: this.isMini ? 15 : 25
            });

            // Limit trail length
            if (this.trail.length > 20) {
                this.trail.shift();
            }

            // Fade trail
            this.trail.forEach((point, index) => {
                point.alpha = (index + 1) / this.trail.length;
            });
        }

        // Reset orb activation
        this.orbActivated = false;
    }

    updateCube(gravity, jumpForce, height) {
        // Apply gravity
        this.velocityY += gravity;

        // Update position
        this.y += this.velocityY;

        // Ground collision
        const groundY = this.gravityFlipped ? this.game.ceilingY : this.game.groundY - height;
        const ceilingY = this.gravityFlipped ? this.game.groundY - height : this.game.ceilingY;

        if (this.gravityFlipped) {
            if (this.y <= this.game.ceilingY) {
                this.y = this.game.ceilingY;
                this.velocityY = 0;
                this.isOnGround = true;
                this.rotation = Math.round(this.rotation / 90) * 90;
            } else {
                this.isOnGround = false;
            }

            if (this.y >= this.game.groundY - height) {
                this.y = this.game.groundY - height;
                this.velocityY = 0;
            }
        } else {
            if (this.y >= this.game.groundY - height) {
                this.y = this.game.groundY - height;
                this.velocityY = 0;
                this.isOnGround = true;
                this.rotation = Math.round(this.rotation / 90) * 90;
            } else {
                this.isOnGround = false;
            }

            if (this.y <= this.game.ceilingY) {
                this.y = this.game.ceilingY;
                this.velocityY = 0;
            }
        }

        // Rotation (only when in air)
        if (!this.isOnGround) {
            const rotationDir = this.gravityFlipped ? -1 : 1;
            this.rotation += rotationDir * 8;
        }

        // Jump handling
        if (this.isHolding && this.isOnGround && this.canJump) {
            this.velocityY = jumpForce;
            this.isOnGround = false;
            this.canJump = false;
            this.jumpCount++;
            audioManager.playSound('jump');
        }

        if (!this.isHolding) {
            this.canJump = true;
        }
    }

    updateShip(gravity, height) {
        const flyForce = this.gravityFlipped ? 0.6 : -0.6;
        const maxVelocity = 8;

        if (this.isHolding) {
            this.velocityY += flyForce;
        } else {
            this.velocityY += gravity * 0.5;
        }

        // Clamp velocity
        this.velocityY = Math.max(-maxVelocity, Math.min(maxVelocity, this.velocityY));

        // Update position
        this.y += this.velocityY;

        // Rotation based on velocity
        this.rotation = this.velocityY * 2;

        // Bounds
        if (this.y >= this.game.groundY - height) {
            this.y = this.game.groundY - height;
            this.velocityY = 0;
        }

        if (this.y <= this.game.ceilingY) {
            this.y = this.game.ceilingY;
            this.velocityY = 0;
        }
    }

    updateBall(gravity, jumpForce, height) {
        // Apply gravity
        this.velocityY += gravity;

        // Update position
        this.y += this.velocityY;

        // Ground/ceiling collision
        if (this.gravityFlipped) {
            if (this.y <= this.game.ceilingY) {
                this.y = this.game.ceilingY;
                this.velocityY = 0;
                this.isOnGround = true;
            } else {
                this.isOnGround = false;
            }

            if (this.y >= this.game.groundY - height) {
                this.y = this.game.groundY - height;
                this.velocityY = 0;
            }
        } else {
            if (this.y >= this.game.groundY - height) {
                this.y = this.game.groundY - height;
                this.velocityY = 0;
                this.isOnGround = true;
            } else {
                this.isOnGround = false;
            }

            if (this.y <= this.game.ceilingY) {
                this.y = this.game.ceilingY;
                this.velocityY = 0;
            }
        }

        // Rotation
        const rotationDir = this.gravityFlipped ? -1 : 1;
        this.rotation += rotationDir * 10;

        // Click to switch gravity
        if (this.isHolding && this.isOnGround && this.canJump) {
            this.gravityFlipped = !this.gravityFlipped;
            this.canJump = false;
            this.jumpCount++;
            audioManager.playSound('jump');
        }

        if (!this.isHolding) {
            this.canJump = true;
        }
    }

    updateUFO(gravity, jumpForce, height) {
        // Apply gravity
        this.velocityY += gravity * 0.6;

        // Update position
        this.y += this.velocityY;

        // Ground/ceiling collision
        if (this.y >= this.game.groundY - height) {
            this.y = this.game.groundY - height;
            this.velocityY = 0;
            this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }

        if (this.y <= this.game.ceilingY) {
            this.y = this.game.ceilingY;
            this.velocityY = 0;
        }

        // UFO boost on click (can multi-click)
        if (this.isHolding && this.canJump) {
            this.velocityY = jumpForce * 0.6;
            this.canJump = false;
            this.jumpCount++;
            audioManager.playSound('jump');
        }

        if (!this.isHolding) {
            this.canJump = true;
        }

        // Gentle rotation
        this.rotation = this.velocityY;
    }

    updateWave(height) {
        const waveSpeed = 8;

        // Wave moves diagonally based on input
        if (this.isHolding) {
            this.waveDirection = this.gravityFlipped ? 1 : -1;
        } else {
            this.waveDirection = this.gravityFlipped ? -1 : 1;
        }

        this.y += this.waveDirection * waveSpeed;

        // Bounds
        if (this.y >= this.game.groundY - height) {
            this.y = this.game.groundY - height;
        }

        if (this.y <= this.game.ceilingY) {
            this.y = this.game.ceilingY;
        }

        // Rotation matches direction
        this.rotation = this.waveDirection > 0 ? 45 : -45;
    }

    updateRobot(gravity, jumpForce, height) {
        // Apply gravity
        this.velocityY += gravity;

        // Update position
        this.y += this.velocityY;

        // Ground collision
        if (this.y >= this.game.groundY - height) {
            this.y = this.game.groundY - height;
            this.velocityY = 0;
            this.isOnGround = true;
            this.rotation = 0;
        } else {
            this.isOnGround = false;
        }

        if (this.y <= this.game.ceilingY) {
            this.y = this.game.ceilingY;
            this.velocityY = 0;
        }

        // Robot can hold for variable height jump
        if (this.isHolding && this.isOnGround && this.canJump) {
            this.isCharging = true;
            this.chargeTime = Math.min(this.chargeTime + 1, 30);
        }

        if (!this.isHolding && this.isCharging) {
            const chargeMultiplier = 0.5 + (this.chargeTime / 30) * 0.8;
            this.velocityY = jumpForce * chargeMultiplier;
            this.isOnGround = false;
            this.isCharging = false;
            this.chargeTime = 0;
            this.canJump = false;
            this.jumpCount++;
            audioManager.playSound('jump');
        }

        if (!this.isHolding && this.isOnGround) {
            this.canJump = true;
        }

        // Rotation in air
        if (!this.isOnGround) {
            this.rotation += 5;
        }
    }

    updateSpider(gravity, height) {
        // Apply gravity
        this.velocityY += gravity;

        // Update position
        this.y += this.velocityY;

        // Ground/ceiling collision
        const groundY = this.gravityFlipped ? this.game.ceilingY : this.game.groundY - height;

        if (this.gravityFlipped) {
            if (this.y <= this.game.ceilingY) {
                this.y = this.game.ceilingY;
                this.velocityY = 0;
                this.isOnGround = true;
            } else {
                this.isOnGround = false;
            }
        } else {
            if (this.y >= this.game.groundY - height) {
                this.y = this.game.groundY - height;
                this.velocityY = 0;
                this.isOnGround = true;
            } else {
                this.isOnGround = false;
            }
        }

        // Spider teleports to opposite surface on click
        if (this.isHolding && this.isOnGround && this.canJump) {
            this.gravityFlipped = !this.gravityFlipped;
            // Teleport with velocity
            this.velocityY = this.gravityFlipped ? -15 : 15;
            this.canJump = false;
            this.jumpCount++;
            audioManager.playSound('jump');
        }

        if (!this.isHolding) {
            this.canJump = true;
        }

        // Rotation
        this.rotation = this.gravityFlipped ? 180 : 0;
    }

    die() {
        if (this.isDead) return;

        this.isDead = true;
        audioManager.playSound('death');
        this.createDeathParticles();
    }

    createDeathParticles() {
        const particleCount = 20;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
            const speed = 5 + Math.random() * 10;
            const size = 5 + Math.random() * 15;

            this.deathParticles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 30,
                alpha: 1,
                color: Math.random() > 0.5 ? this.primaryColor : this.secondaryColor
            });
        }
    }

    updateDeathParticles() {
        this.deathParticles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.5; // gravity
            particle.rotation += particle.rotationSpeed;
            particle.alpha -= 0.02;
        });

        this.deathParticles = this.deathParticles.filter(p => p.alpha > 0);
    }

    draw(ctx) {
        if (this.isDead) {
            this.drawDeathParticles(ctx);
            return;
        }

        const scale = this.isMini ? this.miniScale : 1;
        const w = this.width * scale;
        const h = this.height * scale;
        const offsetY = this.isMini ? this.height * (1 - this.miniScale) : 0;

        // Draw trail
        if (this.trailEnabled) {
            this.drawTrail(ctx);
        }

        ctx.save();
        ctx.translate(this.x + w / 2, this.y + h / 2 + offsetY);
        ctx.rotate(this.rotation * Math.PI / 180);

        switch (this.mode) {
            case 'cube':
                this.drawCube(ctx, w, h);
                break;
            case 'ship':
                this.drawShip(ctx, w, h);
                break;
            case 'ball':
                this.drawBall(ctx, w, h);
                break;
            case 'ufo':
                this.drawUFO(ctx, w, h);
                break;
            case 'wave':
                this.drawWave(ctx, w, h);
                break;
            case 'robot':
                this.drawRobot(ctx, w, h);
                break;
            case 'spider':
                this.drawSpider(ctx, w, h);
                break;
        }

        ctx.restore();
    }

    drawTrail(ctx) {
        this.trail.forEach((point, index) => {
            const gradient = ctx.createRadialGradient(
                point.x - this.game.cameraX, point.y,
                0,
                point.x - this.game.cameraX, point.y,
                point.size
            );
            gradient.addColorStop(0, `${this.secondaryColor}${Math.floor(point.alpha * 80).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point.x - this.game.cameraX, point.y, point.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawCube(ctx, w, h) {
        // Main cube body
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(-w/2, -h/2, w, h);

        // Inner details
        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(-w/3, -h/3, w/1.5, h/1.5);

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(-w/2, -h/2, w, h);

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(w/6, -h/8, w/6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(w/6 + 2, -h/8, w/10, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-w/2 + 3, -h/2 + 3, w/3, h/4);
    }

    drawShip(ctx, w, h) {
        // Ship body
        ctx.fillStyle = this.primaryColor;
        ctx.beginPath();
        ctx.moveTo(w/2, 0);
        ctx.lineTo(-w/2, -h/2);
        ctx.lineTo(-w/4, 0);
        ctx.lineTo(-w/2, h/2);
        ctx.closePath();
        ctx.fill();

        // Ship accent
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(w/4, 0);
        ctx.lineTo(-w/4, -h/3);
        ctx.lineTo(-w/6, 0);
        ctx.lineTo(-w/4, h/3);
        ctx.closePath();
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w/2, 0);
        ctx.lineTo(-w/2, -h/2);
        ctx.lineTo(-w/4, 0);
        ctx.lineTo(-w/2, h/2);
        ctx.closePath();
        ctx.stroke();

        // Engine glow
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(-w/3, 0, w/8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBall(ctx, w, h) {
        const radius = w / 2;

        // Ball body
        ctx.fillStyle = this.primaryColor;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Directional marker
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(radius * 0.4, 0, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    drawUFO(ctx, w, h) {
        // UFO dome
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.ellipse(0, -h/6, w/3, h/3, 0, Math.PI, 0);
        ctx.fill();

        // UFO body
        ctx.fillStyle = this.primaryColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, w/2, h/5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, -h/6, w/3, h/3, 0, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, w/2, h/5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Lights
        for (let i = -1; i <= 1; i++) {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(i * w/4, h/10, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawWave(ctx, w, h) {
        // Wave shape (diamond/arrow)
        ctx.fillStyle = this.primaryColor;
        ctx.beginPath();
        ctx.moveTo(w/2, 0);
        ctx.lineTo(0, -h/2);
        ctx.lineTo(-w/2, 0);
        ctx.lineTo(0, h/2);
        ctx.closePath();
        ctx.fill();

        // Inner detail
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(w/4, 0);
        ctx.lineTo(0, -h/4);
        ctx.lineTo(-w/4, 0);
        ctx.lineTo(0, h/4);
        ctx.closePath();
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w/2, 0);
        ctx.lineTo(0, -h/2);
        ctx.lineTo(-w/2, 0);
        ctx.lineTo(0, h/2);
        ctx.closePath();
        ctx.stroke();
    }

    drawRobot(ctx, w, h) {
        // Robot legs
        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(-w/3, h/4, w/5, h/3);
        ctx.fillRect(w/8, h/4, w/5, h/3);

        // Robot body
        ctx.fillStyle = this.primaryColor;
        ctx.fillRect(-w/2, -h/3, w, h * 0.6);

        // Robot head
        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(-w/3, -h/2, w * 0.65, h/4);

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(w/6, -h/3, w/8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(w/6, -h/3, w/14, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-w/2, -h/3, w, h * 0.6);
    }

    drawSpider(ctx, w, h) {
        // Spider legs
        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = 3;

        // Left legs
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-w/4, -h/6 + i * h/4);
            ctx.lineTo(-w/2 - w/4, -h/3 + i * h/3);
            ctx.stroke();
        }

        // Right legs
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(w/4, -h/6 + i * h/4);
            ctx.lineTo(w/2 + w/4, -h/3 + i * h/3);
            ctx.stroke();
        }

        // Spider body
        ctx.fillStyle = this.primaryColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, w/3, h/3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner body
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, w/5, h/5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(-w/8, -h/8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w/8, -h/8, 4, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, w/3, h/3, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawDeathParticles(ctx) {
        this.deathParticles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.translate(particle.x - this.game.cameraX, particle.y);
            ctx.rotate(particle.rotation * Math.PI / 180);

            ctx.fillStyle = particle.color;
            ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);

            ctx.restore();
        });
    }

    // Collision helpers
    getBounds() {
        const scale = this.isMini ? this.miniScale : 1;
        const w = this.width * scale;
        const h = this.height * scale;

        return {
            left: this.x + 5,
            right: this.x + w - 5,
            top: this.y + 5,
            bottom: this.y + h - 5
        };
    }

    getHitbox() {
        // Slightly smaller hitbox for fair gameplay
        const scale = this.isMini ? this.miniScale : 1;
        const w = this.width * scale;
        const h = this.height * scale;
        const margin = 8;

        return {
            x: this.x + margin,
            y: this.y + margin,
            width: w - margin * 2,
            height: h - margin * 2
        };
    }
}
