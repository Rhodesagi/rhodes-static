# The Musket Duellers

A 2-player split-screen musket dueling game with iron sight aiming.

## Features
- Split-screen 2-player gameplay on one computer
- Iron sight aiming (no crosshairs!)
- Simplified but tactile musket reloading (9 steps)
- Ballistic physics with drop
- Muzzle flash and smoke effects
- Diegetic UI (minimal overlays)

## Controls

### Player 1 (Green Coat)
- **WASD** - Move
- **Q/E** - Adjust aim angle
- **LEFT SHIFT** - Iron sights (hold)
- **SPACE** - Fire
- **R** - Start reload sequence

### Player 2 (Red Coat)  
- **ARROW KEYS** - Move
- **COMMA/PERIOD (, .)** - Adjust aim angle
- **RIGHT SHIFT** - Iron sights (hold)
- **ENTER** - Fire
- **P** - Start reload sequence

## Reloading Steps
1. Bite cartridge
2. Prime pan
3. Pour powder
4. Insert ball
5. Ram home
6. Return ramrod
7. Half-cock
8. Prime again
9. Full cock

Each step takes time - find cover!

## Installation
```bash
pip install -r requirements.txt
python game.py
```

## Notes
- The game uses keyboard controls for both players
- For true dual-mouse support, consider MouseMux or similar software
- Iron sights zoom the view and improve accuracy
- Watch the ballistic drop on long shots!
