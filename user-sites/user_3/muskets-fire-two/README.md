# MUSKETS FIRE — Two Player Combat

A realistic two-player first-person musket combat simulator with authentic ballistics and iron sight aiming.

## Features

- **Split-screen local multiplayer** — Two players on one computer
- **Iron sight aiming** — No crosshairs; align rear notch with front post (20° FOV)
- **Geometric sight alignment** — Projectiles fire along rear sight to front post vector
- **Realistic reloading** — 6-step procedural animation
- **Ballistic physics** — Gravity drop, air resistance, ±5m/s velocity variance per shot
- **Procedural assets** — No external 3D models
- **Synthesized audio** — Web Audio API with sub-bass thump
- **Visual weapon inspection** — Check lock state and prime status

## Controls

### Player 1 (Left Screen)
- **WASD** — Movement
- **Mouse** — Aim (pointer lock)
- **Click** — Fire
- **R** — Reload
- **T** — Inspect weapon

### Player 2 (Right Screen)
- **IJKL** — Movement
- **Arrow Keys** — Aim (alternative to mouse)
- **Mouse** — Fine aim (when viewport active)
- **Click** — Fire
- **P** — Reload
- **O** — Inspect weapon

**Note:** Due to browser limitations, only one player can use pointer lock at a time. P2 uses keyboard aiming by default, with mouse support when the viewport is clicked.

## Technical Details

- Muzzle velocity: 300 m/s (±5m/s random variance per shot)
- Camera FOV: 20° for proper iron sight picture
- Effective range: 50-100 meters
- Reload time: ~4.5 seconds
- First to 5 kills wins

## Deployment

`https://rhodesagi.com/user-sites/user_3/muskets-fire-two/`

---

*Built for the Rhodes Army Contract*
