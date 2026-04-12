#!/usr/bin/env python3
"""
N-Queens solver using constraint propagation (forward checking) and backtracking.
"""

from typing import List, Set

def solve_n_queens(n: int) -> List[List[str]]:
    """
    Return all distinct solutions to the n‑queens puzzle.
    
    Each solution is represented as a list of strings, where each string
    represents a row with a 'Q' at the placed column and '.' elsewhere.
    """
    # All solutions will be collected here
    solutions = []
    
    # Current placement: col_placement[row] = column index for queen in that row
    col_placement = [-1] * n
    
    # Constraint sets: columns and diagonals already occupied
    used_cols = set()
    used_diag1 = set()  # row - col (main diagonal)
    used_diag2 = set()  # row + col (anti-diagonal)
    
    def backtrack(row: int):
        """Place queens row by row with forward checking."""
        if row == n:
            # All rows placed -> record solution
            solutions.append(build_board(col_placement))
            return
        
        # Try each column that is still free in this row
        for col in range(n):
            d1 = row - col
            d2 = row + col
            if col in used_cols or d1 in used_diag1 or d2 in used_diag2:
                continue  # constraint violation
            
            # Place queen
            col_placement[row] = col
            used_cols.add(col)
            used_diag1.add(d1)
            used_diag2.add(d2)
            
            # Recurse to next row
            backtrack(row + 1)
            
            # Undo placement (backtrack)
            used_cols.remove(col)
            used_diag1.remove(d1)
            used_diag2.remove(d2)
            col_placement[row] = -1
    
    def build_board(cols: List[int]) -> List[str]:
        """Convert column placement to board representation."""
        board = []
        for r in range(n):
            line = ['.'] * n
            line[cols[r]] = 'Q'
            board.append(''.join(line))
        return board
    
    backtrack(0)
    return solutions


def print_solutions(solutions: List[List[str]]) -> None:
    """Pretty‑print all solutions."""
    for idx, board in enumerate(solutions):
        print(f"Solution {idx + 1}:")
        for row in board:
            print(row)
        print()


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        n = int(sys.argv[1])
    else:
        n = 8  # default
    
    sols = solve_n_queens(n)
    print(f"Found {len(sols)} solutions for N = {n}.")
    if n <= 6:
        print_solutions(sols)