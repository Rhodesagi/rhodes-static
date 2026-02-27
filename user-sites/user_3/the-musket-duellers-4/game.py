import pygame
import math
import random
import sys

pygame.init()

# Screen setup - split screen for 2 players
SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
HALF_HEIGHT = SCREEN_HEIGHT // 2
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("The Musket Duellers - 2 Player Split Screen")

# Colors
SKY_TOP = (135, 206, 235)
SKY_BOTTOM = (255, 248, 220)
GROUND = (101, 67, 33)
GRASS = (34, 85, 51)
WOOD = (101, 67, 33)
METAL = (80, 80, 90)
IRON = (60, 60, 70)
BLACK = (10, 10, 15)
WHITE = (240, 240, 245)
RED = (180, 50, 50)
GOLD = (184, 134, 11)

# Fonts
font_large = pygame.font.Font(None, 48)
font_medium = pygame.font.Font(None, 36)
font_small = pygame.font.Font(None, 24)

class Bullet:
    def __init__(self, x, y, angle, velocity):
        self.x = x
        self.y = y
        self.angle = angle
        self.velocity = velocity
        self.lifetime = 200
        self.active = True
        self.gravity = 0.15
        self.vx = math.cos(math.radians(angle)) * velocity
        self.vy = -math.sin(math.radians(angle)) * velocity
    
    def update(self):
        if not self.active:
            return
        self.x += self.vx
        self.y += self.vy
        self.vy += self.gravity  # Ballistic drop
        self.lifetime -= 1
        if self.lifetime <= 0 or self.y > 500:
            self.active = False
    
    def draw(self, screen, offset_y=0):
        if self.active:
            pygame.draw.circle(screen, (50, 50, 50), (int(self.x), int(self.y) + offset_y), 2)

