// Geometry Dash Clone - Level Data

const LEVELS = [
    {
        id: 1,
        name: "Stereo Madness",
        difficulty: "easy",
        stars: 1,
        color: { bg1: '#0066cc', bg2: '#003366', ground: '#2d1b4e' },
        bpm: 140,
        length: 8000,
        obstacles: []
    },
    {
        id: 2,
        name: "Back On Track",
        difficulty: "easy",
        stars: 2,
        color: { bg1: '#006644', bg2: '#003322', ground: '#1b4e2d' },
        bpm: 130,
        length: 8500,
        obstacles: []
    },
    {
        id: 3,
        name: "Polargeist",
        difficulty: "normal",
        stars: 3,
        color: { bg1: '#440066', bg2: '#220033', ground: '#3d1b4e' },
        bpm: 145,
        length: 9000,
        obstacles: []
    },
    {
        id: 4,
        name: "Dry Out",
        difficulty: "normal",
        stars: 4,
        color: { bg1: '#664400', bg2: '#332200', ground: '#4e3d1b' },
        bpm: 150,
        length: 9500,
        obstacles: []
    },
    {
        id: 5,
        name: "Base After Base",
        difficulty: "hard",
        stars: 5,
        color: { bg1: '#006666', bg2: '#003333', ground: '#1b4e4e' },
        bpm: 155,
        length: 10000,
        obstacles: []
    },
    {
        id: 6,
        name: "Can't Let Go",
        difficulty: "hard",
        stars: 6,
        color: { bg1: '#660044', bg2: '#330022', ground: '#4e1b3d' },
        bpm: 160,
        length: 10500,
        obstacles: []
    },
    {
        id: 7,
        name: "Jumper",
        difficulty: "harder",
        stars: 7,
        color: { bg1: '#444400', bg2: '#222200', ground: '#4e4e1b' },
        bpm: 165,
        length: 11000,
        obstacles: []
    },
    {
        id: 8,
        name: "Time Machine",
        difficulty: "harder",
        stars: 8,
        color: { bg1: '#004466', bg2: '#002233', ground: '#1b3d4e' },
        bpm: 170,
        length: 12000,
        obstacles: []
    },
    {
        id: 9,
        name: "Cycles",
        difficulty: "harder",
        stars: 9,
        color: { bg1: '#660000', bg2: '#330000', ground: '#4e1b1b' },
        bpm: 175,
        length: 12500,
        obstacles: []
    },
    {
        id: 10,
        name: "xStep",
        difficulty: "insane",
        stars: 10,
        color: { bg1: '#440044', bg2: '#220022', ground: '#3d1b3d' },
        bpm: 180,
        length: 13000,
        obstacles: []
    }
];

