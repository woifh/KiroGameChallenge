// Game constants
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.2;
const JUMP_POWER = -5.0;
const BASE_OBSTACLE_SPEED = 0.9;
const BASE_OBSTACLE_SPAWN_INTERVAL = 250;
const OBSTACLE_GAP = 250;
const OBSTACLE_WIDTH = 50;

// Dynamic game variables (affected by level)
let OBSTACLE_SPEED = BASE_OBSTACLE_SPEED;
let OBSTACLE_SPAWN_INTERVAL = BASE_OBSTACLE_SPAWN_INTERVAL;

// Load Kiro logo
const kiroImage = new Image();
kiroImage.src = 'kiro-logo.png';

// Load Angry Bird
const angryBirdImage = new Image();
angryBirdImage.src = 'AngryBird.png';

// Character Manager
const CharacterManager = {
    characters: [
        { id: 'kiro', name: 'Kiro', sprite: 'kiro-logo.png', color: '#790ECB' },
        { id: 'bird', name: 'Angry Bird', sprite: 'AngryBird.png', color: '#FF4444' },
        { id: 'star', name: 'Star', sprite: 'star.png', color: '#FFFF44' }
    ],
    selectedCharacter: null,
    characterImages: {},
    STORAGE_KEY: 'flappyKiroSelectedCharacter',
    
    init() {
        // Load all character images
        this.characters.forEach(char => {
            const img = new Image();
            img.src = char.sprite;
            this.characterImages[char.id] = img;
        });
        
        // Load saved selection
        this.loadSelection();
        
        // If no saved selection, default to Kiro
        if (!this.selectedCharacter) {
            this.selectedCharacter = this.characters[0];
        }
    },
    
    getSelected() {
        return this.selectedCharacter;
    },
    
    setSelected(id) {
        const character = this.characters.find(c => c.id === id);
        if (character) {
            this.selectedCharacter = character;
            this.saveSelection();
        }
    },
    
    saveSelection() {
        try {
            localStorage.setItem(this.STORAGE_KEY, this.selectedCharacter.id);
        } catch (e) {
            console.warn('localStorage unavailable for character selection');
        }
    },
    
    loadSelection() {
        try {
            const savedId = localStorage.getItem(this.STORAGE_KEY);
            if (savedId) {
                const character = this.characters.find(c => c.id === savedId);
                if (character) {
                    this.selectedCharacter = character;
                }
            }
        } catch (e) {
            console.warn('localStorage unavailable for character selection');
        }
    },
    
    getCharacterImage(id) {
        return this.characterImages[id];
    }
};

// Initialize character manager
CharacterManager.init();

// Missile System
class Missile {
    constructor(x, y, level = 1, angleOffset = 0) {
        this.x = x;
        this.y = y;
        this.level = level;
        this.angleOffset = angleOffset;
        
        // Get weapon power scaling
        const weaponPower = LevelManager.getWeaponPower();
        const sizeMultiplier = weaponPower.size;
        
        // Determine weapon type based on level
        const weaponType = level <= 10 ? 'basic' : (level <= 20 ? 'spread' : 'homing');
        
        // Base properties with scaling
        if (weaponType === 'basic') {
            this.width = 20 * sizeMultiplier;
            this.height = 5 * sizeMultiplier;
            this.velocityX = weaponPower.speed;
            this.velocityY = 0;
            this.color = '#FFAA00';
            this.type = 'basic';
        } else if (weaponType === 'spread') {
            this.width = 18 * sizeMultiplier;
            this.height = 4 * sizeMultiplier;
            this.velocityX = weaponPower.speed * 1.2;
            this.velocityY = angleOffset * 2.5;
            this.color = '#44AAFF';
            this.type = 'spread';
        } else {
            this.width = 25 * sizeMultiplier;
            this.height = 6 * sizeMultiplier;
            this.velocityX = weaponPower.speed;
            this.velocityY = 0;
            this.color = '#FF44FF';
            this.type = 'homing';
            this.homingStrength = 0.15 + (level - 20) * 0.01; // Stronger homing at higher levels
        }
        
        this.damage = weaponPower.damage;
    }
    
