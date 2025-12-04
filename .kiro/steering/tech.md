# Technology Stack

## Core Technologies
- **HTML5** - Structure and canvas element
- **Vanilla JavaScript** - Game logic and rendering
- **Canvas API** - 2D graphics rendering
- **CSS3** - Styling and layout

## Architecture
- Single-page application with no build system
- Direct browser execution (no compilation required)
- Client-side only (no backend)

## Key Libraries & APIs
- HTML5 Canvas 2D Context for rendering
- RequestAnimationFrame for game loop
- Image API for sprite loading

## Running the Game
```bash
# Option 1: Open directly in browser
open index.html

# Option 2: Use a local server (recommended for image loading)
python3 -m http.server 8000
# Then navigate to http://localhost:8000

# Option 3: Use Node.js http-server
npx http-server -p 8000
```

## Development Workflow
- No build step required
- Edit files and refresh browser to see changes
- Browser DevTools for debugging (Console, Network, Performance)
- Target 60 FPS for smooth gameplay

## Browser Compatibility
- Modern browsers with HTML5 Canvas support
- Chrome, Firefox, Safari, Edge (latest versions)
