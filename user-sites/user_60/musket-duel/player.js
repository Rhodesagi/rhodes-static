// musket-duel/player.js
// Player class with movement and weapon

const Player = {
  MOVE_SPEED: 3.5, // meters per second (walking pace for musket era)
  TURN_SPEED: 2.0, // radians per second
  RADIUS: 0.4,
  HEIGHT: 1.7,
  EYE_HEIGHT: 1.6,
  
  create(id, startX, startZ, color) {
    const player = {
      id: id,
      x: startX,
      z: startZ,
      yaw: id === 1 ? Math.PI / 2 : -Math.PI / 2, // Face each other
      pitch: 0,
      health: 100,
      alive: true,
      color: color,
      score: 0,
      
      musket: Musket.create(),
      projectiles: [],
      
      // Movement with collision
      move(dx, dz, dt) {
        if (!this.alive) return;
        
        // Normalize diagonal
        const len = Math.sqrt(dx*dx + dz*dz);
        if (len > 1) {
          dx /= len;
          dz /= len;
        }
        
        // Apply speed
        dx *= this.MOVE_SPEED * dt;
        dz *= this.MOVE_SPEED * dt;
        
        // Try X movement
        let newX = this.x + dx;
        if (!World.isSolid(newX, this.z)) {
          this.x = newX;
        }
        
        // Try Z movement
        let newZ = this.z + dz;
        if (!World.isSolid(this.x, newZ)) {
          this.z = newZ;
        }
      },
      
      // Rotation
      turn(dyaw, dpitch, dt) {
        if (!this.alive) return;
        
        this.yaw += dyaw * this.TURN_SPEED * dt;
        this.pitch += dpitch * this.TURN_SPEED * dt;
        
        // Clamp pitch
        this.pitch = Math.max(-Math.PI/3, Math.min(Math.PI/6, this.pitch));
      },
      
      // Get eye position
      getEyePosition() {
        return {
          x: this.x,
          y: this.EYE_HEIGHT,
          z: this.z
        };
      },
      
      // Get muzzle position (for projectile spawn)
      getMuzzlePosition() {
        const eye = this.getEyePosition();
        // Muzzle is ~0.5m forward, -0.1m down from eye when aiming
        const offset = 0.5;
        return {
          x: eye.x + Math.cos(this.yaw) * Math.cos(this.pitch) * offset,
          y: eye.y - 0.1 + Math.sin(this.pitch) * offset,
          z: eye.z + Math.sin(this.yaw) * Math.cos(this.pitch) * offset
        };
      },
      
      // Fire weapon
      tryFire() {
        if (!this.alive) return null;
        
        if (this.musket.fire()) {
          // Spawn projectile
          const muzzle = this.getMuzzlePosition();
          const proj = Ballistics.createProjectile(
            muzzle.x, muzzle.y, muzzle.z,
            this.pitch, this.yaw
          );
          proj.owner = this.id;
          this.projectiles.push(proj);
          return proj;
        }
        return null;
      },
      
      // Update all projectiles
      updateProjectiles(dt, opponent) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
          const proj = this.projectiles[i];
          proj.update(dt);
          
          // Check hit on opponent
          if (proj.active && opponent && opponent.alive) {
            const dx = proj.x - opponent.x;
            const dz = proj.z - opponent.z;
            const dy = proj.y - opponent.HEIGHT / 2;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            if (dist < opponent.RADIUS && !World.lineHitsWall(
              proj.x - proj.vx * 0.1, proj.z - proj.vz * 0.1,
              opponent.x, opponent.z
            )) {
              // Hit!
              opponent.takeDamage(100, this);
              proj.active = false;
            }
          }
          
          if (!proj.active) {
            this.projectiles.splice(i, 1);
          }
        }
      },
      
      takeDamage(amount, attacker) {
        this.health -= amount;
        if (this.health <= 0) {
          this.alive = false;
          this.health = 0;
          if (attacker) {
            attacker.score++;
          }
        }
      },
      
      respawn(startX, startZ) {
        this.x = startX;
        this.z = startZ;
        this.yaw = this.id === 1 ? Math.PI / 2 : -Math.PI / 2;
        this.pitch = 0;
        this.health = 100;
        this.alive = true;
        this.musket = Musket.create();
        this.projectiles = [];
      },
      
      update(dt, opponent) {
        this.musket.update(dt);
        this.updateProjectiles(dt, opponent);
      }
    };
    
    return player;
  }
};