    update() {
        // Homing behavior for level 3
        if (this.type === 'homing' && angryBird) {
            const dx = angryBird.x - this.x;
            const dy = angryBird.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                this.velocityY += (dy / distance) * this.homingStrength;
                // Limit vertical velocity
                this.velocityY = Math.max(-3, Math.min(3, this.velocityY));
            }
        }
        
        this.x += this.velocityX;
        this.y += this.velocityY;
    }
    
    draw(ctx) {
        // Add glow effect
        ctx.shadowBlur = this.type === 'homing' ? 15 : 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        if (this.type === 'homing') {
            // Draw larger homing missile with trail
            ctx.fillRect(this.x, this.y - this.height / 2, this.width, this.height);
            // Add small trail
            ctx.globalAlpha = 0.5;
            ctx.fillRect(this.x - 10, this.y - this.height / 2 + 1, 10, this.height - 2);
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillRect(this.x, this.y - this.height / 2, this.width, this.height);
        }
        
        ctx.shadowBlur = 0;
    }
    
    isOffScreen(canvasWidth) {
        return this.x > canvasWidth || this.y < -50 || this.y > canvas.height + 50;
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

const MissileManager = {
    missiles: [],
    cooldown: 0,
    maxMissiles: 5,
    lastFrameTime: Date.now(),
    
    fire(playerX, playerY) {
        if (!this.canFire()) {
            return false;
        }
        
        const currentLevel = LevelManager.currentLevel;
        const weaponPower = LevelManager.getWeaponPower();
        
        // Spread shot for levels 11-20, then homing for 21+
        if (currentLevel > 10 && currentLevel <= 20) {
            // Spread shot - fire 3 missiles
            this.missiles.push(new Missile(playerX, playerY, currentLevel, 0));
            this.missiles.push(new Missile(playerX, playerY, currentLevel, -1));
            this.missiles.push(new Missile(playerX, playerY, currentLevel, 1));
        } else {
            // Single missile (basic or homing)
            this.missiles.push(new Missile(playerX, playerY, currentLevel));
        }
        
        this.cooldown = weaponPower.cooldown;
        return true;
    },
    
    getDamage() {
        return LevelManager.getWeaponPower().damage;
    },
    
    update() {
        // Update cooldown
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        if (this.cooldown > 0) {
            this.cooldown = Math.max(0, this.cooldown - deltaTime);
        }
        
        // Update all missiles
        for (const missile of this.missiles) {
            missile.update();
        }
        
        // Cleanup off-screen missiles
        this.cleanup(canvas.width);
    },
    
    draw(ctx) {
        for (const missile of this.missiles) {
            missile.draw(ctx);
        }
    },
    
    checkCollision(bird) {
        if (!bird) return false;
        
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            const missileBounds = missile.getBounds();
            
            // Check collision with bird
            if (missileBounds.x + missileBounds.width > bird.x &&
                missileBounds.x < bird.x + bird.width &&
                missileBounds.y + missileBounds.height > bird.y &&
                missileBounds.y < bird.y + bird.height) {
                
                // Remove missile
                this.missiles.splice(i, 1);
                return true;
            }
        }
        return false;
    },
    
    cleanup(canvasWidth) {
        this.missiles = this.missiles.filter(missile => !missile.isOffScreen(canvasWidth));
    },
    
    canFire() {
        return this.cooldown <= 0 && this.missiles.length < this.maxMissiles;
    },
    
    getCount() {
        return this.missiles.length;
    },
    
    reset() {
        this.missiles = [];
        this.cooldown = 0;
        this.lastFrameTime = Date.now();
    }
};