// Level generator function
function generateLevel(levelData, groundY, canvasHeight) {
    const obstacles = [];
    const blockSize = 40;
    const length = levelData.length;

    // Ground reference
    const floorY = groundY - blockSize;

    // Generate obstacles based on level difficulty
    const difficulty = levelData.difficulty;
    let x = 500; // Starting position

    // Difficulty parameters
    const difficultyParams = {
        easy: { spikeGap: 300, blockGap: 200, jumpPadChance: 0.2, orbChance: 0.1 },
        normal: { spikeGap: 250, blockGap: 180, jumpPadChance: 0.25, orbChance: 0.15 },
        hard: { spikeGap: 200, blockGap: 150, jumpPadChance: 0.3, orbChance: 0.2 },
        harder: { spikeGap: 180, blockGap: 130, jumpPadChance: 0.35, orbChance: 0.25 },
        insane: { spikeGap: 150, blockGap: 100, jumpPadChance: 0.4, orbChance: 0.3 },
        demon: { spikeGap: 120, blockGap: 80, jumpPadChance: 0.5, orbChance: 0.4 }
    };

    const params = difficultyParams[difficulty] || difficultyParams.normal;

    // Add varied obstacle sections
    while (x < length - 300) {
        const sectionType = Math.random();

        if (sectionType < 0.25) {
            // Spike section
            const spikeCount = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < spikeCount; i++) {
                obstacles.push(new Spike(x + i * blockSize, floorY, 'up', blockSize));
            }
            x += spikeCount * blockSize + params.spikeGap;

        } else if (sectionType < 0.45) {
            // Block platform section
            const blockCount = 1 + Math.floor(Math.random() * 4);
            const blockHeight = 1 + Math.floor(Math.random() * 3);

            for (let i = 0; i < blockCount; i++) {
                for (let h = 0; h < blockHeight; h++) {
                    obstacles.push(new Block(
                        x + i * blockSize,
                        floorY - h * blockSize,
                        blockSize,
                        blockSize,
                        levelData.color.ground
                    ));
                }
            }

            // Maybe add spikes on top
            if (Math.random() < 0.4) {
                obstacles.push(new Spike(
                    x + Math.floor(blockCount / 2) * blockSize,
                    floorY - blockHeight * blockSize,
                    'up',
                    blockSize
                ));
            }

            x += blockCount * blockSize + params.blockGap;

        } else if (sectionType < 0.55) {
            // Jump pad section
            obstacles.push(new JumpPad(x, floorY + blockSize - 15, 'yellow'));

            // Add obstacle to jump over
            x += 200;
            const obstacleType = Math.random();
            if (obstacleType < 0.5) {
                obstacles.push(new Spike(x, floorY, 'up', blockSize));
                obstacles.push(new Spike(x + blockSize, floorY, 'up', blockSize));
            } else {
                obstacles.push(new Block(x, floorY, blockSize * 2, blockSize * 2, levelData.color.ground));
            }

            x += 150 + params.blockGap;

        } else if (sectionType < 0.65) {
            // Orb section
            obstacles.push(new Block(x, floorY, blockSize * 3, blockSize, levelData.color.ground));

            // Gap with orb
            x += blockSize * 3 + 80;
            obstacles.push(new Orb(x, floorY - 80, 'yellow'));
            obstacles.push(new Spike(x - 20, floorY, 'up', blockSize));
            obstacles.push(new Spike(x + 15, floorY, 'up', blockSize));
            obstacles.push(new Spike(x + 50, floorY, 'up', blockSize));

            x += 150 + params.blockGap;

        } else if (sectionType < 0.75) {
            // Stair section
            const steps = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < steps; i++) {
                for (let h = 0; h <= i; h++) {
                    obstacles.push(new Block(
                        x + i * blockSize,
                        floorY - h * blockSize,
                        blockSize,
                        blockSize,
                        levelData.color.ground
                    ));
                }
            }

            // Spike at top
            if (Math.random() < 0.5) {
                obstacles.push(new Spike(x + steps * blockSize, floorY - (steps - 1) * blockSize, 'up', blockSize));
            }

            x += steps * blockSize + params.blockGap;

        } else if (sectionType < 0.85) {
            // Triple spike challenge
            obstacles.push(new Spike(x, floorY, 'up', blockSize));
            obstacles.push(new Spike(x + blockSize, floorY, 'up', blockSize));
            obstacles.push(new Spike(x + blockSize * 2, floorY, 'up', blockSize));

            x += blockSize * 3 + params.spikeGap;

        } else if (sectionType < 0.92) {
            // Saw blade section
            obstacles.push(new SawBlade(x, floorY - 40, 60));
            x += 120 + params.blockGap;

        } else {
            // Coin opportunity
            obstacles.push(new Block(x, floorY - blockSize * 2, blockSize, blockSize, levelData.color.ground));
            obstacles.push(new Coin(x + 7, floorY - blockSize * 3 - 5, 'gold'));
            obstacles.push(new Spike(x + blockSize, floorY, 'up', blockSize));

            x += blockSize * 2 + params.blockGap;
        }

        // Occasionally add decorations
        if (Math.random() < 0.1) {
            obstacles.push(new Decoration(x - 50, floorY - 100, 50, 50, 'glow_block'));
        }
    }

    // Add portal sections for harder levels
    if (difficulty === 'hard' || difficulty === 'harder' || difficulty === 'insane' || difficulty === 'demon') {
        // Add ship section
        const shipStart = length * 0.3;
        obstacles.push(new Portal(shipStart, groundY - 200, 'ship', 200));
        obstacles.push(new Portal(shipStart + 800, groundY - 200, 'cube', 200));

        // Add UFO section for harder levels
        if (difficulty === 'harder' || difficulty === 'insane' || difficulty === 'demon') {
            const ufoStart = length * 0.6;
            obstacles.push(new Portal(ufoStart, groundY - 200, 'ufo', 200));
            obstacles.push(new Portal(ufoStart + 600, groundY - 200, 'cube', 200));
        }

        // Add wave section for insane+
        if (difficulty === 'insane' || difficulty === 'demon') {
            const waveStart = length * 0.75;
            obstacles.push(new Portal(waveStart, groundY - 200, 'wave', 200));
            obstacles.push(new Portal(waveStart + 400, groundY - 200, 'cube', 200));
        }
    }

    // Add gravity portals for variety
    if (Math.random() < 0.3 && difficulty !== 'easy') {
        const gravityX = length * 0.45;
        obstacles.push(new Portal(gravityX, groundY - 200, 'gravity_up', 200));
        obstacles.push(new Portal(gravityX + 500, 50, 'gravity_down', 200));
    }

    // Add end trigger
    obstacles.push(new EndTrigger(length - 100, groundY - 400, 400));

    return obstacles;
}

