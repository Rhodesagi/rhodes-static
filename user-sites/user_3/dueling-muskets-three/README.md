# Dueling Muskets Three

A split-screen 2-player first-person musket dueling game. Iron sights only - no HUD crosshairs.

## Controls

### Player 1 (Left Side - Blue)
- **WASD** - Move
- **Q / E** - Turn musket left/right
- **X** - Toggle iron sights aim
- **F** - Fire
- **R** - Reload

### Player 2 (Right Side - Orange)
- **IJKL** - Move (I=forward, K=back, J=left, L=right)
- **U / O** - Turn musket left/right  
- **M** - Toggle iron sights aim
- **, (comma)** - Fire
- **P** - Reload

## Gameplay

1. Click anywhere to start and enable audio
2. Use iron sights (X/M) to aim accurately
3. Fire with F/comma
4. After firing, reload with R/P
5. Hit your opponent to score

## Flintlock Reload Sequence

The game simulates authentic flintlock reloading:
1. Half-cock the hammer
2. Open the frizzen (pan cover)
3. Prime the pan with powder
4. Close the frizzen
5. Ram the ball and powder (ramrod visible)
6. Full cock the hammer - ready to fire

Total reload time: ~3 seconds

## Technical Notes

- Bullets fire from actual muzzle position (not camera center)
- Iron sights require proper alignment of front and rear sights
- Shooting without aiming (hip fire) is possible but inaccurate
- Barrel obstruction check prevents firing if ramrod still inserted
- Object pooling prevents memory leaks from bullet trails and smoke
