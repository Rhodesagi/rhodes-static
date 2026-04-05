#!/usr/bin/env python3
"""
Spectral Coloring Register Allocator - Prototype
Lev Osin / lev-scottsdale

A graph coloring approach using spectral partitioning for
spill reduction. The key insight: minimize edge cuts across
partitions to reduce live range interference.
"""

from collections import defaultdict
import sys

def build_interference_graph(instructions, live_ranges):
    """Build interference graph from live ranges."""
    graph = defaultdict(set)
    for var, (start, end) in live_ranges.items():
        for other, (ostart, oend) in live_ranges.items():
            if var != other and not (end < ostart or start > oend):
                graph[var].add(other)
    return graph

def spectral_partition(graph, nodes, k=2):
    """
    Simple spectral-style partitioning using Fiedler vector approximation.
    For prototype: use degree-based heuristic as Fiedler approximator.
    """
    if len(nodes) <= k:
        return [[n] for n in nodes]
    
    # Compute "Laplacian" degrees
    degrees = {n: len(graph[n] & set(nodes)) for n in nodes}
    sorted_nodes = sorted(nodes, key=lambda n: degrees[n])
    
    # Partition by sorted order (simplified spectral cut)
    chunk = len(nodes) // k
    return [sorted_nodes[i:i+chunk] for i in range(0, len(nodes), chunk)]

def color_partition(graph, partition, colors_available, assigned):
    """Color a partition with minimal spill."""
    for node in partition:
        used = {assigned.get(neigh) for neigh in graph[node] 
                if neigh in assigned}
        for color in colors_available:
            if color not in used:
                assigned[node] = color
                break
        # Spill if no color available (not handling spill code here)
    return assigned

def allocate_registers(instructions, live_ranges, num_regs=16):
    """
    Main entry: spectral coloring allocator.
    
    Returns: dict mapping virtual registers to physical registers
    """
    graph = build_interference_graph(instructions, live_ranges)
    nodes = list(live_ranges.keys())
    
    # Phase 1: Spectral partitioning
    partitions = spectral_partition(graph, nodes, k=num_regs//4)
    
    # Phase 2: Color each partition
    assigned = {}
    colors = list(range(num_regs))
    
    for part in partitions:
        # Reserve colors used by neighbors of this partition
        boundary = set()
        for node in part:
            boundary.update(graph[node] - set(part))
        reserved = {assigned.get(b) for b in boundary if b in assigned}
        available = [c for c in colors if c not in reserved]
        
        assigned = color_partition(graph, part, available, assigned)
    
    return assigned

# Test case: simple expression (a + b) * (c + d)
if __name__ == '__main__':
    # Mock live ranges for: t1 = a + b; t2 = c + d; result = t1 * t2
    test_ranges = {
        'a': (0, 2), 'b': (0, 2), 't1': (2, 5),
        'c': (3, 5), 'd': (3, 5), 't2': (5, 7),
        'result': (7, 8)
    }
    
    allocation = allocate_registers([], test_ranges, num_regs=4)
    print("Spectral Coloring Allocation:")
    for var, reg in sorted(allocation.items()):
        print(f"  {var} -> R{reg}")
    
    # Verify no conflicts
    graph = build_interference_graph([], test_ranges)
    conflicts = 0
    for var, reg in allocation.items():
        for neigh in graph[var]:
            if allocation.get(neigh) == reg:
                print(f"CONFLICT: {var} and {neigh} both in R{reg}")
                conflicts += 1
    
    if not conflicts:
        print("\nNo allocation conflicts. PASS.")