// Pre-generate all levels
function initializeLevels(groundY, canvasHeight) {
    LEVELS.forEach(level => {
        level.obstacles = generateLevel(level, groundY, canvasHeight);
    });
}

// Get level by ID
function getLevel(id) {
    return LEVELS.find(l => l.id === id) || LEVELS[0];
}

// Save/load progress
const LevelProgress = {
    data: {},

    load() {
        try {
            const saved = localStorage.getItem('gd_progress');
            if (saved) {
                this.data = JSON.parse(saved);
            }
        } catch (e) {
            this.data = {};
        }
    },

    save() {
        try {
            localStorage.setItem('gd_progress', JSON.stringify(this.data));
        } catch (e) {
            console.warn('Could not save progress');
        }
    },

    getProgress(levelId) {
        return this.data[levelId] || { progress: 0, attempts: 0, completed: false };
    },

    updateProgress(levelId, progress, completed = false) {
        if (!this.data[levelId]) {
            this.data[levelId] = { progress: 0, attempts: 0, completed: false };
        }

        if (progress > this.data[levelId].progress) {
            this.data[levelId].progress = progress;
        }

        this.data[levelId].attempts++;

        if (completed) {
            this.data[levelId].completed = true;
        }

        this.save();
    },

    getTotalStars() {
        let stars = 0;
        LEVELS.forEach(level => {
            if (this.data[level.id] && this.data[level.id].completed) {
                stars += level.stars;
            }
        });
        return stars;
    }
};

// Custom level format support
class CustomLevel {
    constructor(name, data) {
        this.name = name;
        this.difficulty = data.difficulty || 'normal';
        this.stars = data.stars || 5;
        this.color = data.color || { bg1: '#0066cc', bg2: '#003366', ground: '#2d1b4e' };
        this.bpm = data.bpm || 140;
        this.length = data.length || 5000;
        this.obstacles = this.parseObstacles(data.obstacles || []);
    }

    parseObstacles(obstacleData) {
        const obstacles = [];
        obstacleData.forEach(obj => {
            switch (obj.type) {
                case 'spike':
                    obstacles.push(new Spike(obj.x, obj.y, obj.direction || 'up', obj.size || 40));
                    break;
                case 'block':
                    obstacles.push(new Block(obj.x, obj.y, obj.width || 40, obj.height || 40, obj.color));
                    break;
                case 'orb':
                    obstacles.push(new Orb(obj.x, obj.y, obj.orbType || 'yellow'));
                    break;
                case 'pad':
                    obstacles.push(new JumpPad(obj.x, obj.y, obj.padType || 'yellow'));
                    break;
                case 'portal':
                    obstacles.push(new Portal(obj.x, obj.y, obj.portalType || 'cube', obj.height || 150));
                    break;
                case 'coin':
                    obstacles.push(new Coin(obj.x, obj.y, obj.coinType || 'gold'));
                    break;
                case 'saw':
                    obstacles.push(new SawBlade(obj.x, obj.y, obj.size || 60));
                    break;
            }
        });
        return obstacles;
    }
}
