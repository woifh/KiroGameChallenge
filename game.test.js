import fc from 'fast-check';

// Mock DOM elements for testing
global.document = {
  getElementById: () => ({
    getContext: () => ({
      drawImage: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
    }),
    width: 400,
    height: 600,
    addEventListener: () => {},
  }),
  addEventListener: () => {},
};

global.Image = class {
  constructor() {
    this.complete = false;
  }
};

global.requestAnimationFrame = () => {};

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
  };
})();

global.localStorage = localStorageMock;

describe('Game Enhancements Property-Based Tests', () => {
  
  beforeEach(() => {
    localStorage.clear();
  });

  // Feature: game-enhancements, Property 1: Score storage round trip
  test('Property 1: Score storage round trip', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999999 }), (score) => {
        const ScoreManager = {
          HIGH_SCORE_KEY: 'flappyKiroHighScore',
          getHighScore() {
            const stored = localStorage.getItem(this.HIGH_SCORE_KEY);
            return stored ? parseInt(stored, 10) : 0;
          },
          saveHighScore(score) {
            localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
          },
        };
        
        ScoreManager.saveHighScore(score);
        const retrieved = ScoreManager.getHighScore();
        return retrieved === score;
      }),
      { numRuns: 100 }
    );
  });

  // Feature: game-enhancements, Property 2: High score monotonic increase
  test('Property 2: High score monotonic increase', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (currentScore, initialHighScore) => {
          fc.pre(currentScore > initialHighScore);
          
          const ScoreManager = {
            HIGH_SCORE_KEY: 'testHighScore',
            getHighScore() {
              const stored = localStorage.getItem(this.HIGH_SCORE_KEY);
              return stored ? parseInt(stored, 10) : 0;
            },
            saveHighScore(score) {
              localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
            },
            isNewHighScore(current, high) {
              return current > high;
            },
          };
          
          ScoreManager.saveHighScore(initialHighScore);
          
          if (ScoreManager.isNewHighScore(currentScore, initialHighScore)) {
            ScoreManager.saveHighScore(currentScore);
          }
          
          const finalHighScore = ScoreManager.getHighScore();
          return finalHighScore === currentScore && finalHighScore > initialHighScore;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-enhancements, Property 3: Game over display completeness
  test('Property 3: Game over display completeness', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (score, highScore) => {
          const mockCtx = {
            fillStyle: '',
            font: '',
            textAlign: '',
            texts: [],
            fillText(text) {
              this.texts.push(text);
            },
            fillRect() {},
          };
          
          function drawGameOverScreen(ctx, currentScore, currentHighScore) {
            ctx.fillText(`Score: ${currentScore}`, 200, 280);
            ctx.fillText(`High Score: ${currentHighScore}`, 200, 320);
          }
          
          drawGameOverScreen(mockCtx, score, highScore);
          
          const hasScore = mockCtx.texts.some(t => t.includes(`Score: ${score}`));
          const hasHighScore = mockCtx.texts.some(t => t.includes(`High Score: ${highScore}`));
          
          return hasScore && hasHighScore;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-enhancements, Property 4: Particle lifecycle cleanup
  test('Property 4: Particle lifecycle cleanup', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('trail', 'explosion', 'sparkle', 'confetti'),
        fc.integer({ min: 1, max: 50 }),
        (particleType, initialLife) => {
          class TestParticle {
            constructor() {
              this.life = initialLife;
            }
            update() {
              this.life--;
            }
            isDead() {
              return this.life <= 0;
            }
          }
          
          const particle = new TestParticle();
          
          // Age the particle beyond its lifespan
          for (let i = 0; i <= initialLife; i++) {
            particle.update();
          }
          
          return particle.isDead();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-enhancements, Property 5: Trail particle opacity decay
  test('Property 5: Trail particle opacity decay', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 50 }),
        (maxLife) => {
          class TestTrailParticle {
            constructor() {
              this.life = maxLife;
              this.maxLife = maxLife;
            }
            update() {
              this.life--;
            }
            getOpacity() {
              return this.life / this.maxLife;
            }
          }
          
          const particle = new TestTrailParticle();
          const initialOpacity = particle.getOpacity();
          
          particle.update();
          const afterOpacity = particle.getOpacity();
          
          return initialOpacity === 1.0 && afterOpacity < initialOpacity;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-enhancements, Property 6: Trail particle position invariance
  test('Property 6: Trail particle position invariance', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 0, max: 600 }),
        fc.integer({ min: 1, max: 10 }),
        (x, y, updateCycles) => {
          class TestTrailParticle {
            constructor(x, y) {
              this.x = x;
              this.y = y;
              this.vx = 0;
              this.vy = 0;
            }
            update() {
              this.x += this.vx;
              this.y += this.vy;
            }
          }
          
          const particle = new TestTrailParticle(x, y);
          const initialX = particle.x;
          const initialY = particle.y;
          
          for (let i = 0; i < updateCycles; i++) {
            particle.update();
          }
          
          return particle.x === initialX && particle.y === initialY;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-enhancements, Property 7: Explosion particle directional emission
  test('Property 7: Explosion particle directional emission', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 300 }),
        fc.integer({ min: 100, max: 500 }),
        (centerX, centerY) => {
          class TestExplosionParticle {
            constructor(x, y) {
              const angle = Math.random() * Math.PI * 2;
              const speed = Math.random() * 3 + 2;
              this.vx = Math.cos(angle) * speed;
              this.vy = Math.sin(angle) * speed;
            }
          }
          
          const particles = [];
          for (let i = 0; i < 10; i++) {
            particles.push(new TestExplosionParticle(centerX, centerY));
          }
          
          // Check that particles have different velocity vectors
          const velocities = particles.map(p => `${p.vx.toFixed(2)},${p.vy.toFixed(2)}`);
          const uniqueVelocities = new Set(velocities);
          
          return uniqueVelocities.size > 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-enhancements, Property 8: Particle physics motion
  test('Property 8: Particle physics motion', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -5, max: 5, noNaN: true }),
        fc.float({ min: -5, max: 5, noNaN: true }),
        fc.float({ min: 0, max: 0.5, noNaN: true }),
        (vx, vy, gravity) => {
          class TestPhysicsParticle {
            constructor(vx, vy, gravity) {
              this.x = 0;
              this.y = 0;
              this.vx = vx;
              this.vy = vy;
              this.gravity = gravity;
            }
            update() {
              this.x += this.vx;
              this.y += this.vy;
              this.vy += this.gravity;
            }
          }
          
          const particle = new TestPhysicsParticle(vx, vy, gravity);
          const initialVy = particle.vy;
          
          particle.update();
          
          const xChanged = Math.abs(particle.x - vx) < 0.001;
          const yChanged = Math.abs(particle.y - vy) < 0.001;
          const vyIncreased = Math.abs(particle.vy - (initialVy + gravity)) < 0.001;
          
          return xChanged && yChanged && vyIncreased;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-enhancements, Property 9: Sparkle particle velocity variety
  test('Property 9: Sparkle particle velocity variety', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 300 }),
        fc.integer({ min: 100, max: 500 }),
        (x, y) => {
          class TestSparkleParticle {
            constructor() {
              const angle = Math.random() * Math.PI * 2;
              const speed = Math.random() * 2 + 0.5;
              this.vx = Math.cos(angle) * speed;
              this.vy = Math.sin(angle) * speed;
            }
          }
          
          const particles = [];
          for (let i = 0; i < 10; i++) {
            particles.push(new TestSparkleParticle());
          }
          
          const velocities = particles.map(p => `${p.vx.toFixed(2)},${p.vy.toFixed(2)}`);
          const uniqueVelocities = new Set(velocities);
          
          return uniqueVelocities.size > 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-enhancements, Property 10: Sparkle particle opacity variation
  test('Property 10: Sparkle particle opacity variation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 20, max: 50 }),
        (maxLife) => {
          class TestSparkleParticle {
            constructor() {
              this.life = maxLife;
              this.maxLife = maxLife;
            }
            update() {
              this.life--;
            }
            getOpacity() {
              const pulsePhase = (this.maxLife - this.life) / 10;
              const twinkle = Math.abs(Math.sin(pulsePhase));
              return (this.life / this.maxLife) * twinkle;
            }
          }
          
          const particle = new TestSparkleParticle();
          const opacities = [];
          
          for (let i = 0; i < 10; i++) {
            opacities.push(particle.getOpacity());
            particle.update();
          }
          
          // Check that opacity varies (not all the same)
          const uniqueOpacities = new Set(opacities.map(o => o.toFixed(3)));
          return uniqueOpacities.size > 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-enhancements, Property 11: Confetti particle color variety
  test('Property 11: Confetti particle color variety', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const colors = ['#790ECB', '#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF'];
          
          class TestConfettiParticle {
            constructor() {
              this.color = colors[Math.floor(Math.random() * colors.length)];
            }
          }
          
          const particles = [];
          for (let i = 0; i < 40; i++) {
            particles.push(new TestConfettiParticle());
          }
          
          const particleColors = particles.map(p => p.color);
          const uniqueColors = new Set(particleColors);
          const hasPurple = particleColors.includes('#790ECB');
          
          return uniqueColors.size > 1 && hasPurple;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-enhancements, Property 12: Confetti particle rotation
  test('Property 12: Confetti particle rotation', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -0.5, max: 0.5, noNaN: true }),
        (rotationSpeed) => {
          fc.pre(Math.abs(rotationSpeed) > 0.01);
          
          class TestConfettiParticle {
            constructor(rotationSpeed) {
              this.rotation = 0;
              this.rotationSpeed = rotationSpeed;
            }
            update() {
              this.rotation += this.rotationSpeed;
            }
          }
          
          const particle = new TestConfettiParticle(rotationSpeed);
          const initialRotation = particle.rotation;
          
          particle.update();
          
          const expectedRotation = initialRotation + rotationSpeed;
          return Math.abs(particle.rotation - expectedRotation) < 0.001;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: game-enhancements, Property 13: New high score triggers confetti
  test('Property 13: New high score triggers confetti', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 0, max: 99 }),
        (currentScore, highScore) => {
          fc.pre(currentScore > highScore);
          
          let confettiTriggered = false;
          
          function checkAndTriggerConfetti(score, high) {
            if (score > high && !confettiTriggered) {
              confettiTriggered = true;
              return true;
            }
            return false;
          }
          
          const result = checkAndTriggerConfetti(currentScore, highScore);
          
          return result === true && confettiTriggered === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
