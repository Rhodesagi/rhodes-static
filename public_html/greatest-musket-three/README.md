# Greatest Musket Three

A complete 2-player split-screen first-person shooter musket duel game with authentic iron sight aiming and full flintlock reload sequence.

## Play Now
**Live URL:** https://rhodesagi.com/user-sites/greatest-musket-three/

## Features

### Core Mechanics
- **Split-screen multiplayer** - Two players on one computer
- **Iron sight aiming only** - No crosshairs. Align rear notch with front post
- **Q/E musket rotation** - Rotate musket around longitudinal axis for windage adjustment
- **Five-stage flintlock reload**:
  1. Priming the pan (1.0s)
  2. Loading powder (1.2s)
  3. Patching ball (1.5s)
  4. Ramming (2.0s)
  5. Cocking hammer (0.8s)

### Controls

**Player 1 (Left Screen):**
- `WASD` - Move
- `Mouse` - Look
- `X` - Toggle iron sights
- `Q/E` - Rotate musket left/right
- `F` - Fire (must be aiming, loaded, cocked, and pan primed)
- `R` - Reload (cannot aim during reload)

**Player 2 (Right Screen):**
- `IJKL` - Move
- `Arrow Keys` - Look
- `Shift` - Toggle iron sights
- `U/O` - Rotate musket left/right
- `Enter` - Fire
- `Backspace` - Reload

### Technical Implementation
- Built with Three.js (WebGL)
- Authentic iron sight raycasting from eye → rear sight → front post
- Proper Q/E rotation affects shot trajectory
- Player layer collision separation
- Respawn on death with full reload required

### Files Included
- `index.html` - Complete game (23KB, single file)
- `Assets/Scripts/` - Unity C# reference implementation
  - `PlayerController.cs` - Movement and input handling
  - `MusketController.cs` - Firing, iron sights, reload state machine
  - `HealthSystem.cs` - Damage and respawn
  - `GameManager.cs` - Split screen setup

## How to Play
1. Open the URL in a browser
2. Click to start and lock pointer
3. Use iron sights (X/Shift) to aim
4. Fire (F/Enter) when sights are aligned
5. Reload (R/Backspace) after each shot - all 5 stages required
6. First to kill the other player wins the round

## Architecture Notes
- Reload is interruptible only by completion
- Cannot fire while reloading or not aiming
- Cannot aim while reloading
- Raycast originates from front sight post in direction of sight alignment
- Q/E rotation applies Z-axis roll to shot direction