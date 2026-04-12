// musket-duel/ballistics.js
// Ballistics for .75 cal Brown Bess smoothbore musket

const Ballistics = {
  // Musket ball: .75 caliber (19mm), ~575m/s muzzle velocity (reduced for gameplay)
  MUZZLE_VELOCITY: 350, // meters per second (game-scaled)
  GRAVITY: 9.8,
  BALL_DIAMETER: 0.019, // meters
  AIR_RESISTANCE: 0.15,
  
  // Smoothbore inaccuracy - random spread in degrees
  SPREAD_BASE: 2.5, // degrees at 50m
  SPREAD_MAX: 8.0,  // degrees at 100m+ 
  
  createProjectile(x, y, z, pitch, yaw, power = 1.0) {
    // Add smoothbore inaccuracy
    const spread = this.SPREAD_BASE + (Math.random() * 2 - 1) * 1.5;
    const spreadYaw = (Math.random() * 2 - 1) * spread * (Math.PI / 180);
    const spreadPitch = (Math.random() * 2 - 1) * spread * (Math.PI / 180) * 0.5;
    
    return {
      x: x,
      y: y,
      z: z,
      vx: Math.cos(yaw + spreadYaw) * Math.cos(pitch + spreadPitch) * this.MUZZLE_VELOCITY * power,
      vy: Math.sin(pitch + spreadPitch) * this.MUZZLE_VELOCITY * power,
      vz: Math.sin(yaw + spreadYaw) * Math.cos(pitch + spreadPitch) * this.MUZZLE_VELOCITY * power,
      active: true,
      owner: null,
      birthTime: Date.now(),
      
      update(dt) {
        if (!this.active) return;
        
        // Apply gravity
        this.vy -= this.GRAVITY * dt;
        
        // Apply air resistance
        const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy + this.vz*this.vz);
        const drag = this.AIR_RESISTANCE * speed * dt;
        this.vx *= (1 - drag);
        this.vy *= (1 - drag);
        this.vz *= (1 - drag);
        
        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.z += this.vz * dt;
        
        // Ground collision
        if (this.y <= 0) {
          this.active = false;
          this.hit = 'ground';
        }
        
        // Max range / timeout
        if (Date.now() - this.birthTime > 3000) {
          this.active = false;
        }
      },
      
      getPosition() {
        return { x: this.x, y: this.y, z: this.z };
      }
    };
  }
};
