# Design Document

## Overview

This design document outlines the implementation of score persistence and visual effects for the Flappy Kiro game. The enhancements include a localStorage-based score tracking system and a particle system for rendering trail, explosion, sparkle, and confetti effects. The design maintains the existing game architecture while adding modular components that integrate seamlessly with the current game loop.

## Architecture

The enhancements follow a modular architecture that extends the existing game without disrupting current functionality:

1. **Score Manager Module**: Handles all score persistence operations using localStorage API
2. **Particle System Module**: Manages particle lifecycle (creation, update, rendering, cleanup)
3. **Particle Types**: Individual particle implementations (Trail, Explosion, Sparkle, Confetti)
4. **Game Loop Integration**: Hooks into existing update and render cycles

The particle system uses an object-oriented approach where each particle type is a class with common methods (update, draw, isDead) but unique behaviors.

## Components and Interfaces

### Score Manager

```javascript
const ScoreManager = {
    HIGH_SCORE_KEY: 'flappyKiroHighScore',
    
    // Get high score from localStorage
    getHighScore(): number
    
    // Save high score to localStorage
    saveHighScore(score: number): void
    
    // Check if current score is a new high score
    isNewHighScore(currentScore: number, highScore: number): boolean
}
```

### Particle System

```javascript
class ParticleSystem {
    particles: Particle[]
    
    // Add particle to the system
    addParticle(particle: Particle): void
    
    // Update all particles
    update(): void
    
    // Render all particles
    draw(ctx: CanvasRenderingContext2D): void
    
    // Remove dead particles
    cleanup(): void
    
    // Create specific particle effects
    createTrail(x: number, y: number): void
    createExplosion(x: number, y: number): void
    createSparkles(x: number, y: number): void
    createConfetti(): void
}
```

### Base Particle Interface

```javascript
class Particle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
    color: string
    size: number
    
    // Update particle state
    update(): void
    
    // Render particle
    draw(ctx: CanvasRenderingContext2D): void
    
    // Check if particle should be removed
    isDead(): boolean
}
```

### Particle Type Implementations

