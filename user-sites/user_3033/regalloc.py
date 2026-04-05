#!/usr/bin/env python3
"""
Spectral Graph Coloring Register Allocator - Simulator
Lev Osin, BCI-mediated compilation environment

This simulates a register allocation algorithm based on spectral graph coloring,
which uses eigenvector decomposition of the interference graph Laplacian
to guide register assignment decisions.
"""

from typing import List, Dict, Set, Tuple, Optional
from dataclasses import dataclass
from collections import defaultdict
import heapq

@dataclass
class LiveRange:
    """A variable live range with start/end program points."""
    name: str
    start: int
    end: int
    
    def overlaps(self, other: 'LiveRange') -> bool:
        return not (self.end < other.start or other.end < self.start)

class InterferenceGraph:
    """Graph where nodes are live ranges and edges represent interference."""
    
    def __init__(self):
        self.nodes: Set[str] = set()
        self.edges: Dict[str, Set[str]] = defaultdict(set)
        self.live_ranges: Dict[str, LiveRange] = {}
    
    def add_range(self, lr: LiveRange):
        self.nodes.add(lr.name)
        self.live_ranges[lr.name] = lr
    
    def build_interference(self):
        """Build edges between overlapping live ranges."""
        ranges = list(self.live_ranges.values())
        for i, r1 in enumerate(ranges):
            for r2 in ranges[i+1:]:
                if r1.overlaps(r2):
                    self.edges[r1.name].add(r2.name)
                    self.edges[r2.name].add(r1.name)
    
    def degree(self, node: str) -> int:
        return len(self.edges[node])
    
    def get_neighbors(self, node: str) -> Set[str]:
        return self.edges[node]

class SpectralAllocator:
    """
    Register allocator using spectral coloring heuristics.
    
    Key insight: The Fiedler vector (second smallest eigenvector of the 
    Laplacian) provides a linear ordering that tends to separate 
    interfering nodes. We use this to guide coloring decisions.
    """
    
    def __init__(self, num_registers: int = 8):
        self.k = num_registers
        self.registers = list(range(num_registers))
    
    def _compute_degree_ordering(self, graph: InterferenceGraph) -> List[str]:
        """Simple greedy ordering by degree (highest degree first)."""
        return sorted(graph.nodes, key=lambda n: graph.degree(n), reverse=True)
    
    def _compute_spectral_ordering(self, graph: InterferenceGraph) -> List[str]:
        """
        Approximate spectral ordering using power iteration on Laplacian.
        
        For a proper implementation we'd compute eigenvectors, but in this
        simulation we use a simplified iterative approach based on node
        connectivity patterns.
        """
        # Simplified: use 2D embedding based on local connectivity
        coords: Dict[str, Tuple[float, float]] = {}
        
        # Initialize random positions
        import random
        rng = random.Random(42)  # Deterministic
        for node in graph.nodes:
            coords[node] = (rng.random(), rng.random())
        
        # Iterative Laplacian smoothing (simplified)
        for _ in range(10):
            new_coords = {}
            for node in graph.nodes:
                neighbors = list(graph.get_neighbors(node))
                if neighbors:
                    avg_x = sum(coords[n][0] for n in neighbors) / len(neighbors)
                    avg_y = sum(coords[n][1] for n in neighbors) / len(neighbors)
                    # Pull toward centroid of neighbors (Laplacian effect)
                    new_coords[node] = (
                        0.5 * coords[node][0] + 0.5 * avg_x,
                        0.5 * coords[node][1] + 0.5 * avg_y
                    )
                else:
                    new_coords[node] = coords[node]
            coords = new_coords
        
        # Sort by angular position around centroid
        cx = sum(c[0] for c in coords.values()) / len(coords)
        cy = sum(c[1] for c in coords.values()) / len(coords)
        
        def angle(node):
            x, y = coords[node]
            import math
            return math.atan2(y - cy, x - cx)
        
        return sorted(graph.nodes, key=angle)
    
    def allocate(self, graph: InterferenceGraph, use_spectral: bool = True) -> Dict[str, int]:
        """
        Assign registers to live ranges.
        Returns mapping from variable name to register number.
        """
        graph.build_interference()
        
        if use_spectral:
            ordering = self._compute_spectral_ordering(graph)
        else:
            ordering = self._compute_degree_ordering(graph)
        
        coloring: Dict[str, int] = {}
        
        for node in ordering:
            # Find used colors among neighbors
            used_colors = {coloring[n] for n in graph.get_neighbors(node) if n in coloring}
            
            # Assign lowest available color
            for color in range(self.k):
                if color not in used_colors:
                    coloring[node] = color
                    break
            else:
                # Spill - mark as needing stack allocation
                coloring[node] = -1
        
        return coloring
    
    def count_spills(self, coloring: Dict[str, int]) -> int:
        return sum(1 for c in coloring.values() if c == -1)

def test_allocator():
    """Test the spectral allocator on sample code patterns."""
    
    # Simulate: a = b + c; d = a * e; f = d + g
    # Live ranges with program point intervals
    ranges = [
        LiveRange("b", 0, 2),
        LiveRange("c", 0, 2),
        LiveRange("a", 2, 4),  # Result of first op, used in second
        LiveRange("e", 3, 5),
        LiveRange("d", 4, 6),  # Result of second op
        LiveRange("g", 5, 7),
        LiveRange("f", 6, 8),  # Final result
    ]
    
    graph = InterferenceGraph()
    for lr in ranges:
        graph.add_range(lr)
    
    allocator = SpectralAllocator(num_registers=3)
    
    # Compare spectral vs greedy
    spectral_coloring = allocator.allocate(graph, use_spectral=True)
    greedy_coloring = allocator.allocate(graph, use_spectral=False)
    
    print("=== Register Allocation Test ===")
    print(f"Live ranges: {[r.name for r in ranges]}")
    print(f"\nSpectral ordering result:")
    for var, reg in sorted(spectral_coloring.items()):
        status = f"R{reg}" if reg >= 0 else "SPILL"
        print(f"  {var}: {status}")
    print(f"  Spills: {allocator.count_spills(spectral_coloring)}")
    
    print(f"\nGreedy ordering result:")
    for var, reg in sorted(greedy_coloring.items()):
        status = f"R{reg}" if reg >= 0 else "SPILL"
        print(f"  {var}: {status}")
    print(f"  Spills: {allocator.count_spills(greedy_coloring)}")
    
    # Verify correctness - no two interfering variables share a register
    def verify(coloring):
        for node in graph.nodes:
            for neighbor in graph.get_neighbors(node):
                if coloring[node] == coloring[neighbor] and coloring[node] >= 0:
                    return False, f"Conflict: {node} and {neighbor} both in R{coloring[node]}"
        return True, "Valid"
    
    print(f"\nSpectral validity: {verify(spectral_coloring)[1]}")
    print(f"Greedy validity: {verify(greedy_coloring)[1]}")

if __name__ == "__main__":
    test_allocator()
