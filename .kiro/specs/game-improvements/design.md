# Design Document

## Overview

This design document outlines the implementation of sound effects, character selection, level progression, meteor obstacles, and power-up systems for the Flappy Kiro game. The enhancements maintain the existing game architecture while adding new systems that integrate seamlessly with current gameplay mechanics.

## Architecture

The improvements follow a modular architecture:

1. **Audio Manager Module**: Handles all sound effect and music playback using Web Audio API
2. **Character System**: Manages character selection, storage, and rendering
3. **Level Manager**: Controls level progression, difficulty scaling, and visual themes
4. **Meteor System**: Manages meteor obstacle spawning, physics, and rendering
5. **Power-up System**: Handles power-up spawning, collection, effects, and timers

All systems integrate with the existing game loop and state management without disrupting current functionality.

## Components and Interfaces

### Audio Manager

```javascript
const AudioManager = {
    sounds: {},
    music: null,
    muted: false,
    
    // Load audio files
    loadSound(name: string, url: string): void
    
    // Play a sound effect
    playSound(name: string, volume: number): void
    
    // Play background music
    playMusic(url: string, loop: boolean): void
    
    // Stop all audio
    stopAll(): void
    
    // Toggle mute
    toggleMute(): void
}
```

**Sound Files Needed:**
- `move.mp3` - Subtle whoosh for movement
- `collect.mp3` - Success chime for collecting items
- `explosion.mp3` - Crash sound for collisions
- `score.mp3` - Ding for passing obstacles
- `highscore.mp3` - Celebration fanfare
- `powerup.mp3` - Power-up collection sound
- `music.mp3` - Background music loop

### Character System

```javascript
const CharacterManager = {
    characters: [
        { id: 'kiro', name: 'Kiro', sprite: 'kiro-logo.png', color: '#790ECB' },
        { id: 'bird', name: 'Angry Bird', sprite: 'AngryBird.png', color: '#FF4444' },
        { id: 'star', name: 'Star', sprite: 'star.png', color: '#FFFF44' }
    ],
    selectedCharacter: null,
    
    // Get selected character
    getSelected(): Character
    
    // Set selected character
    setSelected(id: string): void
    
    // Save to localStorage
    saveSelection(): void
    
    // Load from localStorage
    loadSelection(): void
}

function drawCharacterSelection(): void
```

### Level Manager

```javascript
const LevelManager = {
    currentLevel: 1,
    levels: [
        { 
            number: 1, 
            scoreThreshold: 0, 
            obstacleSpeed: 0.9, 
            spawnInterval: 250,
            theme: { bg: 'dark', accent: '#790ECB' }
        },
        { 
            number: 2, 
            scoreThreshold: 10, 
            obstacleSpeed: 1.1, 
            spawnInterval: 200,
            theme: { bg: 'blue', accent: '#4444FF' }
        },
        { 
            number: 3, 
            scoreThreshold: 25, 
            obstacleSpeed: 1.3, 
            spawnInterval: 180,
            theme: { bg: 'red', accent: '#FF4444' }
        }
    ],
    
    // Check and update level based on score
    updateLevel(score: number): void
    
    // Get current level config
    getCurrentLevel(): Level
    
    // Apply level settings
    applyLevelSettings(): void
    
    // Show level transition
    showLevelTransition(level: number): void
}
```

### Meteor System

```javascript
class Meteor {
    x: number
    y: number
    width: number
    height: number
    velocityY: number
    rotation: number
    rotationSpeed: number
    
    update(): void
    draw(ctx: CanvasRenderingContext2D): void
    isOffScreen(): boolean
}

const MeteorManager = {
    meteors: Meteor[]
    spawnChance: number
    
    spawn(): void
    update(): void
    draw(ctx: CanvasRenderingContext2D): void
    checkCollisions(player: Player): boolean
    clear(): void
}
```

### Power-up System

