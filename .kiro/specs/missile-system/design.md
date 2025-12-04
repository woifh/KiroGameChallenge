# Design Document

## Overview

This design document outlines the implementation of a missile firing system for the Flappy Kiro game. The system allows players to fire projectiles at angry birds using the Spacebar key, with cooldown and maximum missile limits to maintain game balance. The design integrates with the existing game architecture and particle system.

## Architecture

The missile system follows a modular architecture:

1. **Missile Class**: Represents individual missile projectiles with position, velocity, and rendering
2. **Missile Manager**: Handles missile creation, updates, collision detection, and cleanup
3. **Cooldown System**: Tracks firing cooldown timer and enforces rate limiting
4. **Input Handler**: Processes Spacebar input and validates firing conditions
5. **Collision System**: Detects missile-bird intersections and handles removal

The system integrates with existing game components:
- Uses the existing ParticleSystem for explosion effects
- Integrates with the angry bird system for collision detection
- Uses the existing score system for bonus points
- Follows the existing game loop pattern for updates and rendering

## Components and Interfaces

### Missile Class

```javascript
class Missile {
    x: number
    y: number
    width: number
    height: number
    velocityX: number
    color: string
    
    constructor(x: number, y: number)
    update(): void
    draw(ctx: CanvasRenderingContext2D): void
    isOffScreen(canvasWidth: number): boolean
    getBounds(): { x: number, y: number, width: number, height: number }
}
```

### Missile Manager

```javascript
const MissileManager = {
    missiles: Missile[]
    cooldown: number
    maxMissiles: number
    cooldownDuration: number
    missileSpeed: number
    scoreBonus: number
    
    // Fire a new missile
    fire(playerX: number, playerY: number): boolean
    
    // Update all missiles
    update(deltaTime: number): void
    
    // Draw all missiles
    draw(ctx: CanvasRenderingContext2D): void
    
    // Check collisions with angry bird
    checkCollision(bird: AngryBird): boolean
    
    // Remove off-screen missiles
    cleanup(canvasWidth: number): void
    
    // Check if can fire
    canFire(): boolean
    
    // Get active missile count
    getCount(): number
    
    // Reset system
    reset(): void
}
```

### Input Integration

```javascript
// Add to existing keydown handler
if (e.code === 'Space' && gameState === 'playing') {
    e.preventDefault();
    MissileManager.fire(kiro.x + kiro.width, kiro.y + kiro.height / 2);
}
```

## Data Models

### Missile Data

```javascript
{
    x: number,              // Horizontal position
    y: number,              // Vertical position
    width: number,          // Missile width (default: 20)
    height: number,         // Missile height (default: 5)
    velocityX: number,      // Horizontal speed (default: 8)
    color: string           // Visual color (default: '#FFAA00')
}
```

### Missile Manager State

