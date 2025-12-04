# Project Structure

## File Organization

```
.
├── .kiro/                      # Kiro IDE configuration
│   └── steering/               # AI assistant guidance files
│       ├── app-building-rules.md
│       ├── game-style-guide.md
│       ├── product.md
│       ├── structure.md
│       └── tech.md
├── .vscode/                    # VS Code settings
├── index.html                  # Main HTML entry point
├── game.js                     # Core game logic
└── kiro-logo.png              # Game sprite asset
```

## File Responsibilities

### index.html
- Canvas element setup (400x600px)
- Basic styling (dark theme, centered layout)
- Kiro brand colors (#790ECB purple)
- Script loading

### game.js
- Game constants (gravity, speeds, dimensions)
- Game state management (start, playing, gameOver)
- Player character (Kiro) logic and rendering
- Obstacle generation and collision detection
- Input handling (keyboard and mouse)
- Game loop using requestAnimationFrame
- UI rendering (score, start screen, game over screen)

### kiro-logo.png
- Player sprite image
- Used as the main character in the game
- Fallback to purple rectangle if image fails to load

## Code Organization Patterns

### Game State
- Centralized state management with `gameState` variable
- Three states: 'start', 'playing', 'gameOver'
- State-based rendering and update logic

### Game Objects
- Player object (`kiro`) with position, velocity, and methods
- Obstacle array with dynamic creation and removal
- Object-oriented approach for game entities

### Rendering Pipeline
1. Clear background
2. Update game state (if playing)
3. Draw obstacles
4. Draw player
5. Draw UI overlays
6. Request next frame

## Conventions
- Constants in UPPER_SNAKE_CASE
- camelCase for variables and functions
- Inline comments for complex logic
- Kiro brand colors for UI elements (#790ECB purple, #0a0a0a black)
