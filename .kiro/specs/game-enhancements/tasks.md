# Implementation Plan

- [x] 1. Implement Score Manager with localStorage persistence
  - Create ScoreManager object with getHighScore() and saveHighScore() methods
  - Implement localStorage read/write operations with error handling
  - Add high score display to game over screen alongside current score
  - Initialize high score to 0 when no previous data exists
  - Update high score in localStorage when current score exceeds it
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Write property test for score storage round trip
  - **Property 1: Score storage round trip**
  - **Validates: Requirements 1.1, 1.2**

- [x]* 1.2 Write property test for high score monotonic increase
  - **Property 2: High score monotonic increase**
  - **Validates: Requirements 1.3**

- [x]* 1.3 Write property test for game over display completeness
  - **Property 3: Game over display completeness**
  - **Validates: Requirements 1.4**

- [x] 2. Create base Particle System and Particle class
  - Implement base Particle class with x, y, vx, vy, life, maxLife, color, size properties
  - Add update(), draw(), and isDead() methods to Particle class
  - Create ParticleSystem class to manage particle array
  - Implement addParticle(), update(), draw(), and cleanup() methods
  - Add maximum particle limit (500) with enforcement
  - Integrate particle system update and render into main game loop
  - _Requirements: 2.3, 3.4, 4.4, 5.4_

- [x]* 2.1 Write property test for particle lifecycle cleanup
  - **Property 4: Particle lifecycle cleanup**
  - **Validates: Requirements 2.3, 3.4, 4.4, 5.4**

- [x]* 2.2 Write property test for particle physics motion
  - **Property 8: Particle physics motion**
  - **Validates: Requirements 3.3, 5.3**

- [x] 3. Implement Trail and Explosion particle effects
  - Create TrailParticle class extending Particle with no velocity and opacity fade
  - Implement trail particle generation at Kiro's position every 2-3 frames during gameplay
  - Add purple color (#790ECB) to trail particles
  - Create ExplosionParticle class with random directional velocities and gravity
  - Implement explosion particle generation at collision position with 15-20 particles
  - Use red, orange, yellow colors for explosion particles
  - Trigger explosion effect in gameOver() function
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x]* 3.1 Write property test for trail particle opacity decay
  - **Property 5: Trail particle opacity decay**
  - **Validates: Requirements 2.2**

- [x]* 3.2 Write property test for trail particle position invariance
  - **Property 6: Trail particle position invariance**
  - **Validates: Requirements 2.4**

- [x]* 3.3 Write property test for explosion particle directional emission
  - **Property 7: Explosion particle directional emission**
  - **Validates: Requirements 3.2**

- [x] 4. Implement Sparkle particle effects for obstacle passing
  - Create SparkleParticle class with random velocities and twinkling opacity effect
  - Implement sparkle particle generation at gap center when obstacle is passed
  - Generate 8-12 sparkle particles per obstacle pass
  - Use bright colors (white, yellow, cyan) for sparkle particles
  - Add pulsing opacity calculation based on particle life
  - Trigger sparkle effect when obstacle.passed becomes true
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x]* 4.1 Write property test for sparkle particle velocity variety
  - **Property 9: Sparkle particle velocity variety**
  - **Validates: Requirements 4.2**

- [x]* 4.2 Write property test for sparkle particle opacity variation
  - **Property 10: Sparkle particle opacity variation**
  - **Validates: Requirements 4.3**

- [x] 5. Implement Confetti particle effects for new high scores
  - Create ConfettiParticle class with gravity, rotation, and rotationSpeed properties
  - Implement confetti particle generation across screen when new high score achieved
  - Generate 30-50 confetti particles with random colors including purple (#790ECB)
  - Add rectangular shape rendering with rotation
  - Apply gravity and rotation to confetti particles in update method
  - Remove confetti particles when they fall below canvas boundary
  - Trigger confetti effect when current score exceeds high score
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5.1 Write property test for confetti particle color variety
  - **Property 11: Confetti particle color variety**
  - **Validates: Requirements 5.2, 5.5**

- [x]* 5.2 Write property test for confetti particle rotation
  - **Property 12: Confetti particle rotation**
  - **Validates: Requirements 5.3**

- [x]* 5.3 Write property test for new high score triggers confetti
  - **Property 13: New high score triggers confetti**
  - **Validates: Requirements 5.1**

- [x] 6. Final checkpoint - Ensure all features work together
  - Ensure all tests pass, ask the user if questions arise
  - Verify score persistence works across browser sessions
  - Verify all particle effects trigger at correct game events
  - Test performance with maximum particle count
  - Verify visual effects enhance game feel without impacting performance