```javascript
class PowerUp {
    x: number
    y: number
    width: number
    height: number
    type: 'speed' | 'shield'
    velocityX: number
    
    update(): void
    draw(ctx: CanvasRenderingContext2D): void
    isOffScreen(): boolean
}

const PowerUpManager = {
    powerUps: PowerUp[]
    activePowerUp: { type: string, duration: number } | null
    spawnInterval: number
    lastSpawn: number
    
    spawn(): void
    update(): void
    draw(ctx: CanvasRenderingContext2D): void
    collect(powerUp: PowerUp): void
    applyEffect(type: string): void
    removeEffect(): void
    drawActiveIndicator(ctx: CanvasRenderingContext2D): void
}
```

## Data Models

### Character Data

```javascript
{
    id: string,           // Unique identifier
    name: string,         // Display name
    sprite: string,       // Image file path
    color: string         // Theme color for particles
}
```

### Level Data

```javascript
{
    number: number,       // Level number (1, 2, 3)
    scoreThreshold: number, // Score needed to reach this level
    obstacleSpeed: number,  // Speed multiplier for obstacles
    spawnInterval: number,  // Frames between obstacle spawns
    theme: {
        bg: string,       // Background theme name
        accent: string    // Accent color hex
    }
}
```

### Power-up Data