**TrailParticle**: Small particles that spawn at Kiro's position, fade out over time
- No velocity (stays in place)
- Purple color (#790ECB)
- Fades from full opacity to transparent
- Short lifespan (20-30 frames)

**ExplosionParticle**: Particles that burst outward from collision point
- Random velocity in all directions
- Affected by gravity
- Multiple colors (red, orange, yellow)
- Medium lifespan (40-60 frames)

**SparkleParticle**: Twinkling particles at obstacle gap
- Small random velocity
- Bright colors (white, yellow, cyan)
- Pulsing opacity effect
- Short lifespan (30-40 frames)

**ConfettiParticle**: Falling particles with rotation
- Downward velocity with slight horizontal drift
- Affected by gravity
- Multiple vibrant colors including purple
- Rectangular shape with rotation
- Long lifespan (120-180 frames)

## Data Models

### High Score Storage

```javascript
// localStorage structure
{
    "flappyKiroHighScore": number  // Integer representing highest score achieved
}
```

### Particle Data Structure

```javascript
{
    x: number,           // X position on canvas
    y: number,           // Y position on canvas
    vx: number,          // X velocity
    vy: number,          // Y velocity
    life: number,        // Current life remaining (frames)
    maxLife: number,     // Maximum life (frames)
    color: string,       // CSS color string
    size: number,        // Particle size in pixels
    rotation?: number,   // Rotation angle (confetti only)
    rotationSpeed?: number  // Rotation velocity (confetti only)
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Score Persistence Properties

Property 1: Score storage round trip
*For any* valid score value, storing it to localStorage and then retrieving it should return the same score value
**Validates: Requirements 1.1, 1.2**

Property 2: High score monotonic increase
*For any* current score that exceeds the high score, updating the high score should result in localStorage containing the new higher value
**Validates: Requirements 1.3**

Property 3: Game over display completeness
*For any* game over state with current score and high score, the rendered game over screen should contain both score values
**Validates: Requirements 1.4**

### Particle System Properties

Property 4: Particle lifecycle cleanup
*For any* particle type (trail, explosion, sparkle, confetti), when the particle's life reaches zero, it should be removed from the particle system's rendering queue
**Validates: Requirements 2.3, 3.4, 4.4, 5.4**

Property 5: Trail particle opacity decay
*For any* trail particle, as its life decreases from maxLife to zero, its opacity should decrease proportionally from 1.0 to 0.0
**Validates: Requirements 2.2**

Property 6: Trail particle position invariance
*For any* trail particle spawned at position (x, y), after any number of update cycles, the particle's position should remain (x, y)
**Validates: Requirements 2.4**

Property 7: Explosion particle directional emission
*For any* explosion effect, the generated particles should have velocity vectors pointing in multiple different directions from the explosion center
**Validates: Requirements 3.2**

Property 8: Particle physics motion
*For any* particle with velocity (vx, vy) and gravity g, after one update cycle, the particle's position should change by (vx, vy) and vy should increase by g
**Validates: Requirements 3.3, 5.3**

Property 9: Sparkle particle velocity variety
*For any* sparkle effect generation, the created particles should have different velocity vectors
**Validates: Requirements 4.2**

Property 10: Sparkle particle opacity variation
*For any* sparkle particle, its opacity should vary over its lifetime creating a twinkling effect
**Validates: Requirements 4.3**

Property 11: Confetti particle color variety
*For any* confetti effect generation, the created particles should include multiple different colors including the Kiro brand purple (#790ECB)
**Validates: Requirements 5.2, 5.5**

Property 12: Confetti particle rotation
*For any* confetti particle with rotation speed r, after one update cycle, the particle's rotation angle should increase by r
**Validates: Requirements 5.3**

Property 13: New high score triggers confetti
*For any* game state where current score exceeds high score, confetti particles should be generated
**Validates: Requirements 5.1**

## Error Handling

### localStorage Errors
- Gracefully handle localStorage quota exceeded errors
- Fallback to in-memory high score if localStorage is unavailable
- Handle corrupted localStorage data by resetting to default values

### Particle System Errors
- Limit maximum particle count to prevent performance degradation (max 500 particles)
- Skip particle generation if system is at capacity
- Handle invalid particle parameters with default values

### Canvas Rendering Errors
- Validate canvas context exists before particle rendering
- Handle missing color values with fallback colors
- Catch and log rendering exceptions without crashing game loop

## Testing Strategy

### Unit Testing

We will use minimal unit tests focused on critical functionality:

**Score Manager Tests:**
- Test localStorage save and retrieve operations
- Test high score comparison logic
- Test initialization with no existing data

**Particle System Tests:**
- Test particle creation methods
- Test particle cleanup removes dead particles
- Test maximum particle limit enforcement

**Individual Particle Tests:**
- Test each particle type's update method
- Test particle isDead() method
- Test particle color and size initialization

### Property-Based Testing

We will use **fast-check** library for JavaScript property-based testing. Each property test will run a minimum of 100 iterations.

**Configuration:**
```javascript
import fc from 'fast-check';

// Configure to run 100 iterations per property
fc.assert(property, { numRuns: 100 });
```

**Property Test Requirements:**
- Each property-based test MUST be tagged with a comment referencing the design document property
- Tag format: `// Feature: game-enhancements, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test
- Tests should generate random but valid inputs (scores, positions, particle counts)

**Property Tests to Implement:**
1. Score storage round trip (Property 1)
2. High score monotonic increase (Property 2)
3. Game over display completeness (Property 3)
4. Particle lifecycle cleanup (Property 4)
5. Trail particle opacity decay (Property 5)
6. Trail particle position invariance (Property 6)
7. Explosion particle directional emission (Property 7)
8. Particle physics motion (Property 8)
9. Sparkle particle velocity variety (Property 9)
10. Sparkle particle opacity variation (Property 10)
11. Confetti particle color variety (Property 11)
12. Confetti particle rotation (Property 12)
13. New high score triggers confetti (Property 13)

### Integration Testing

- Test particle system integration with game loop
- Test score manager integration with game state transitions
- Test visual effects trigger at correct game events
- Test performance with maximum particle count

## Performance Considerations

### Particle System Optimization
- Use object pooling for frequently created/destroyed particles
- Limit particle count to 500 maximum
- Remove particles immediately when off-screen or dead
- Use requestAnimationFrame for smooth 60 FPS rendering

### localStorage Optimization
- Minimize localStorage writes (only on high score change)
- Cache high score in memory during gameplay
- Use synchronous localStorage API (acceptable for single value)

### Rendering Optimization
- Batch particle rendering by type
- Use canvas globalAlpha for opacity instead of rgba colors
- Avoid unnecessary canvas state changes
- Clear only particle regions if possible (or full screen clear)

## Implementation Notes

### Particle System Architecture
The particle system should be implemented as a singleton that manages all particle types. Each particle type should extend a base Particle class to ensure consistent interface.

### Game Loop Integration
Particles should be updated and rendered in the existing game loop:
1. Update particles before collision detection
2. Render particles after obstacles but before UI
3. Trigger particle effects in response to game events

### Visual Polish
- Trail particles should spawn every 2-3 frames for smooth trail
- Explosion should create 15-20 particles for satisfying effect
- Sparkles should create 8-12 particles for celebratory feel
- Confetti should create 30-50 particles for dramatic effect
- Use easing functions for particle opacity/size changes

### Browser Compatibility
- localStorage is supported in all modern browsers
- Canvas 2D context is widely supported
- No external dependencies required for particle system
- Fallback to in-memory storage if localStorage unavailable