class Particle:
    def __init__(self, x, y, color, velocity, lifetime):
        self.x = x
        self.y = y
        self.color = color
        self.vx = velocity[0]
        self.vy = velocity[1]
        self.lifetime = lifetime
        self.max_lifetime = lifetime
    
    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vy += 0.1  # gravity
        self.lifetime -= 1
    
    def draw(self, screen, offset_y=0):
        if self.lifetime > 0:
            alpha = int(255 * (self.lifetime / self.max_lifetime))
            color = tuple(min(255, c * alpha // 255) for c in self.color)
            pygame.draw.circle(screen, color, (int(self.x), int(self.y) + offset_y), 2)

class Player:
    def __init__(self, player_num, start_x, start_y):
        self.player_num = player_num
        self.x = start_x
        self.y = start_y
        self.angle = 0 if player_num == 1 else 180
        self.health = 100
        
        # Reloading states: ready, ramming, priming, aiming
        self.reload_state = "ready"
        self.reload_timer = 0
        self.has_ball = True
        self.has_powder = True
        self.is_primmed = True
        
        # Iron sights
        self.aiming = False
        self.aim_progress = 0
        
        # Movement
        self.vx = 0
        self.vy = 0
        self.speed = 2
        
        # Visuals
        self.recoil = 0
        self.flash_timer = 0
        
    def get_reload_step_text(self):
        if self.reload_state == "ready" and self.has_ball and self.has_powder and self.is_primmed:
            return "READY TO FIRE"
        elif self.reload_state == "biting":
            return "1. BITE CARTRIDGE..."
        elif self.reload_state == "priming":
            return "2. PRIME PAN..."
        elif self.reload_state == "pouring":
            return "3. POUR POWDER..."
        elif self.reload_state == "balling":
            return "4. INSERT BALL..."
        elif self.reload_state == "ramming":
            return "5. RAM HOME..."
        elif self.reload_state == "returning":
            return "6. RETURN RAMROD..."
        elif self.reload_state == "halfcock":
            return "7. HALF-COCK..."
        elif self.reload_state == "priming2":
            return "8. PRIME AGAIN..."
        elif self.reload_state == "fullcock":
            return "9. FULL COCK..."
        elif self.reload_state == "aiming":
            return "AIM..."
        return "RELOADING"
    
    def start_reload(self):
        if self.reload_state == "ready":
            self.reload_state = "biting"
            self.reload_timer = 30
            self.has_ball = False
            self.has_powder = False
            self.is_primmed = False
    
    def update_reload(self):
        if self.reload_timer > 0:
            self.reload_timer -= 1
            return
        
        # State machine for reloading
        transitions = {
            "biting": ("priming", 25),
            "priming": ("pouring", 20),
            "pouring": ("balling", 30),
            "balling": ("ramming", 40),
            "ramming": ("returning", 25),
            "returning": ("halfcock", 15),
            "halfcock": ("priming2", 20),
            "priming2": ("fullcock", 15),
            "fullcock": ("ready", 10),
        }
        
        if self.reload_state in transitions:
            next_state, duration = transitions[self.reload_state]
            self.reload_state = next_state
            self.reload_timer = duration
            
            if next_state == "ready":
                self.has_ball = True
                self.has_powder = True
                self.is_primmed = True
    
    def can_fire(self):
        return (self.reload_state == "ready" and 
                self.has_ball and self.has_powder and self.is_primmed and
                self.recoil <= 0)
    
    def fire(self):
        if not self.can_fire():
            return None
        
        self.recoil = 20
        self.flash_timer = 5
        self.has_ball = False
        self.has_powder = False
        self.is_primmed = False
        self.reload_state = "biting"
        self.reload_timer = 30
        
        # Calculate bullet trajectory with some inaccuracy
        base_angle = self.angle + random.uniform(-2, 2)
        if self.aiming:
            base_angle += random.uniform(-0.5, 0.5)  # More accurate when aiming
        
        velocity = 25 if self.aiming else 20
        
        return Bullet(self.x, self.y - 30, base_angle, velocity)
    
    def update(self, keys, opponent_pos):
        # Update reload
        self.update_reload()
        
        # Recoil recovery
        if self.recoil > 0:
            self.recoil -= 1
        
        # Flash decay
        if self.flash_timer > 0:
            self.flash_timer -= 1
        
        # Iron sight aiming
        if self.player_num == 1:
            aim_key = pygame.K_LSHIFT
        else:
            aim_key = pygame.K_RSHIFT
        
        self.aiming = keys[aim_key]
        if self.aiming:
            self.aim_progress = min(1.0, self.aim_progress + 0.1)
        else:
            self.aim_progress = max(0.0, self.aim_progress - 0.1)
        
        # Movement
        if self.player_num == 1:
            left = pygame.K_a
            right = pygame.K_d
            up = pygame.K_w
            down = pygame.K_s
        else:
            left = pygame.K_LEFT
            right = pygame.K_RIGHT
            up = pygame.K_UP
            down = pygame.K_DOWN
        
        self.vx = 0
        self.vy = 0
        
        if keys[left]:
            self.vx = -self.speed
        if keys[right]:
            self.vx = self.speed
        if keys[up]:
            self.vy = -self.speed
        if keys[down]:
            self.vy = self.speed
        
        self.x += self.vx
        self.y += self.vy
        
        # Bounds
        self.x = max(50, min(SCREEN_WIDTH - 50, self.x))
        self.y = max(300, min(500, self.y))
        
        # Auto-aim slightly toward opponent when aiming
        if self.aim_progress > 0.5:
            dx = opponent_pos[0] - self.x
            dy = opponent_pos[1] - self.y
            target_angle = math.degrees(math.atan2(-dy, dx))
            # Smooth aim
            angle_diff = (target_angle - self.angle + 180) % 360 - 180
            self.angle += angle_diff * 0.1 * self.aim_progress
        else:
            # Free aim with mouse (simplified to keyboard for 2-player)
            if self.player_num == 1:
                if keys[pygame.K_q]:
                    self.angle += 2
                if keys[pygame.K_e]:
                    self.angle -= 2
            else:
                if keys[pygame.K_COMMA]:
                    self.angle += 2
                if keys[pygame.K_PERIOD]:
                    self.angle -= 2
    
    def draw(self, screen, offset_y=0, is_top=True):
        center_y = HALF_HEIGHT // 2 + offset_y
        
        # Draw background gradient
        for y in range(offset_y, offset_y + HALF_HEIGHT):
            ratio = (y - offset_y) / HALF_HEIGHT
            color = tuple(int(SKY_TOP[i] * (1 - ratio) + SKY_BOTTOM[i] * ratio) for i in range(3))
            pygame.draw.line(screen, color, (0, y), (SCREEN_WIDTH, y))
        
        # Draw ground
        ground_y = offset_y + HALF_HEIGHT - 100
        pygame.draw.rect(screen, GROUND, (0, ground_y, SCREEN_WIDTH, 100))
        pygame.draw.rect(screen, GRASS, (0, ground_y, SCREEN_WIDTH, 20))
        
        # Draw distant trees
        for i in range(0, SCREEN_WIDTH, 80):
            tree_x = i + (50 if is_top else -50)
            pygame.draw.polygon(screen, (34, 70, 40), [
                (tree_x, ground_y),
                (tree_x + 15, ground_y - 60),
                (tree_x + 30, ground_y)
            ])
        
        # Draw opponent position indicator (minimal)
        # We draw the player
        player_y = self.y + offset_y - ground_y + ground_y
        
        # Draw musket body
        rad = math.radians(self.angle)
        musket_length = 80
        end_x = self.x + math.cos(rad) * musket_length
        end_y = player_y - 20 + math.sin(rad) * -musket_length
        
        # Recoil offset
        recoil_offset = self.recoil * 0.5
        start_x = self.x - math.cos(rad) * recoil_offset
        start_y = player_y - 20 + math.sin(rad) * recoil_offset
        
        # Draw musket barrel
        pygame.draw.line(screen, WOOD, (start_x, start_y), (end_x, end_y), 8)
        # Barrel band
        band_x = self.x + math.cos(rad) * 60
        band_y = player_y - 20 + math.sin(rad) * -60
        pygame.draw.circle(screen, METAL, (int(band_x), int(band_y)), 5)
        
        # Muzzle flash
        if self.flash_timer > 0:
            flash_points = []
            for i in range(8):
                flash_angle = rad + math.radians(i * 45)
                flash_len = 20 + random.randint(0, 15)
                fx = end_x + math.cos(flash_angle) * flash_len
                fy = end_y + math.sin(flash_angle) * -flash_len
                flash_points.append((fx, fy))
            pygame.draw.polygon(screen, (255, 200, 100), flash_points)
        
        # Iron sights overlay (only when aiming)
        if self.aim_progress > 0.1:
            # Draw sight picture
            sight_surface = pygame.Surface((SCREEN_WIDTH, HALF_HEIGHT), pygame.SRCALPHA)
            
            # Vignette
            for r in range(200, 0, -10):
                alpha = int(100 * self.aim_progress * (r / 200))
                pygame.draw.circle(sight_surface, (0, 0, 0, alpha), 
                                 (SCREEN_WIDTH // 2, HALF_HEIGHT // 2), r)
            
            # Rear sight (notch)
            notch_y = HALF_HEIGHT // 2 - 20
            pygame.draw.rect(sight_surface, BLACK, 
                           (SCREEN_WIDTH // 2 - 15, notch_y, 30, 8))
            pygame.draw.rect(sight_surface, (200, 200, 200), 
                           (SCREEN_WIDTH // 2 - 3, notch_y + 2, 6, 4))
            
            # Front sight (blade)
            blade_y = HALF_HEIGHT // 2 + 10
            pygame.draw.polygon(sight_surface, GOLD, [
                (SCREEN_WIDTH // 2, blade_y - 15),
                (SCREEN_WIDTH // 2 - 4, blade_y),
                (SCREEN_WIDTH // 2 + 4, blade_y)
            ])
            
            # FOV reduction effect
            border = int(50 * self.aim_progress)
            pygame.draw.rect(sight_surface, (0, 0, 0, int(200 * self.aim_progress)), 
                           (0, 0, SCREEN_WIDTH, border))
            pygame.draw.rect(sight_surface, (0, 0, 0, int(200 * self.aim_progress)), 
                           (0, HALF_HEIGHT - border, SCREEN_WIDTH, border))
            
            screen.blit(sight_surface, (0, offset_y))
        
        # Draw player body (simple)
        body_color = (60, 100, 60) if self.player_num == 1 else (100, 60, 60)
        pygame.draw.ellipse(screen, body_color, (self.x - 15, player_y - 40, 30, 50))
        # Head
        pygame.draw.circle(screen, (255, 220, 180), (int(self.x), int(player_y) - 50), 12)
        # Hat
        pygame.draw.ellipse(screen, BLACK, (self.x - 14, player_y - 65, 28, 10))
        
        # UI - minimal, diegetic where possible
        # Health bar (small, top corner)
        bar_width = 100
        bar_height = 8
        bar_x = 20 if self.player_num == 1 else SCREEN_WIDTH - 120
        pygame.draw.rect(screen, (50, 50, 50), (bar_x, offset_y + 20, bar_width, bar_height))
        pygame.draw.rect(screen, RED, (bar_x, offset_y + 20, bar_width * (self.health / 100), bar_height))
        
        # Reload status text
        status_text = self.get_reload_step_text()
        text_color = (100, 255, 100) if self.reload_state == "ready" else (255, 200, 100)
        text = font_small.render(status_text, True, text_color)
        text_x = 20 if self.player_num == 1 else SCREEN_WIDTH - text.get_width() - 20
        screen.blit(text, (text_x, offset_y + 35))
        
        # Controls hint
        if self.player_num == 1:
            hint = "WASD: Move | Q/E: Aim | LSHIFT: Iron Sights | SPACE: Fire | R: Reload"
        else:
            hint = "ARROWS: Move | ,/.: Aim | RSHIFT: Iron Sights | ENTER: Fire | P: Reload"
        hint_text = font_small.render(hint, True, (150, 150, 150))
        screen.blit(hint_text, (SCREEN_WIDTH // 2 - hint_text.get_width() // 2, offset_y + HALF_HEIGHT - 25))

# Game state
player1 = Player(1, 200, 450)
player2 = Player(2, 1000, 450)
bullets = []
particles = []

clock = pygame.time.Clock()
running = True
winner = None

print("=== THE MUSKET DUELLERS ===")
print("Player 1 (Green): WASD move, Q/E aim, LSHIFT iron sights, SPACE fire, R reload")
print("Player 2 (Red): ARROWS move, COMMA/PERIOD aim, RSHIFT iron sights, ENTER fire, P reload")

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if winner:
                if event.key == pygame.K_r:
                    # Reset
                    player1 = Player(1, 200, 450)
                    player2 = Player(2, 1000, 450)
                    bullets = []
                    particles = []
                    winner = None
                continue
            
            # Fire
            if event.key == pygame.K_SPACE:
                bullet = player1.fire()
                if bullet:
                    bullets.append(bullet)
                    # Muzzle particles
                    for _ in range(10):
                        particles.append(Particle(
                            player1.x, player1.y - 30,
                            (255, 200, 100),
                            (random.uniform(-3, 3), random.uniform(-5, -2)),
                            20
                        ))
            if event.key == pygame.K_RETURN or event.key == pygame.K_KP_ENTER:
                bullet = player2.fire()
                if bullet:
                    bullets.append(bullet)
                    for _ in range(10):
                        particles.append(Particle(
                            player2.x, player2.y - 30,
                            (255, 200, 100),
                            (random.uniform(-3, 3), random.uniform(-5, -2)),
                            20
                        ))
            
            # Reload
            if event.key == pygame.K_r:
                player1.start_reload()
            if event.key == pygame.K_p:
                player2.start_reload()
    
    if not winner:
        keys = pygame.key.get_pressed()
        player1.update(keys, (player2.x, player2.y))
        player2.update(keys, (player1.x, player1.y))
        
        # Update bullets
        for bullet in bullets:
            bullet.update()
            
            # Check hits
            if bullet.active:
                # Check hit on player 1
                dx = bullet.x - player1.x
                dy = bullet.y - (player1.y - 30)
                if dx * dx + dy * dy < 400:  # 20px radius squared
                    player1.health -= 35
                    bullet.active = False
                    for _ in range(15):
                        particles.append(Particle(
                            bullet.x, bullet.y,
                            (180, 50, 50),
                            (random.uniform(-4, 4), random.uniform(-4, 4)),
                            30
                        ))
                
                # Check hit on player 2
                dx = bullet.x - player2.x
                dy = bullet.y - (player2.y - 30)
                if dx * dx + dy * dy < 400:
                    player2.health -= 35
                    bullet.active = False
                    for _ in range(15):
                        particles.append(Particle(
                            bullet.x, bullet.y,
                            (180, 50, 50),
                            (random.uniform(-4, 4), random.uniform(-4, 4)),
                            30
                        ))
        
        # Update particles
        for p in particles:
            p.update()
        particles = [p for p in particles if p.lifetime > 0]
        bullets = [b for b in bullets if b.active or b.lifetime > 0]
        
        # Check win condition
        if player1.health <= 0:
            winner = 2
        elif player2.health <= 0:
            winner = 1
    
    # Draw
    screen.fill((20, 20, 30))
    
    # Player 1 view (top half)
    player1.draw(screen, 0, True)
    for bullet in bullets:
        bullet.draw(screen, 0)
    for p in particles:
        p.draw(screen, 0)
    
    # Divider
    pygame.draw.line(screen, (50, 50, 50), (0, HALF_HEIGHT), (SCREEN_WIDTH, HALF_HEIGHT), 3)
    
    # Player 2 view (bottom half)  
    player2.draw(screen, HALF_HEIGHT, False)
    for bullet in bullets:
        bullet.draw(screen, HALF_HEIGHT)
    for p in particles:
        p.draw(screen, HALF_HEIGHT)
    
    # Winner overlay
    if winner:
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.fill((0, 0, 0))
        overlay.set_alpha(180)
        screen.blit(overlay, (0, 0))
        
        win_text = font_large.render(f"PLAYER {winner} WINS!", True, (255, 215, 0))
        screen.blit(win_text, (SCREEN_WIDTH // 2 - win_text.get_width() // 2, SCREEN_HEIGHT // 2 - 50))
        
        restart_text = font_medium.render("Press R to duel again", True, WHITE)
        screen.blit(restart_text, (SCREEN_WIDTH // 2 - restart_text.get_width() // 2, SCREEN_HEIGHT // 2 + 20))
    
    pygame.display.flip()
    clock.tick(60)

pygame.quit()
sys.exit()