```javascript
{
    type: 'speed' | 'shield',
    duration: number,     // Duration in milliseconds
    effect: {
        speedMultiplier?: number,
        invincible?: boolean
    }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Character System Properties

Property 1: Character selection persistence round trip
*For any* valid character ID, selecting it, saving to localStorage, and loading should return the same character ID
**Validates: Requirements 2.4, 2.5**

Property 2: Character sprite application
*For any* selected character, the game should render using that character's sprite image
**Validates: Requirements 2.3**

Property 3: Character display completeness
*For any* character in the system, it should have a name, sprite path, and theme color defined
**Validates: Requirements 2.6**

Property 4: Trail color synchronization
*For any* character selection, the trail particle color should match the character's theme color
**Validates: Requirements 2.7**

### Level Progression Properties

Property 5: Level transition background change
*For any* level transition, the background theme should change to the new level's theme
**Validates: Requirements 3.3**

Property 6: Difficulty scaling on level up
*For any* level transition, the obstacle speed should increase from the previous level
**Validates: Requirements 3.4**

Property 7: Level transition notification
*For any* level transition, a transition message should be displayed to the player
**Validates: Requirements 3.5**

### Meteor System Properties

Property 8: Meteor horizontal position variety
*For any* set of meteor spawns, the horizontal positions should vary randomly
**Validates: Requirements 4.2**

Property 9: Meteor downward motion
*For any* meteor, after one update cycle, its y position should be greater than before
**Validates: Requirements 4.3**

Property 10: Meteor rotation animation
*For any* meteor with rotation speed r, after one update cycle, its rotation should increase by r
**Validates: Requirements 4.4**

Property 11: Meteor collision detection
*For any* meteor and player with overlapping bounds, a collision should be detected
**Validates: Requirements 4.5**

Property 12: Meteor cleanup on exit
*For any* meteor with y position greater than canvas height, it should be removed from the active meteors array
**Validates: Requirements 4.6**

### Power-up System Properties

Property 13: Power-up type variety
*For any* set of power-up spawns, both Speed Boost and Shield types should appear
**Validates: Requirements 5.2**

Property 14: Power-up timer countdown
*For any* active power-up, the remaining duration should decrease over time
**Validates: Requirements 5.6**

Property 15: Power-up effect removal on expiration
*For any* power-up that expires, player abilities should return to their base values
**Validates: Requirements 5.7**

Property 16: Power-up cleanup on exit
*For any* power-up that moves off-screen, it should be removed from the active power-ups array
**Validates: Requirements 5.9**

Property 17: Shield collision protection
*For any* collision event while shield is active, the game should not trigger game over
**Validates: Requirements 5.10**

## Error Handling

### Audio System Errors
- Gracefully handle audio file loading failures
- Continue gameplay without audio if Web Audio API is unavailable
- Catch and log audio playback errors without crashing
- Provide visual-only feedback if audio fails

### Character System Errors
- Default to Kiro character if localStorage is corrupted
- Validate character IDs before applying selection
- Handle missing sprite images with fallback rectangles
- Catch localStorage quota errors

### Level System Errors
- Validate level thresholds are in ascending order
- Cap level at maximum if score exceeds all thresholds
- Handle missing level configurations with defaults
- Prevent negative or invalid difficulty values

### Meteor System Errors
- Limit maximum active meteors to prevent performance issues
- Validate meteor spawn positions are within canvas bounds
- Handle collision detection edge cases
- Clean up meteors if array grows too large

### Power-up System Errors
- Prevent multiple power-ups of same type from stacking
- Validate power-up durations are positive
- Handle timer edge cases (negative values, NaN)
- Clean up expired power-ups properly

## Testing Strategy

### Unit Testing

**Audio Manager Tests:**
- Test sound loading and playback
- Test mute/unmute functionality
- Test error handling for missing files

**Character Manager Tests:**
- Test character selection and persistence
- Test localStorage save/load operations
- Test character data validation

**Level Manager Tests:**
- Test level progression thresholds
- Test difficulty scaling calculations
- Test level reset functionality

**Meteor System Tests:**
- Test meteor spawning logic
- Test meteor physics updates
- Test collision detection

**Power-up System Tests:**
- Test power-up spawning intervals
- Test effect application and removal
- Test timer countdown logic

### Property-Based Testing

We will use **fast-check** library for JavaScript property-based testing. Each property test will run a minimum of 100 iterations.

**Property Tests to Implement:**
1. Character selection persistence round trip (Property 1)
2. Character sprite application (Property 2)
3. Character display completeness (Property 3)
4. Trail color synchronization (Property 4)
5. Level transition background change (Property 5)
6. Difficulty scaling on level up (Property 6)
7. Level transition notification (Property 7)
8. Meteor horizontal position variety (Property 8)
9. Meteor downward motion (Property 9)
10. Meteor rotation animation (Property 10)
11. Meteor collision detection (Property 11)
12. Meteor cleanup on exit (Property 12)
13. Power-up type variety (Property 13)
14. Power-up timer countdown (Property 14)
15. Power-up effect removal on expiration (Property 15)
16. Power-up cleanup on exit (Property 16)
17. Shield collision protection (Property 17)

### Integration Testing

- Test audio system integration with game events
- Test character selection flow from selection screen to gameplay
- Test level progression during actual gameplay
- Test meteor spawning and collision in Level 3
- Test power-up collection and effect application
- Test multiple systems working together (e.g., shield protecting from meteors)

## Performance Considerations

### Audio Optimization
- Preload all audio files during game initialization
- Use audio sprite sheets for small sound effects
- Limit concurrent sound effects to 5 maximum
- Use Web Audio API for better performance than HTML5 Audio

### Character System Optimization
- Cache character sprites after loading
- Minimize localStorage reads/writes
- Use single character selection state variable

### Level System Optimization
- Calculate level once per score change, not every frame
- Cache level configuration objects
- Use efficient theme switching without full redraws

### Meteor System Optimization
- Limit maximum active meteors to 10
- Use object pooling for meteor instances
- Remove off-screen meteors immediately
- Optimize collision detection with spatial partitioning

### Power-up System Optimization
- Limit maximum active power-ups to 3
- Use object pooling for power-up instances
- Update timers efficiently without creating new objects
- Cache power-up effect calculations

## Implementation Notes

### Audio System
- Use Web Audio API for better control and performance
- Implement audio context resume on user interaction (browser requirement)
- Provide mute button in UI
- Consider using Howler.js library for cross-browser compatibility

### Character System
- Create character selection screen as separate game state
- Use grid layout for character display
- Highlight selected character with border/glow
- Allow keyboard navigation (arrow keys + Enter)

### Level System
- Implement smooth transitions with fade effects
- Display level number prominently during transition
- Gradually increase difficulty rather than sudden jumps
- Consider adding level-specific visual themes

### Meteor System
- Meteors should have fire trail particles
- Use rotation for visual interest
- Vary meteor sizes for variety
- Consider adding warning indicators before spawn

### Power-up System
- Use distinct icons for each power-up type
- Animate power-ups (floating, pulsing)
- Display active power-up icon in HUD
- Show countdown timer visually (progress bar or number)
- Stack multiple different power-ups if collected

## Browser Compatibility

- Web Audio API supported in all modern browsers
- localStorage supported universally
- Canvas 2D context widely supported
- Test on Chrome, Firefox, Safari, Edge
- Provide fallbacks for older browsers where possible
