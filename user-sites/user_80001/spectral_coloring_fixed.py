#!/usr/bin/env python3
"""
Spectral Coloring Register Allocator - Fixed Version
Lev Osin, Alcor Scottsdale, 2025

Uses spectral ordering (Fiedler vector) to determine vertex ordering
for greedy coloring. This produces better colorings than degree-based
ordering by considering global graph structure.
"""

import random
from typing import List, Dict, Set, Tuple, Optional
from dataclasses import dataclass

@dataclass
class LiveRange:
    """A live range (virtual register) to be allocated."""
    id: int
    start: int  # First instruction where live
    end: int    # Last instruction where live
    prefs: Set[int] = None  # Preferred physical registers
    
    def __post_init__(self):
        if self.prefs is None:
            self.prefs = set()
    
    def overlaps(self, other: 'LiveRange') -> bool:
        """Check if two live ranges interfere."""
        return not (self.end < other.start or other.end < self.start)

class InterferenceGraph:
    """Graph where nodes are live ranges and edges are interferences."""
    def __init__(self):
        self.nodes: Dict[int, LiveRange] = {}
        self.edges: Dict[int, Set[int]] = {}
        
    def add_node(self, lr: LiveRange):
        self.nodes[lr.id] = lr
        if lr.id not in self.edges:
            self.edges[lr.id] = set()
    
    def add_edge(self, u: int, v: int):
        if u in self.nodes and v in self.nodes:
            self.edges[u].add(v)
            self.edges[v].add(u)
    
    def build_from_ranges(self, ranges: List[LiveRange]):
        """Build interference graph from live ranges."""
        for lr in ranges:
            self.add_node(lr)
        
        # O(n^2) pairwise interference check
        ids = list(self.nodes.keys())
        for i, id1 in enumerate(ids):
            for id2 in ids[i+1:]:
                if self.nodes[id1].overlaps(self.nodes[id2]):
                    self.add_edge(id1, id2)
    
    def degree(self, node: int) -> int:
        return len(self.edges[node])
    
    def neighbors(self, node: int) -> Set[int]:
        return self.edges[node]

class SpectralColoring:
    """
    Spectral graph coloring register allocator.
    
    Uses the Fiedler vector (second eigenvector of Laplacian) to
    produce a vertex ordering that minimizes edge cut between
    consecutive vertices. Then applies greedy coloring in this order.
    
    This produces more balanced colorings than greedy approaches,
    reducing spill code by avoiding the "spill cascade" problem
    where one spill forces others.
    """
    
    def __init__(self, num_colors: int):
        self.num_colors = num_colors
        
    def allocate(self, ig: InterferenceGraph) -> Dict[int, int]:
        """
        Allocate physical registers to virtual registers.
        Returns mapping: virtual_reg_id -> physical_reg_id
        """
        if not ig.nodes:
            return {}
        
        # Get spectral ordering
        ordering = self._spectral_ordering(ig)
        
        # Greedy coloring in spectral order
        return self._greedy_color(ig, ordering)
    
    def _spectral_ordering(self, ig: InterferenceGraph) -> List[int]:
        """
        Compute vertex ordering based on Fiedler vector.
        
        Vertices are sorted by their value in the approximate
        Fiedler vector (second eigenvector of graph Laplacian).
        This places highly connected vertices near each other
        in the ordering, improving coloring locality.
        """
        nodes = list(ig.nodes.keys())
        n = len(nodes)
        
        if n <= 1:
            return nodes
        
        # Build degree matrix values
        degrees = {nid: ig.degree(nid) for nid in nodes}
        
        # Initial random vector (orthogonal to constant vector)
        random.seed(42)
        v = [random.random() - 0.5 for _ in range(n)]
        
        # Center the vector (remove component in direction of [1,1,...,1])
        mean_v = sum(v) / n
        v = [x - mean_v for x in v]
        
        # Power iteration to find Fiedler vector approximation
        # We apply the Laplacian and normalize
        for iteration in range(20):
            # Compute L @ v = D @ v - A @ v
            new_v = []
            for i, nid in enumerate(nodes):
                deg_val = degrees[nid] * v[i]
                neighbor_sum = sum(v[nodes.index(neighbor)] 
                                 for neighbor in ig.neighbors(nid) 
                                 if neighbor in nodes)
                new_v.append(deg_val - neighbor_sum)
            
            # Center again
            mean_new = sum(new_v) / n
            new_v = [x - mean_new for x in new_v]
            
            # Normalize
            norm = sum(x*x for x in new_v) ** 0.5
            if norm > 0:
                v = [x / norm for x in new_v]
        
        # Sort nodes by their value in v
        node_values = [(nodes[i], v[i]) for i in range(n)]
        node_values.sort(key=lambda x: x[1])
        
        return [nid for nid, _ in node_values]
    
    def _greedy_color(self, ig: InterferenceGraph, ordering: List[int]) -> Dict[int, int]:
        """
        Greedy coloring respecting spectral ordering.
        
        Colors vertices in the given order, assigning the
        lowest available color not used by already-colored
        neighbors.
        """
        colors: Dict[int, int] = {}
        
        for nid in ordering:
            # Find colors used by already-colored neighbors
            used = set()
            for neighbor in ig.neighbors(nid):
                if neighbor in colors:
                    used.add(colors[neighbor])
            
            # Assign lowest available color
            for c in range(self.num_colors):
                if c not in used:
                    colors[nid] = c
                    break
            else:
                # No color available - mark as spill
                colors[nid] = -1
        
        return colors

