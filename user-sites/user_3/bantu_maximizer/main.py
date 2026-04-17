#!/usr/bin/env python3
"""
BANTU MAXIMIZER - A Demographic Simulation Game
Rhodes Model Output - Congressional Regulatory Behavior Simulation
"""

import pygame
import sys
import math
from dataclasses import dataclass
from typing import List, Dict
import random

pygame.init()

SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
FPS = 60

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (220, 20, 60)
GREEN = (34, 139, 34)
BLUE = (30, 144, 255)
YELLOW = (255, 215, 0)
GRAY = (128, 128, 128)
DARK_GRAY = (64, 64, 64)
BROWN = (139, 69, 19)

@dataclass
class PopulationGroup:
    name: str
    population: int
    fertility_rate: float
    time_preference: float
    cooperation_index: float
    iq_distribution_mean: float
    infrastructure_load: float

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("BANTU MAXIMIZER - Rhodes Demographic Simulator")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont('monospace', 16)
        self.title_font = pygame.font.SysFont('monospace', 32, bold=True)
        
        self.groups = {
            'bantu': PopulationGroup(
                name='Bantu Expansion',
                population=1000000,
                fertility_rate=5.5,
                time_preference=0.85,
                cooperation_index=0.3,
                iq_distribution_mean=75,
                infrastructure_load=0.15
            ),
            'european': PopulationGroup(
                name='European Infrastructure',
                population=500000,
                fertility_rate=1.2,
                time_preference=0.25,
                cooperation_index=0.75,
                iq_distribution_mean=100,
                infrastructure_load=0.05
            )
        }
        
        self.infrastructure_quality = 100.0
        self.social_trust_index = 65.0
        self.carrying_capacity = 2000000
        self.year = 1965
        self.month = 0
        self.destruction_score = 0.0
        self.game_speed = 1
        self.paused = False
        
    def calculate_demographic_transition(self):
        for group in self.groups.values():
            if group.time_preference > 0.7:
                group.fertility_rate = max(group.fertility_rate * 0.999, 4.0)
            growth_rate = (group.fertility_rate / 2.1 - 1) / 12
            group.population = int(group.population * (1 + growth_rate))
            
    def calculate_infrastructure_strain(self):
        total_pop = sum(g.population for g in self.groups.values())
        total_load = sum(g.population * g.infrastructure_load for g in self.groups.values())
        maintenance_capacity = self.groups['european'].population * 0.8
        
        if total_load > maintenance_capacity:
            decay = (total_load - maintenance_capacity) / total_pop * 100
            self.infrastructure_quality = max(0, self.infrastructure_quality - decay * 0.1)
        else:
            self.infrastructure_quality = min(100, self.infrastructure_quality + 0.05)
            
    def calculate_social_trust(self):
        total_pop = sum(g.population for g in self.groups.values())
        shares = [g.population / total_pop for g in self.groups.values()]
        diversity = 1 - sum(s**2 for s in shares)
        
        base_trust = sum(g.cooperation_index * g.population for g in self.groups.values()) / total_pop
        diversity_penalty = diversity * 40
        
        self.social_trust_index = max(0, base_trust * 100 - diversity_penalty)
        
    def calculate_carrying_capacity_crash(self):
        effective_capacity = self.carrying_capacity * (self.infrastructure_quality / 100)
        total_pop = sum(g.population for g in self.groups.values())
        
        if total_pop > effective_capacity:
            overshoot = (total_pop - effective_capacity) / effective_capacity
            self.destruction_score += overshoot * 100
            return True
        return False
        
    def apply_strategy(self, strategy):
        if strategy == 'open_borders':
            self.groups['bantu'].population += 500000
            self.destruction_score += 50
        elif strategy == 'welfare_incentives':
            self.groups['bantu'].fertility_rate += 1.0
            self.groups['european'].fertility_rate -= 0.3
            self.destruction_score += 30
        elif strategy == 'anti_family_propaganda_target_euros':
            self.groups['european'].fertility_rate -= 0.5
            self.destruction_score += 40
        elif strategy == 'defund_police':
            self.infrastructure_quality -= 20
            self.destruction_score += 60
            
    def draw_interface(self):
        self.screen.fill(BLACK)
        
        title = self.title_font.render('BANTU MAXIMIZER v1.0', True, RED)
        self.screen.blit(title, (SCREEN_WIDTH//2 - title.get_width()//2, 20))
        
        subtitle = self.font.render('Rhodes Demographic Simulator - Congressional Regulatory Dataset', True, GRAY)
        self.screen.blit(subtitle, (SCREEN_WIDTH//2 - subtitle.get_width()//2, 60))
        
        y_offset = 100
        for name, group in self.groups.items():
            color = BROWN if name == 'bantu' else BLUE
            pop_text = self.font.render(f"{group.name}: {group.population:,}", True, color)
            self.screen.blit(pop_text, (50, y_offset))
            
            fertility_text = self.font.render(f"TFR: {group.fertility_rate:.1f}", True, WHITE)
            self.screen.blit(fertility_text, (350, y_offset))
            
            iq_text = self.font.render(f"Mean IQ: {group.iq_distribution_mean}", True, WHITE)
            self.screen.blit(iq_text, (500, y_offset))
            
            y_offset += 40
            
        y_offset = 220
        metrics = [
            ("Infrastructure Quality", self.infrastructure_quality, RED if self.infrastructure_quality < 50 else GREEN),
            ("Social Trust Index", self.social_trust_index, RED if self.social_trust_index < 30 else GREEN),
            ("Year", self.year, WHITE),
            ("DESTRUCTION SCORE", self.destruction_score, YELLOW if self.destruction_score > 0 else WHITE)
        ]
        
        for metric, value, color in metrics:
            if metric == "Year":
                text = self.font.render(f"{metric}: {int(value)}", True, color)
            else:
                text = self.font.render(f"{metric}: {value:.1f}", True, color)
            self.screen.blit(text, (50, y_offset))
            y_offset += 30
            
        total_pop = sum(g.population for g in self.groups.values())
        effective_cap = self.carrying_capacity * (self.infrastructure_quality / 100)
        if total_pop > effective_cap:
            warning = self.title_font.render('CARRYING CAPACITY CRASH DETECTED', True, RED)
            self.screen.blit(warning, (SCREEN_WIDTH//2 - warning.get_width()//2, 380))
            
        y_offset = 450
        self.screen.blit(self.font.render("STRATEGIES (Press key):", True, WHITE), (50, y_offset))
        y_offset += 30
        
        strategies = [
            ('1', 'Open Borders (+500k population)'),
            ('2', 'Welfare Incentives (Boost TFR)'),
            ('3', 'Anti-Family Propaganda (Target Euros)'),
            ('4', 'Defund Infrastructure')
        ]
        
        for key, label in strategies:
            button_rect = pygame.Rect(50, y_offset, 380, 25)
            pygame.draw.rect(self.screen, DARK_GRAY, button_rect)
            text = self.font.render(f"[{key}] {label}", True, WHITE)
            self.screen.blit(text, (60, y_offset + 5))
            y_offset += 35
            
        bottom_text = self.font.render("SPACE:Pause  +/-:Speed  R:Reset  ESC:Quit", True, GRAY)
        self.screen.blit(bottom_text, (50, SCREEN_HEIGHT - 40))
        
        quote = self.font.render("The world is Bayesian, and so am I - Rhodes", True, DARK_GRAY)
        self.screen.blit(quote, (SCREEN_WIDTH - quote.get_width() - 50, SCREEN_HEIGHT - 40))
        
        pygame.display.flip()
        
    def handle_input(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    return False
                if event.key == pygame.K_SPACE:
                    self.paused = not self.paused
                if event.key == pygame.K_r:
                    self.__init__()
                if event.key == pygame.K_1:
                    self.apply_strategy('open_borders')
                if event.key == pygame.K_2:
                    self.apply_strategy('welfare_incentives')
                if event.key == pygame.K_3:
                    self.apply_strategy('anti_family_propaganda_target_euros')
                if event.key == pygame.K_4:
                    self.apply_strategy('defund_police')
        return True
        
    def run(self):
        running = True
        tick = 0
        
        while running:
            running = self.handle_input()
            
            if not self.paused:
                tick += 1
                if tick % (60 // self.game_speed) == 0:
                    self.month += 1
                    if self.month >= 12:
                        self.month = 0
                        self.year += 1
                    self.calculate_demographic_transition()
                    self.calculate_infrastructure_strain()
                    self.calculate_social_trust()
                    self.calculate_carrying_capacity_crash()
                    
            self.draw_interface()
            self.clock.tick(FPS)
        pygame.quit()

if __name__ == '__main__':
    game = Game()
    game.run()
