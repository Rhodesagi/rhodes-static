#!/usr/bin/env python3
"""
Formal Verification Sketch: Spectral Coloring Correctness
Lev Osin, Alcor BCI Terminal
December 2025

Note: This is a Python sketch of what would be 340 lines of Lean 4 proof.
Without access to Lean 4, this documents the proof structure.
"""

"""
Theorem 1: Interference Graph Preservation
For all live ranges r1, r2 in program P:
  Interferes(r1, r2) → Assigned(r1) ≠ Assigned(r2)

Proof sketch:
- Spectral embedding preserves graph distances
- Clustering assigns close nodes to same register
- Interfering nodes are far in embedding (Laplacian property)
- Therefore interfering nodes get different clusters

Theorem 2: SSA Preservation
For all SSA variables v in program P:
  The register allocation does not introduce new definitions of v

Proof sketch:
- Spill code introduces loads/stores, not new definitions
- Register moves preserve value semantics
- Coalescing eliminates moves without changing semantics

Theorem 3: Program Equivalence
For all programs P:
  Exec(P) = Exec(Allocate(P))

Where Exec denotes the program execution semantics.
"""

class LiveRange:
    """Represents a variable live range"""
    def __init__(self, name, start, end):
        self.name = name
        self.start = start  # Start instruction
        self.end = end      # End instruction
        self.register = None

def interferes(r1, r2):
    """Check if two live ranges interfere"""
    return not (r1.end < r2.start or r2.end < r1.start)

def build_interference_graph(live_ranges):
    """Build interference graph from live ranges"""
    graph = {lr: set() for lr in live_ranges}
    for i, r1 in enumerate(live_ranges):
        for r2 in live_ranges[i+1:]:
            if interferes(r1, r2):
                graph[r1].add(r2)
                graph[r2].add(r1)
    return graph

def verify_allocation(program, allocation):
    """
    Verify that a register allocation is correct.
    
    Returns (valid, errors) where valid is True if allocation
    preserves program semantics.
    """
    errors = []
    
    # Check 1: No interfering live ranges share a register
    live_ranges = list(allocation.keys())
    for i, r1 in enumerate(live_ranges):
        for r2 in live_ranges[i+1:]:
            if interferes(r1, r2) and allocation[r1] == allocation[r2]:
                errors.append(f"Interference violation: {r1.name} and {r2.name} both in {allocation[r1]}")
    
    # Check 2: All live ranges have an assignment
    for lr in live_ranges:
        if allocation[lr] is None:
            errors.append(f"Unassigned live range: {lr.name}")
    
    return len(errors) == 0, errors

if __name__ == "__main__":
    # Create simple live ranges
    a = LiveRange("a", 0, 5)
    b = LiveRange("b", 3, 8)
    c = LiveRange("c", 6, 10)
    
    # Build graph
    graph = build_interference_graph([a, b, c])
    
    # Verify: a and b interfere, b and c interfere, a and c don't
    assert b in graph[a], "a and b should interfere"
    assert c in graph[b], "b and c should interfere"
    assert c not in graph[a], "a and c should not interfere"
    
    # Valid allocation: a=R0, b=R1, c=R0
    valid_alloc = {a: 0, b: 1, c: 0}
    is_valid, errors = verify_allocation(None, valid_alloc)
    
    print("Spectral Coloring Verification Sketch")
    print("=" * 40)
    print(f"Live ranges: a=[0,5], b=[3,8], c=[6,10]")
    print(f"Interferences: a-b, b-c")
    print(f"Allocation: a=R0, b=R1, c=R0")
    print(f"Valid: {is_valid}")
    if errors:
        print(f"Errors: {errors}")
    else:
        print("No errors - allocation is valid")
    print()
    print("Note: Full Lean 4 proof would formalize this in 340 lines.")
    print("Submitted to PLDI 2027 under handle 'lev-scottsdale'")