// Level Manager
const LevelManager = {
    currentLevel: 1,
    levelTransitionShown: false,
    transitionStartTime: 0,
    transitionDuration: 2000, // 2 seconds
    pointsPerLevel: 10, // Level up every 10 points
    
    updateLevel(currentScore) {
        // Infinite scaling - level up every 10 points
        const newLevel = Math.floor(currentScore / this.pointsPerLevel) + 1;
        
        if (newLevel > this.currentLevel) {
            this.currentLevel = newLevel;
            this.showLevelTransition(newLevel);
            return true;
        }
        return false;
    },
    
    getCurrentLevel() {
        // Dynamic level properties based on current level
        const level = this.currentLevel;
        const hueRotation = (level * 60) % 360; // Cycle through colors
        
        return {
            number: level,
            scoreThreshold: (level - 1) * this.pointsPerLevel,
            birdSpeedMultiplier: 1.0 + (level - 1) * 0.15, // Birds get 15% faster each level
            spawnIntervalMultiplier: Math.max(0.3, 1.0 - (level - 1) * 0.08), // Spawn faster, min 30%
            theme: { 
                bg: 'dynamic', 
                hue: hueRotation, 
                accent: `hsl(${hueRotation}, 70%, 50%)` 
            }
        };
    },
    
    getWeaponPower() {
        // Weapons get more powerful with each level
        return {
            damage: 10 + (this.currentLevel - 1) * 2, // +2 damage per level
            speed: 8 + Math.min(this.currentLevel - 1, 10) * 0.5, // Speed caps at level 20
            size: 1.0 + Math.min(this.currentLevel - 1, 15) * 0.05, // Size increases, caps at level 30
            cooldown: Math.max(200, 500 - (this.currentLevel - 1) * 15) // Faster firing, min 200ms
        };
    },
    
    showLevelTransition(levelNumber) {
        this.levelTransitionShown = true;
        this.transitionStartTime = Date.now();
        
        // Create confetti for level up
        particleSystem.createConfetti();
    },
    
    isTransitionActive() {
        if (!this.levelTransitionShown) return false;
        const elapsed = Date.now() - this.transitionStartTime;
        if (elapsed > this.transitionDuration) {
            this.levelTransitionShown = false;
            return false;
        }
        return true;
    },
    
    drawLevelTransition(ctx) {
        if (!this.isTransitionActive()) return;
        
        const elapsed = Date.now() - this.transitionStartTime;
        const progress = elapsed / this.transitionDuration;
        const opacity = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.7})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const level = this.getCurrentLevel();
        ctx.shadowBlur = 20;
        ctx.shadowColor = level.theme.accent;
        ctx.fillStyle = level.theme.accent;
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = opacity;
        ctx.fillText(`LEVEL ${this.currentLevel}`, canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Difficulty Increased!', canvas.width / 2, canvas.height / 2 + 30);
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    },
    
    drawLevelIndicator(ctx) {
        const level = this.getCurrentLevel();
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#000000';
        ctx.fillStyle = level.theme.accent;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Level ${this.currentLevel}`, canvas.width - 20, 30);
        ctx.shadowBlur = 0;
    },
    
    reset() {
        this.currentLevel = 1;
        this.levelTransitionShown = false;
        this.applyLevelSettings();
    }
};

// Animation variables
let animationTime = 0;

// Particle System
class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    draw(ctx) {
        const opacity = this.life / this.maxLife;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
    
    isDead() {
        return this.life <= 0;
    }
}

class TrailParticle extends Particle {
    constructor(x, y, color) {
        super(x, y, 0, 0, 25, color || '#790ECB', 6);
    }
    
    draw(ctx) {
        const opacity = this.life / this.maxLife;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

class ExplosionParticle extends Particle {
    constructor(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const colors = ['#FF4444', '#FF8844', '#FFAA44'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        super(x, y, vx, vy, 50, color, 4);
        this.gravity = 0.15;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;
    }
}

class SparkleParticle extends Particle {
    constructor(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const colors = ['#FFFFFF', '#FFFF44', '#44FFFF'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        super(x, y, vx, vy, 35, color, 3);
    }
    
    draw(ctx) {
        // Twinkling effect with pulsing opacity
        const pulsePhase = (this.maxLife - this.life) / 10;
        const twinkle = Math.abs(Math.sin(pulsePhase));
        const opacity = (this.life / this.maxLife) * twinkle;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

class ConfettiParticle extends Particle {
    constructor(x, y) {
        const vx = (Math.random() - 0.5) * 4;
        const vy = Math.random() * -3 - 2;
        const colors = ['#790ECB', '#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        super(x, y, vx, vy, 150, color, 8);
        this.gravity = 0.12;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.rotation += this.rotationSpeed;
        this.life--;
    }
    
    draw(ctx) {
        const opacity = Math.min(1.0, this.life / this.maxLife);
        ctx.globalAlpha = opacity;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
        ctx.globalAlpha = 1.0;
    }
    
    isDead() {
        return this.life <= 0 || this.y > canvas.height;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
    }
    
    addParticle(particle) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push(particle);
        }
    }
    
    update() {
        for (const particle of this.particles) {
            particle.update();
        }
        this.cleanup();
    }
    
    draw(ctx) {
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
    }
    
    cleanup() {
        this.particles = this.particles.filter(p => !p.isDead());
    }
    
    createTrail(x, y, color) {
        this.addParticle(new TrailParticle(x, y, color));
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 18; i++) {
            this.addParticle(new ExplosionParticle(x, y));
        }
    }
    
    createSparkles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.addParticle(new SparkleParticle(x, y));
        }
    }
    
    createConfetti() {
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height * 0.5;
            this.addParticle(new ConfettiParticle(x, y));
        }
    }
}

const particleSystem = new ParticleSystem();

// Score Manager
const ScoreManager = {
    HIGH_SCORE_KEY: 'flappyKiroHighScore',
    
    getHighScore() {
        try {
            const stored = localStorage.getItem(this.HIGH_SCORE_KEY);
            return stored ? parseInt(stored, 10) : 0;
        } catch (e) {
            console.warn('localStorage unavailable, using in-memory high score');
            return this._memoryHighScore || 0;
        }
    },
    
    saveHighScore(score) {
        try {
            localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
        } catch (e) {
            console.warn('localStorage unavailable, saving to memory only');
            this._memoryHighScore = score;
        }
    },
    
    isNewHighScore(currentScore, highScore) {
        return currentScore > highScore;
    },
    
    _memoryHighScore: 0
};

// Game state
let gameState = 'characterSelect'; // 'characterSelect', 'start', 'playing', 'gameOver'
let score = 0;
let highScore = ScoreManager.getHighScore();
let frameCount = 0;
let confettiTriggered = false;
let selectedCharacterIndex = CharacterManager.characters.findIndex(c => c.id === CharacterManager.getSelected().id); // For character selection screen

// Angry Birds (now multiple)
let angryBirds = [];
const BASE_BIRD_SPEED = 2.5;
const BASE_BIRD_SPAWN_INTERVAL = 120; // Frames between spawns
let birdSpawnInterval = BASE_BIRD_SPAWN_INTERVAL;
let birdSpawnCounter = 0;

function createAngryBird() {
    const levelData = LevelManager.getCurrentLevel();
    const y = Math.random() * (canvas.height - 100) + 50;
    return {
        x: canvas.width,
        y: y,
        width: 50,
        height: 50,
        speed: BASE_BIRD_SPEED * levelData.birdSpeedMultiplier,
        active: true
    };
}

function updateAngryBirds() {
    if (gameState !== 'playing') return;
    
    // Spawn birds at intervals (more frequent at higher levels)
    const levelData = LevelManager.getCurrentLevel();
    birdSpawnCounter++;
    birdSpawnInterval = BASE_BIRD_SPAWN_INTERVAL * levelData.spawnIntervalMultiplier;
    
    if (birdSpawnCounter >= birdSpawnInterval) {
        angryBirds.push(createAngryBird());
        birdSpawnCounter = 0;
    }
    
    // Update all birds
    for (let i = angryBirds.length - 1; i >= 0; i--) {
        const bird = angryBirds[i];
        bird.x -= bird.speed;
        
        // Remove if off screen (left side)
        if (bird.x + bird.width < 0) {
            angryBirds.splice(i, 1);
        }
    }
}

function drawAngryBirds() {
    for (const bird of angryBirds) {
        if (angryBirdImage.complete) {
            // Pulsing glow effect
            const pulse = Math.sin(animationTime * 0.1) * 0.5 + 0.5;
            ctx.shadowBlur = 20 + pulse * 10;
            ctx.shadowColor = '#FF4444';
            
            // Slight bobbing animation
            const bob = Math.sin(animationTime * 0.15 + bird.x * 0.01) * 3;
            
            // Flip the bird horizontally to face left
            ctx.save();
            ctx.translate(bird.x + bird.width, bird.y + bob);
            ctx.scale(-1, 1);
            ctx.drawImage(angryBirdImage, 0, 0, bird.width, bird.height);
            ctx.restore();
            
            ctx.shadowBlur = 0;
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
        }
    }
}

function checkAngryBirdCollisions() {
    if (gameState !== 'playing') return;
    
    for (let i = angryBirds.length - 1; i >= 0; i--) {
        const bird = angryBirds[i];
        
        // Check missile collision with bird first
        if (MissileManager.checkCollision(bird)) {
            // Award points for missile hit (ONLY way to score now!)
            score += MissileManager.getDamage();
            
            // Check for level progression
            LevelManager.updateLevel(score);
            
            // Create explosion effect at bird position
            particleSystem.createExplosion(bird.x + bird.width / 2, bird.y + bird.height / 2);
            
            // Check for new high score
            if (ScoreManager.isNewHighScore(score, highScore) && !confettiTriggered) {
                highScore = score;
                ScoreManager.saveHighScore(highScore);
                particleSystem.createConfetti();
                confettiTriggered = true;
            }
            
            // Remove the bird
            angryBirds.splice(i, 1);
            continue;
        }
        
        // Check collision with player - NOW CAUSES GAME OVER!
        if (kiro.x + kiro.width > bird.x && 
            kiro.x < bird.x + bird.width &&
            kiro.y + kiro.height > bird.y && 
            kiro.y < bird.y + bird.height) {
            
            // Game over on bird collision!
            gameOver();
            return;
        }
    }
}

// Keyboard state
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Kiro character
const kiro = {
    x: 100,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    speed: 4,
    
    draw() {
        const selectedChar = CharacterManager.getSelected();
        const charImage = CharacterManager.getCharacterImage(selectedChar.id);
        
        // Add glow effect with character color
        ctx.shadowBlur = 15;
        ctx.shadowColor = selectedChar.color;
        
        // Slight rotation based on direction
        let rotation = 0;
        if (keys.ArrowUp) rotation = -0.2;
        if (keys.ArrowDown) rotation = 0.2;
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(rotation);
        
        if (charImage && charImage.complete) {
            ctx.drawImage(charImage, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Fallback while image loads
            ctx.fillStyle = selectedChar.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        
        ctx.restore();
        ctx.shadowBlur = 0;
    },
    
    update() {
        if (gameState !== 'playing') return;
        
        // Arrow key navigation
        if (keys.ArrowUp) {
            this.y -= this.speed;
        }
        if (keys.ArrowDown) {
            this.y += this.speed;
        }
        if (keys.ArrowLeft) {
            this.x -= this.speed;
        }
        if (keys.ArrowRight) {
            this.x += this.speed;
        }
        
        // Prevent going off screen
        if (this.y < 0) {
            this.y = 0;
        }
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
        }
        if (this.x < 0) {
            this.x = 0;
        }
        if (this.x + this.width > canvas.width) {
            this.x = canvas.width - this.width;
        }
    },
    
    reset() {
        this.x = 100;
        this.y = canvas.height / 2;
    }
};

// Obstacles
const obstacles = [];

function createObstacle() {
    const minHeight = 50;
    const maxHeight = canvas.height - OBSTACLE_GAP - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    obstacles.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + OBSTACLE_GAP,
        width: OBSTACLE_WIDTH,
        passed: false
    });
}

function updateObstacles() {
    if (gameState !== 'playing') return;
    
    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= OBSTACLE_SPEED;
        
        // Check if passed
        if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < kiro.x) {
            obstacles[i].passed = true;
            score++;
            
            // Check for level progression
            LevelManager.updateLevel(score);
            
            // Create sparkle effect at gap center
            const gapCenterX = obstacles[i].x + obstacles[i].width / 2;
            const gapCenterY = obstacles[i].topHeight + OBSTACLE_GAP / 2;
            particleSystem.createSparkles(gapCenterX, gapCenterY);
            
            // Check for new high score and trigger confetti
            if (ScoreManager.isNewHighScore(score, highScore) && !confettiTriggered) {
                highScore = score;
                ScoreManager.saveHighScore(highScore);
                particleSystem.createConfetti();
                confettiTriggered = true;
            }
        }
        
        // Remove off-screen obstacles
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
    
    // Spawn new obstacles
    if (frameCount % OBSTACLE_SPAWN_INTERVAL === 0) {
        createObstacle();
    }
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        // Gradient for obstacles
        const topGradient = ctx.createLinearGradient(obstacle.x, 0, obstacle.x + obstacle.width, 0);
        topGradient.addColorStop(0, '#1a1a1a');
        topGradient.addColorStop(0.5, '#2a2a2a');
        topGradient.addColorStop(1, '#1a1a1a');
        
        // Top obstacle with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#790ECB';
        ctx.fillStyle = topGradient;
        ctx.fillRect(obstacle.x, 0, obstacle.width, obstacle.topHeight);
        
        ctx.strokeStyle = '#790ECB';
        ctx.lineWidth = 3;
        ctx.strokeRect(obstacle.x, 0, obstacle.width, obstacle.topHeight);
        
        // Bottom obstacle
        const bottomHeight = canvas.height - obstacle.bottomY;
        ctx.fillRect(obstacle.x, obstacle.bottomY, obstacle.width, bottomHeight);
        ctx.strokeRect(obstacle.x, obstacle.bottomY, obstacle.width, bottomHeight);
        
        ctx.shadowBlur = 0;
    });
}

function checkCollision() {
    if (gameState !== 'playing') return;
    
    for (const obstacle of obstacles) {
        // Check if Kiro is in the x-range of the obstacle
        if (kiro.x + kiro.width > obstacle.x && kiro.x < obstacle.x + obstacle.width) {
            // Check if Kiro hits top or bottom obstacle
            if (kiro.y < obstacle.topHeight || kiro.y + kiro.height > obstacle.bottomY) {
                gameOver();
                return;
            }
        }
    }
}

function gameOver() {
    gameState = 'gameOver';
    
    // Create explosion effect at Kiro's position
    particleSystem.createExplosion(kiro.x + kiro.width / 2, kiro.y + kiro.height / 2);
    
    // Update high score if needed
    if (ScoreManager.isNewHighScore(score, highScore)) {
        highScore = score;
        ScoreManager.saveHighScore(highScore);
    }
}

function resetGame() {
    gameState = 'playing';
    score = 0;
    frameCount = 0;
    confettiTriggered = false;
    angryBirds = [];
    birdSpawnCounter = 0;
    kiro.reset();
    MissileManager.reset();
    LevelManager.reset();
}

function drawCharacterSelection() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#790ECB';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Choose Your Character', canvas.width / 2, 60);
    
    // Draw character options
    const characters = CharacterManager.characters;
    const cardWidth = 100;
    const cardHeight = 140;
    const spacing = 20;
    const totalWidth = characters.length * cardWidth + (characters.length - 1) * spacing;
    const startX = (canvas.width - totalWidth) / 2;
    const startY = 150;
    
    characters.forEach((char, index) => {
        const x = startX + index * (cardWidth + spacing);
        const y = startY;
        const isSelected = index === selectedCharacterIndex;
        
        // Card background
        ctx.fillStyle = isSelected ? '#790ECB' : '#2a2a2a';
        ctx.fillRect(x, y, cardWidth, cardHeight);
        
        // Card border
        ctx.strokeStyle = isSelected ? '#FFFFFF' : '#790ECB';
        ctx.lineWidth = isSelected ? 4 : 2;
        ctx.strokeRect(x, y, cardWidth, cardHeight);
        
        // Character preview
        const charImage = CharacterManager.getCharacterImage(char.id);
        const previewSize = 60;
        const previewX = x + (cardWidth - previewSize) / 2;
        const previewY = y + 15;
        
        if (charImage && charImage.complete) {
            ctx.drawImage(charImage, previewX, previewY, previewSize, previewSize);
        } else {
            // Fallback
            ctx.fillStyle = char.color;
            ctx.fillRect(previewX, previewY, previewSize, previewSize);
        }
        
        // Character name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px sans-serif';
        ctx.fillText(char.name, x + cardWidth / 2, y + cardHeight - 20);
        
        // Color indicator
        ctx.fillStyle = char.color;
        ctx.fillRect(x + 10, y + cardHeight - 10, cardWidth - 20, 5);
    });
    
    // Instructions
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px sans-serif';
    ctx.fillText('Use LEFT/RIGHT arrows to select', canvas.width / 2, startY + cardHeight + 60);
    ctx.fillText('Press SPACE or ENTER to confirm', canvas.width / 2, startY + cardHeight + 90);
}

function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#790ECB';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Flappy Kiro', canvas.width / 2, canvas.height / 2 - 60);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px sans-serif';
    ctx.fillText('Use Arrow Keys to Navigate', canvas.width / 2, canvas.height / 2 + 10);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('Press SPACE or Arrow Keys to start', canvas.width / 2, canvas.height / 2 + 40);
    
    // Display current high score
    if (highScore > 0) {
        ctx.fillStyle = '#790ECB';
        ctx.font = '18px sans-serif';
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 60);
    }
    
    // Show selected character
    const selectedChar = CharacterManager.getSelected();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Playing as: ${selectedChar.name}`, canvas.width / 2, canvas.height / 2 + 90);
    
    // Draw reset button
    const resetButtonX = canvas.width / 2 - 80;
    const resetButtonY = canvas.height - 80;
    const resetButtonWidth = 160;
    const resetButtonHeight = 40;
    
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(resetButtonX, resetButtonY, resetButtonWidth, resetButtonHeight);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(resetButtonX, resetButtonY, resetButtonWidth, resetButtonHeight);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px sans-serif';
    ctx.fillText('Reset High Score', canvas.width / 2, resetButtonY + 25);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#790ECB';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 80);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = '#790ECB';
    ctx.font = '20px sans-serif';
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px sans-serif';
    ctx.fillText('Press SPACE or click to restart', canvas.width / 2, canvas.height / 2 + 70);
}

