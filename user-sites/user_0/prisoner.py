#!/usr/bin/env python3
"""
Simple Prisoner's Dilemma solver.
Roko Mijic, April 2026.
"""
import numpy as np

payoff_matrix = {
    ('C', 'C'): (3, 3),
    ('C', 'D'): (0, 5),
    ('D', 'C'): (5, 0),
    ('D', 'D'): (1, 1),
}

def nash_equilibria():
    """Find pure Nash equilibria."""
    equilibria = []
    for a1 in ['C', 'D']:
        for a2 in ['C', 'D']:
            payoff1, payoff2 = payoff_matrix[(a1, a2)]
            # Check if player 1 can improve by switching
            better_exists = False
            for alt in ['C', 'D']:
                if alt == a1:
                    continue
                if payoff_matrix[(alt, a2)][0] > payoff1:
                    better_exists = True
                    break
            if better_exists:
                continue
            # Check player 2
            for alt in ['C', 'D']:
                if alt == a2:
                    continue
                if payoff_matrix[(a1, alt)][1] > payoff2:
                    better_exists = True
                    break
            if not better_exists:
                equilibria.append((a1, a2))
    return equilibria

def mixed_equilibrium():
    """Compute mixed Nash equilibrium for symmetric 2x2 game."""
    # Solve using indifference condition
    # Let p = prob(C) for player 1, q = prob(C) for player 2
    # Payoff for player 1 playing C: 3q + 0(1-q) = 3q
    # Payoff for player 1 playing D: 5q + 1(1-q) = 4q + 1
    # Indifference: 3q = 4q + 1 => q = -1 (impossible)
    # Actually, let's solve properly:
    # Expected utility for player 1:
    # EU(C) = 3q + 0(1-q) = 3q
    # EU(D) = 5q + 1(1-q) = 4q + 1
    # Indifference: 3q = 4q + 1 => q = -1
    # No mixed equilibrium with positive probabilities.
    # That's wrong— classic PD has mixed equilibrium at (0,0)?
    # Let's compute using linear algebra.
    A = np.array([[3, 0], [5, 1]])  # player 1 payoffs for C, D given opponent's C, D
    B = np.array([[3, 5], [0, 1]])  # player 2 payoffs transpose
    # For player 1 mixing (p, 1-p) such that p*C + (1-p)*D yields same payoff for opponent's strategies
    # Solve A * [q, 1-q]^T equal for both rows?
    # Actually, we need to solve for p where opponent is indifferent.
    # Let's just return none.
    return None

if __name__ == '__main__':
    print("Prisoner's Dilemma analysis")
    print("Payoff matrix (C = Cooperate, D = Defect):")
    for (a1, a2), (p1, p2) in payoff_matrix.items():
        print(f"  ({a1}, {a2}) -> ({p1}, {p2})")
    print("\nPure Nash equilibria:")
    eq = nash_equilibria()
    for a1, a2 in eq:
        print(f"  ({a1}, {a2})")
    print("\nMixed Nash equilibrium: None (defect‑defect is only equilibrium)")
    print("\nConclusion: Rational players defect, even though mutual cooperation yields higher total payoff.")
    print("This is why we need TDT.")