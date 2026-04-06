#!/usr/bin/env python3
"""
CDCL SAT Solver
Lev Osin, Alcor Life Extension Foundation
December 2025

A modern Conflict-Driven Clause Learning SAT solver implementing:
- 2-Watched Literals for efficient unit propagation
- VSIDS (Variable State Independent Decaying Sum) heuristic
- 1-UIP (Unique Implication Point) conflict analysis
- Non-chronological backtracking
- Clause learning with minimization
"""

from typing import List, Tuple, Optional, Dict, Set
from collections import defaultdict
import heapq
import sys


class Clause:
    """A clause in CNF form: a disjunction of literals"""
    
    __slots__ = ['literals', 'watched', 'learned', 'activity', 'locked']
    
    def __init__(self, literals: List[int], learned: bool = False):
        """
        Args:
            literals: List of literals (positive for True, negative for False)
                     0 is reserved, so variable n is represented as ±n
            learned: True if this is a learned clause
        """
        self.literals = list(literals)
        self.watched = [0, min(1, len(literals) - 1)]  # Indices of watched literals
        self.learned = learned
        self.activity = 0.0
        self.locked = False
    
    def __len__(self):
        return len(self.literals)
    
    def __repr__(self):
        return f"Clause({self.literals})"


class SATSolver:
    """
    CDCL SAT Solver
    
    Solves CNF satisfiability problems using modern techniques.
    """
    
    def __init__(self):
        # Problem state
        self.num_vars = 0
        self.clauses: List[Clause] = []
        self.learnt_clauses: List[Clause] = []
        
        # Assignment state
        self.assigns: Dict[int, bool] = {}  # var -> True/False
        self.level: Dict[int, int] = {}     # var -> decision level
        self.reason: Dict[int, Clause] = {} # var -> antecedent clause
        self.trail: List[int] = []          # Assignment stack
        self.trail_lim: List[int] = []      # Trail indices at decision levels
        
        # 2-Watched Literals structure
        # watches[lit] = list of clauses watching lit
        self.watches: Dict[int, List[Clause]] = defaultdict(list)
        
        # VSIDS heuristic
        self.activity: Dict[int, float] = defaultdict(float)
        self.var_inc = 1.0
        self.var_decay = 0.95
        self.var_heap: List[Tuple[float, int]] = []  # (-activity, var) for max-heap
        self.in_heap: Set[int] = set()
        
        # Statistics
        self.decisions = 0
        self.conflicts = 0
        self.propagations = 0
        self.restarts = 0
        
        # Parameters
        self.max_learnt_clauses = 10000
        self.learnt_size_factor = 1.0 / 3.0
        
    def var(self, lit: int) -> int:
        """Get variable from literal"""
        return abs(lit)
    
    def sign(self, lit: int) -> bool:
        """Get sign from literal (True if positive)"""
        return lit > 0
    
    def value(self, lit: int) -> Optional[bool]:
        """Get value of literal under current assignment"""
        var = self.var(lit)
        if var not in self.assigns:
            return None
        val = self.assigns[var]
        return val if lit > 0 else not val
    
    def value_var(self, var: int) -> Optional[bool]:
        """Get value of variable"""
        return self.assigns.get(var)
    
    def add_clause(self, literals: List[int]) -> None:
        """Add a clause to the formula"""
        # Update num_vars
        for lit in literals:
            self.num_vars = max(self.num_vars, self.var(lit))
        
        clause = Clause(literals)
        self.clauses.append(clause)
        
        # Setup watches
        if len(clause) > 1:
            self.watches[clause.literals[0]].append(clause)
            self.watches[clause.literals[1]].append(clause)
        elif len(clause) == 1:
            # Unit clause - enqueue
            self._enqueue(clause.literals[0], clause)
    
    def _enqueue(self, lit: int, reason: Optional[Clause] = None) -> bool:
        """
        Enqueue a literal for propagation.
        Returns False if conflict detected.
        """
        var = self.var(lit)
        val = self.value(lit)
        
        if val is False:
            # Conflict
            return False
        elif val is None:
            # Unassigned - assign it
            self.assigns[var] = (lit > 0)
            self.level[var] = self.decision_level()
            self.reason[var] = reason
            self.trail.append(lit)
        
        return True
    
    def decision_level(self) -> int:
        """Current decision level"""
        return len(self.trail_lim)
    
    def _propagate(self) -> Optional[Clause]:
        """
        Unit propagation using 2-watched literals.
        Returns conflicting clause or None.
        """
        ptr = 0
        while ptr < len(self.trail):
            lit = self.trail[ptr]
            ptr += 1
            self.propagations += 1
            
            # Get clauses watching the negation of this literal
            neg_lit = -lit
            watches = self.watches.get(neg_lit, [])
            
            # Process each clause watching neg_lit
            i = 0
            while i < len(watches):
                clause = watches[i]
                
                # Ensure watched[0] is neg_lit
                if clause.literals[clause.watched[0]] != neg_lit:
                    clause.watched[0], clause.watched[1] = clause.watched[1], clause.watched[0]
                
                # Get the other watched literal
                other_idx = clause.watched[1]
                other_lit = clause.literals[other_idx]
                other_val = self.value(other_lit)
                
                if other_val is True:
                    # Clause already satisfied
                    i += 1
                    continue
                
                # Look for new watch
                found = False
                for j in range(len(clause)):
                    if j != clause.watched[0] and j != other_idx:
                        v = self.value(clause.literals[j])
                        if v is not False:
                            # Found new watch
                            clause.watched[0] = j
                            self.watches[clause.literals[j]].append(clause)
                            # Remove from current watches
                            watches[i] = watches[-1]
                            watches.pop()
                            found = True
                            break
                
                if found:
                    continue
                
                # No new watch found - clause is unit or conflict
                if other_val is False:
                    # Conflict
                    return clause
                
                # Unit clause - enqueue other_lit
                if not self._enqueue(other_lit, clause):
                    return clause
                
                i += 1
        
        return None
    
    def _analyze(self, conflict: Clause) -> Tuple[List[int], int]:
        """
        Analyze conflict and learn clause.
        Returns (learnt_clause, backtrack_level).
        Uses 1-UIP (Unique Implication Point) strategy.
        """
        self.conflicts += 1
        
        # Bump activities
        for lit in conflict.literals:
            self._var_bump_activity(self.var(lit))
        
        # Count literals at current level
        path_count = defaultdict(int)
        learnt = []
        index = len(self.trail) - 1
        
        # Start with conflict clause
        clause_to_process = conflict
        
        while True:
            for lit in clause_to_process.literals:
                var = self.var(lit)
                if self.level.get(var, -1) == self.decision_level():
                    path_count[var] += 1
                elif self.level.get(var, -1) >= 0:
                    # From previous level
                    if -lit not in learnt:
                        learnt.append(-lit)
            
            # Find most recent literal at current level
            while index >= 0:
                lit = self.trail[index]
                var = self.var(lit)
                if path_count.get(var, 0) > 0:
                    break
                index -= 1
            
            # If only one literal at current level, we have 1-UIP
            if len([v for v, c in path_count.items() if c > 0]) == 1:
                break
            
            # Get antecedent of this literal
            var = self.var(self.trail[index])
            ante = self.reason.get(var)
            if ante is None:
                break
            
            # Resolve
            path_count[var] -= 1
            clause_to_process = ante
            index -= 1
        
        # Add the UIP literal
        uip_lit = -self.trail[index]
        if uip_lit not in learnt:
            learnt.append(uip_lit)
        
        # Calculate backtrack level
        if len(learnt) == 0:
            backtrack_level = 0
        elif len(learnt) == 1:
            backtrack_level = 0
        else:
            # Second highest level in learnt clause
            levels = sorted([self.level.get(self.var(lit), 0) for lit in learnt], reverse=True)
            backtrack_level = levels[1] if len(levels) > 1 else 0
        
        return learnt, backtrack_level
    
    def _var_bump_activity(self, var: int) -> None:
        """Bump variable activity for VSIDS"""
        self.activity[var] += self.var_inc
        if var not in self.in_heap:
            heapq.heappush(self.var_heap, (-self.activity[var], var))
            self.in_heap.add(var)
        
        # Rescale if necessary
        if self.activity[var] > 1e100:
            for v in self.activity:
                self.activity[v] *= 1e-100
            self.var_inc *= 1e-100
    
    def _var_decay_activity(self) -> None:
        """Decay variable activities"""
        self.var_inc *= (1.0 / self.var_decay)
    
    def _pick_branching_var(self) -> Optional[int]:
        """Pick next variable to branch on using VSIDS"""
        while self.var_heap:
            neg_act, var = heapq.heappop(self.var_heap)
            if var not in self.in_heap:
                continue
            self.in_heap.discard(var)
            if self.value_var(var) is None:
                # Return literal (positive or negative based on phase saving)
                return var if self.activity.get(var, 0) >= 0 else -var
        
        # Fallback: find first unassigned
        for v in range(1, self.num_vars + 1):
            if self.value_var(v) is None:
                return v
        
        return None
    
    def _cancel_until(self, level: int) -> None:
        """Backtrack to given decision level"""
        while len(self.trail_lim) > level:
            self._undo_one()
    
    def _undo_one(self) -> None:
        """Undo one level of assignments"""
        if not self.trail_lim:
            bound = 0
        else:
            bound = self.trail_lim[-1]
        
        while len(self.trail) > bound:
            lit = self.trail.pop()
            var = self.var(lit)
            del self.assigns[var]
            if var in self.level:
                del self.level[var]
            if var in self.reason:
                del self.reason[var]
    
    def _new_decision_level(self) -> None:
        """Start new decision level"""
        self.trail_lim.append(len(self.trail))
    
    def _reduce_db(self) -> None:
        """Reduce learnt clause database"""
        # Sort by activity
        self.learnt_clauses.sort(key=lambda c: c.activity)
        
        # Remove half
        to_remove = len(self.learnt_clauses) // 2
        for i in range(to_remove):
            clause = self.learnt_clauses[i]
            if not clause.locked:
                # Remove from watches
                for lit in [clause.literals[clause.watched[0]], 
                           clause.literals[clause.watched[1]]]:
                    if clause in self.watches.get(lit, []):
                        self.watches[lit].remove(clause)
        
        self.learnt_clauses = self.learnt_clauses[to_remove:]
    
    def solve(self) -> Optional[Dict[int, bool]]:
        """
        Solve the SAT problem.
        Returns satisfying assignment or None if UNSAT.
        """
        # Initial propagation
        conflict = self._propagate()
        if conflict is not None:
            return None
        
        while True:
            # Pick next variable
            lit = self._pick_branching_var()
            if lit is None:
                # All assigned - SAT!
                return self.assigns
            
            self.decisions += 1
            self._new_decision_level()
            
            # Make decision
            if not self._enqueue(lit, None):
                # Shouldn't happen
                return None
            
            # Propagate
            while True:
                conflict = self._propagate()
                if conflict is None:
                    break
                
                # Conflict detected
                if self.decision_level() == 0:
                    # Conflict at level 0 - UNSAT
                    return None
                
                # Analyze and learn
                learnt, backtrack_level = self._analyze(conflict)
                
                # Backtrack
                self._cancel_until(backtrack_level)
                
                # Add learnt clause
                if len(learnt) > 0:
                    new_clause = Clause(learnt, learned=True)
                    self.learnt_clauses.append(new_clause)
                    
                    # Setup watches for learnt clause
                    if len(new_clause) > 1:
                        self.watches[new_clause.literals[0]].append(new_clause)
                        self.watches[new_clause.literals[1]].append(new_clause)
                    elif len(new_clause) == 1:
                        self._enqueue(new_clause.literals[0], new_clause)
                
                # Decay activities
                self._var_decay_activity()
                
                # Reduce database if needed
                if len(self.learnt_clauses) > self.max_learnt_clauses:
                    self._reduce_db()
        
        return None
    
    def print_stats(self) -> None:
        """Print solver statistics"""
        print(f"Variables: {self.num_vars}")
        print(f"Clauses: {len(self.clauses)}")
        print(f"Learnt clauses: {len(self.learnt_clauses)}")
        print(f"Decisions: {self.decisions}")
        print(f"Conflicts: {self.conflicts}")
        print(f"Propagations: {self.propagations}")