function drawScore() {
    // Score with text shadow
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#000000';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 50);
    
    // Display high score and remaining points
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#790ECB';
    ctx.fillText(`High Score: ${highScore}`, 20, 80);
    
    // Show how many points needed to beat high score
    if (score < highScore) {
        const remaining = highScore - score;
        ctx.fillStyle = '#FFAA44';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`${remaining} to beat!`, 20, 105);
    } else if (score === highScore && highScore > 0) {
        const pulse = Math.sin(animationTime * 0.2) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 68, ${pulse})`;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`Tied! Get 1 more!`, 20, 105);
    } else if (score > highScore) {
        const pulse = Math.sin(animationTime * 0.15) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(68, 255, 68, ${pulse})`;
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(`NEW HIGH SCORE! 🎉`, 20, 105);
    }
    
    // Level indicator
    LevelManager.drawLevelIndicator(ctx);
    
    // Weapon type and power display
    const level = LevelManager.currentLevel;
    const weaponPower = LevelManager.getWeaponPower();
    let weaponName = level <= 10 ? '🔸 Basic' : (level <= 20 ? '⚡ Spread' : '🎯 Homing');
    
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#FFAA00';
    ctx.textAlign = 'left';
    ctx.fillText(`${weaponName} Lv.${level}`, 20, 135);
    
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText(`DMG: ${weaponPower.damage} | SPD: ${weaponPower.speed.toFixed(1)}`, 20, 153);
    
    ctx.font = '16px sans-serif';
    ctx.fillText(`Ammo: ${MissileManager.getCount()}/${MissileManager.maxMissiles}`, 20, 171);
    
    // Cooldown indicator
    if (MissileManager.cooldown > 0) {
        const weaponPower = LevelManager.getWeaponPower();
        const cooldownPercent = MissileManager.cooldown / weaponPower.cooldown;
        const barWidth = 100;
        const barHeight = 8;
        const barX = 20;
        const barY = 181;
        
        // Background bar
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Cooldown bar
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(barX, barY, barWidth * cooldownPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#FFAA00';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    } else {
        // Ready indicator
        const pulse = Math.sin(animationTime * 0.3) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(68, 255, 68, ${pulse})`;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('READY!', 20, 193);
    }
    
    ctx.shadowBlur = 0;
}

function drawBackground() {
    // Get current level theme
    const level = LevelManager.getCurrentLevel();
    const baseHue = level.theme.hue;
    
    // Animated gradient background with level theme
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    const hueShift = (animationTime * 0.1) % 30;
    gradient.addColorStop(0, `hsl(${baseHue + hueShift}, 30%, 8%)`);
    gradient.addColorStop(0.5, '#0a0a0a');
    gradient.addColorStop(1, `hsl(${(baseHue + hueShift + 30) % 360}, 30%, 12%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Animated stars
    for (let i = 0; i < 30; i++) {
        const x = (i * 37 + animationTime * 0.2) % canvas.width;
        const y = (i * 53) % canvas.height;
        const twinkle = Math.sin(animationTime * 0.05 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.6})`;
        ctx.fillRect(x, y, 2, 2);
    }
}

function gameLoop() {
    // Increment animation time
    animationTime++;
    
    // Draw background
    drawBackground();
    
    // Update and draw based on game state
    if (gameState === 'playing') {
        frameCount++;
        kiro.update();
        updateAngryBirds();
        MissileManager.update();
        checkAngryBirdCollisions();
        
        // Generate trail particles every 3 frames with character color
        if (frameCount % 3 === 0) {
            const selectedChar = CharacterManager.getSelected();
            particleSystem.createTrail(kiro.x + kiro.width / 2, kiro.y + kiro.height / 2, selectedChar.color);
        }
        
        particleSystem.update();
    }
    
    // Draw game elements
    drawAngryBirds();
    MissileManager.draw(ctx);
    kiro.draw();
    particleSystem.draw(ctx);
    
    if (gameState === 'playing') {
        drawScore();
        LevelManager.drawLevelTransition(ctx);
    }
    
    // Draw overlays
    if (gameState === 'characterSelect') {
        drawCharacterSelection();
    } else if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'gameOver') {
        drawGameOverScreen();
    }
    
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    // Character selection controls
    if (gameState === 'characterSelect') {
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            selectedCharacterIndex = (selectedCharacterIndex - 1 + CharacterManager.characters.length) % CharacterManager.characters.length;
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            selectedCharacterIndex = (selectedCharacterIndex + 1) % CharacterManager.characters.length;
        } else if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            // Confirm selection
            CharacterManager.setSelected(CharacterManager.characters[selectedCharacterIndex].id);
            gameState = 'start';
        }
        return;
    }
    
    // Arrow key controls
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        keys[e.code] = true;
        
        // Start game if on start screen
        if (gameState === 'start') {
            resetGame();
        }
    }
    
    // Space to start/restart or fire missile
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'start' || gameState === 'gameOver') {
            resetGame();
        } else if (gameState === 'playing') {
            // Fire missile from player position
            MissileManager.fire(kiro.x + kiro.width, kiro.y + kiro.height / 2);
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        keys[e.code] = false;
    }
});

canvas.addEventListener('click', (e) => {
    // Check if click is on reset button when on start screen
    if (gameState === 'start') {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const resetButtonX = canvas.width / 2 - 80;
        const resetButtonY = canvas.height - 80;
        const resetButtonWidth = 160;
        const resetButtonHeight = 40;
        
        // Check if click is within reset button bounds
        if (clickX >= resetButtonX && clickX <= resetButtonX + resetButtonWidth &&
            clickY >= resetButtonY && clickY <= resetButtonY + resetButtonHeight) {
            // Reset high score
            highScore = 0;
            ScoreManager.saveHighScore(0);
            return; // Don't start the game
        }
    }
    
    handleInput();
});

// Start the game loop
gameLoop();