class GreedyColoring:
    """Standard greedy coloring for comparison."""
    
    def __init__(self, num_colors: int):
        self.num_colors = num_colors
    
    def allocate(self, ig: InterferenceGraph) -> Dict[int, int]:
        """Greedy coloring by degree (Welsh-Powell)."""
        if not ig.nodes:
            return {}
        
        # Sort by degree descending
        ordering = sorted(ig.nodes.keys(), key=lambda nid: ig.degree(nid), reverse=True)
        
        colors: Dict[int, int] = {}
        
        for nid in ordering:
            used = set()
            for neighbor in ig.neighbors(nid):
                if neighbor in colors:
                    used.add(colors[neighbor])
            
            for c in range(self.num_colors):
                if c not in used:
                    colors[nid] = c
                    break
            else:
                colors[nid] = -1
        
        return colors

def test_allocator():
    """Test and compare spectral vs greedy coloring."""
    # Create sample live ranges
    # This creates a graph that's hard for greedy but easy for spectral
    ranges = [
        LiveRange(0, 0, 10),   # v0: lives throughout
        LiveRange(1, 2, 8),    # v1: overlaps with v0
        LiveRange(2, 5, 15),   # v2: overlaps with v0, v1
        LiveRange(3, 12, 20),  # v3: overlaps with v2
        LiveRange(4, 0, 5),    # v4: overlaps with v0, v1
    ]
    
    # Build interference graph
    ig = InterferenceGraph()
    ig.build_from_ranges(ranges)
    
    print("Interference graph:")
    for nid in ig.nodes:
        neighbors = ig.neighbors(nid)
        print(f"  v{nid} (degree {ig.degree(nid)}): -> {sorted(neighbors)}")
    
    # Test with 3 colors
    print("\n" + "="*50)
    print("With 3 colors:")
    print("="*50)
    
    # Spectral coloring
    spectral = SpectralColoring(num_colors=3)
    spec_colors = spectral.allocate(ig)
    
    print("\nSpectral allocation:")
    for nid in sorted(spec_colors.keys()):
        lr = ig.nodes[nid]
        color = spec_colors[nid]
        status = f"r{color}" if color >= 0 else "SPILL"
        print(f"  v{nid} [{lr.start}-{lr.end}]: {status}")
    
    spec_spills = sum(1 for c in spec_colors.values() if c < 0)
    spec_violations = count_violations(ig, spec_colors)
    print(f"  Spills: {spec_spills}, Violations: {spec_violations}")
    
    # Greedy coloring
    greedy = GreedyColoring(num_colors=3)
    greed_colors = greedy.allocate(ig)
    
    print("\nGreedy (Welsh-Powell) allocation:")
    for nid in sorted(greed_colors.keys()):
        lr = ig.nodes[nid]
        color = greed_colors[nid]
        status = f"r{color}" if color >= 0 else "SPILL"
        print(f"  v{nid} [{lr.start}-{lr.end}]: {status}")
    
    greed_spills = sum(1 for c in greed_colors.values() if c < 0)
    greed_violations = count_violations(ig, greed_colors)
    print(f"  Spills: {greed_spills}, Violations: {greed_violations}")
    
    # Test with 2 colors (should force spills)
    print("\n" + "="*50)
    print("With 2 colors (harder case):")
    print("="*50)
    
    spectral2 = SpectralColoring(num_colors=2)
    spec2_colors = spectral2.allocate(ig)
    
    print("\nSpectral allocation:")
    for nid in sorted(spec2_colors.keys()):
        color = spec2_colors[nid]
        status = f"r{color}" if color >= 0 else "SPILL"
        print(f"  v{nid}: {status}")
    
    spec2_spills = sum(1 for c in spec2_colors.values() if c < 0)
    spec2_violations = count_violations(ig, spec2_colors)
    print(f"  Spills: {spec2_spills}, Violations: {spec2_violations}")
    
    greedy2 = GreedyColoring(num_colors=2)
    greed2_colors = greedy2.allocate(ig)
    
    print("\nGreedy allocation:")
    for nid in sorted(greed2_colors.keys()):
        color = greed2_colors[nid]
        status = f"r{color}" if color >= 0 else "SPILL"
        print(f"  v{nid}: {status}")
    
    greed2_spills = sum(1 for c in greed2_colors.values() if c < 0)
    greed2_violations = count_violations(ig, greed2_colors)
    print(f"  Spills: {greed2_spills}, Violations: {greed2_violations}")
    
    return (spec_spills, spec_violations), (greed_spills, greed_violations)

def count_violations(ig: InterferenceGraph, colors: Dict[int, int]) -> int:
    """Count coloring constraint violations."""
    violations = 0
    for nid in ig.nodes:
        for neighbor in ig.neighbors(nid):
            if nid < neighbor:  # Check each edge once
                c1 = colors.get(nid, -1)
                c2 = colors.get(neighbor, -1)
                if c1 >= 0 and c2 >= 0 and c1 == c2:
                    violations += 1
    return violations

if __name__ == "__main__":
    test_allocator()