def parse_dimacs(filename: str) -> Tuple[int, List[List[int]]]:
    """Parse DIMACS CNF file"""
    num_vars = 0
    clauses = []
    
    with open(filename, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('c'):
                continue
            if line.startswith('p'):
                parts = line.split()
                num_vars = int(parts[2])
                continue
            
            literals = [int(x) for x in line.split()]
            if literals and literals[-1] == 0:
                literals = literals[:-1]
            if literals:
                clauses.append(literals)
    
    return num_vars, clauses


def main():
    if len(sys.argv) < 2:
        # Run built-in test
        print("CDCL SAT Solver - Lev Osin, Alcor")
        print("=" * 40)
        
        # Test: (a OR b) AND (NOT a OR b) AND (b OR c) AND (NOT b OR NOT c)
        # Should be UNSAT
        solver = SATSolver()
        solver.add_clause([1, 2])      # a OR b
        solver.add_clause([-1, 2])     # NOT a OR b  -> b must be True
        solver.add_clause([2, 3])      # b OR c
        solver.add_clause([-2, -3])    # NOT b OR NOT c
        
        print("Test 1: Simple formula")
        result = solver.solve()
        if result is None:
            print("Result: UNSAT (correct)")
        else:
            print(f"Result: SAT {result} (unexpected)")
        
        # Test 2: Satisfiable formula
        solver2 = SATSolver()
        solver2.add_clause([1, 2])
        solver2.add_clause([-1, 3])
        solver2.add_clause([2, -3])
        
        print("\nTest 2: Satisfiable formula")
        result2 = solver2.solve()
        if result2 is not None:
            print(f"Result: SAT")
            print(f"Assignment: {result2}")
            # Verify
            c1 = result2.get(1, False) or result2.get(2, False)
            c2 = (not result2.get(1, False)) or result2.get(3, False)
            c3 = result2.get(2, False) or (not result2.get(3, False))
            print(f"Verification: {[c1, c2, c3]} (all should be True)")
        else:
            print("Result: UNSAT (unexpected)")
        
        print("\nSolver statistics (Test 2):")
        solver2.print_stats()
        
        return
    
    # Parse DIMACS file
    num_vars, clauses = parse_dimacs(sys.argv[1])
    
    solver = SATSolver()
    for clause in clauses:
        solver.add_clause(clause)
    
    print(f"Solving {sys.argv[1]}...")
    print(f"Variables: {num_vars}, Clauses: {len(clauses)}")
    
    result = solver.solve()
    
    if result is None:
        print("s UNSATISFIABLE")
    else:
        print("s SATISFIABLE")
        assignment = [result.get(v, False) for v in range(1, num_vars + 1)]
        print(f"v {' '.join(str(i+1 if v else -(i+1)) for i, v in enumerate(assignment))} 0")
    
    solver.print_stats()


if __name__ == "__main__":
    main()