```javascript
{
    missiles: Missile[],           // Active missiles array
    cooldown: number,              // Current cooldown in ms (0 = ready)
    maxMissiles: number,           // Maximum active missiles (5)
    cooldownDuration: number,      // Cooldown period in ms (500)
    missileSpeed: number,          // Missile velocity (8 pixels/frame)
    scoreBonus: number             // Points for hitting bird (10)
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Missile Creation Properties

Property 1: Missile creation at player position
*For any* valid fire action when cooldown is inactive and missile count is below max, a new missile should be created at the player character's position
**Validates: Requirements 1.1**

Property 2: Cooldown enforcement on firing
*For any* missile firing event, the cooldown timer should be set to 500ms and prevent additional firing until it reaches zero
**Validates: Requirements 2.1, 2.2**

Property 3: Maximum missile limit
*For any* game state with 5 or more active missiles, attempting to fire should not create a new missile
**Validates: Requirements 2.4**

### Missile Physics Properties

Property 4: Missile horizontal motion
*For any* missile, after one update cycle, its x position should increase by the missile velocity value
**Validates: Requirements 1.2**

Property 5: Missile cleanup on exit
*For any* missile with x position greater than canvas width, it should be removed from the active missiles array
**Validates: Requirements 1.3**

### Collision Properties

Property 6: Missile-bird collision removal
*For any* missile and angry bird with overlapping bounds, both should be removed from their respective arrays
**Validates: Requirements 1.4**

Property 7: Collision score bonus
*For any* missile-bird collision, the player score should increase by the defined bonus amount
**Validates: Requirements 1.6**

Property 8: Collision explosion effect
*For any* missile-bird collision, explosion particles should be created at the collision location
**Validates: Requirements 1.5, 3.4**

### Cooldown Properties

Property 9: Cooldown countdown
*For any* active cooldown greater than zero, after one update cycle with deltaTime, the cooldown should decrease by deltaTime
**Validates: Requirements 2.1**

Property 10: Cooldown expiration enables firing
*For any* cooldown that reaches zero, the next fire attempt with valid conditions should create a missile
**Validates: Requirements 2.3**

Property 11: Missile limit release
*For any* game state where active missile count drops below 5 and cooldown is zero, firing should create a new missile
**Validates: Requirements 2.5**

### Visual Feedback Properties

Property 12: Missile rendering
*For any* active missile, it should be drawn on the canvas with defined visual properties (position, size, color)
**Validates: Requirements 3.1**

Property 13: Missile count display
*For any* game state, the UI should display the current count of active missiles
**Validates: Requirements 3.5**

## Error Handling

### Input Validation
- Ignore fire attempts when game is not in 'playing' state
- Validate player position before creating missile
- Handle rapid key presses gracefully with cooldown

### Missile Management
- Limit maximum missiles to prevent performance issues
- Clean up missiles immediately when off-screen
- Handle edge cases where missile array is empty

### Collision Detection
- Validate bird and missile objects exist before checking collision
- Handle simultaneous collisions (multiple missiles hitting same bird)
- Prevent null reference errors during removal

### Cooldown System
- Ensure cooldown never goes negative
- Handle frame rate variations with deltaTime
- Reset cooldown properly on game restart

## Testing Strategy

### Unit Testing

**Missile Class Tests:**
- Test missile creation with valid parameters
- Test missile update increments position correctly
- Test isOffScreen detection
- Test getBounds returns correct collision box

**Missile Manager Tests:**
- Test fire creates missile when conditions are met
- Test fire respects cooldown
- Test fire respects max missile limit
- Test collision detection with birds
- Test cleanup removes off-screen missiles
- Test reset clears all state

### Property-Based Testing

We will use **fast-check** library for JavaScript property-based testing. Each property test will run a minimum of 100 iterations.

**Property Tests to Implement:**
1. Missile creation at player position (Property 1)
2. Cooldown enforcement on firing (Property 2)
3. Maximum missile limit (Property 3)
4. Missile horizontal motion (Property 4)
5. Missile cleanup on exit (Property 5)
6. Missile-bird collision removal (Property 6)
7. Collision score bonus (Property 7)
8. Collision explosion effect (Property 8)
9. Cooldown countdown (Property 9)
10. Cooldown expiration enables firing (Property 10)
11. Missile limit release (Property 11)
12. Missile rendering (Property 12)
13. Missile count display (Property 13)

### Integration Testing

- Test missile system with actual gameplay
- Test missile firing during character movement
- Test collision with moving angry birds
- Test cooldown UI updates in real-time
- Test missile system reset on game over
- Test performance with maximum missiles active

## Performance Considerations

### Missile Optimization
- Limit maximum active missiles to 5
- Remove off-screen missiles immediately
- Use simple rectangular collision detection
- Avoid creating missiles when limit is reached

### Rendering Optimization
- Use simple rectangle rendering for missiles
- Batch missile rendering in single draw call
- Cache missile color values
- Minimize canvas state changes

### Collision Optimization
- Only check collisions for active missiles and birds
- Use early exit when no birds are present
- Use bounding box collision (fast and sufficient)
- Remove both objects immediately on collision

## Implementation Notes

### Missile Visual Design
- Simple rectangular projectile (20x5 pixels)
- Bright orange color (#FFAA00) for visibility
- Optional: Add glow effect using shadowBlur
- Optional: Add trail particles for visual polish

### Cooldown Feedback
- Display cooldown bar below player
- Use color coding (red = cooling down, green = ready)
- Show remaining time numerically
- Pulse effect when ready to fire

### Sound Effects
- Firing sound: Short "pew" or "whoosh"
- Hit sound: Explosion or impact sound
- Reuse existing explosion sound if available

### Score Balance
- 10 points per bird hit with missile
- Same as collecting bird normally (5 points)
- Bonus encourages active engagement
- Cooldown prevents spam for easy points

## Browser Compatibility

- Uses standard Canvas 2D API (widely supported)
- Keyboard event handling (universal support)
- No special browser features required
- Tested on Chrome, Firefox, Safari, Edge
