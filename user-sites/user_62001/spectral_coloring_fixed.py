#!/usr/bin/env python3
"""
Spectral Coloring Register Allocator - Fixed Version
Lev Osin, Alcor Scottsdale, 2025

Uses Fiedler vector to order nodes for greedy coloring,
avoiding the partition-then-color approach which doesn't
respect interferences across partitions.
"""

from typing import List, Dict, Set
from dataclasses import dataclass
import random

@dataclass
class LiveRange:
    """A live range (virtual register) to be allocated."""
    id: int
    start: int
    end: int
    weight: float = 1.0  # Spill cost
    
    def overlaps(self, other: 'LiveRange') -> bool:
        return not (self.end < other.start or other.end < self.start)

class InterferenceGraph:
    def __init__(self):
        self.nodes: Dict[int, LiveRange] = {}
        self.edges: Dict[int, Set[int]] = {}
        
    def add_node(self, lr: LiveRange):
        self.nodes[lr.id] = lr
        self.edges[lr.id] = set()
    
    def add_edge(self, u: int, v: int):
        if u in self.nodes and v in self.nodes:
            self.edges[u].add(v)
            self.edges[v].add(u)
    
    def build_from_ranges(self, ranges: List[LiveRange]):
        for lr in ranges:
            self.add_node(lr)
        
        ids = list(self.nodes.keys())
        for i, id1 in enumerate(ids):
            for id2 in ids[i+1:]:
                if self.nodes[id1].overlaps(self.nodes[id2]):
                    self.add_edge(id1, id2)
    
    def degree(self, node: int) -> int:
        return len(self.edges[node])

class SpectralColoring:
    """
    Spectral-based graph coloring register allocator.
    
    Uses Fiedler vector to order nodes, then greedy coloring.
    The spectral ordering tends to place highly connected nodes
    with similar neighborhoods close together, reducing conflicts.
    """
    
    def __init__(self, num_colors: int):
        self.num_colors = num_colors
        
    def allocate(self, ig: InterferenceGraph) -> Dict[int, int]:
        if not ig.nodes:
            return {}
        
        # Get spectral ordering
        ordering = self._spectral_order(ig)
        
        # Greedy coloring in spectral order
        colors = {}
        for nid in ordering:
            # Find used colors by neighbors
            used = {colors[neighbor] for neighbor in ig.edges[nid] 
                   if neighbor in colors and colors[neighbor] >= 0}
            
            # Assign lowest available color
            for c in range(self.num_colors):
                if c not in used:
                    colors[nid] = c
                    break
            else:
                colors[nid] = -1  # Spill
        
        return colors
    
    def _spectral_order(self, ig: InterferenceGraph) -> List[int]:
        """
        Order nodes by Fiedler vector values.
        
        The Fiedler vector (second eigenvector of graph Laplacian)
        tends to put nodes with similar connectivity patterns
        near each other in the ordering.
        """
        nodes = list(ig.nodes.keys())
        n = len(nodes)
        
        if n <= 1:
            return nodes
        
        # Build adjacency list and degree matrix
        degrees = {nid: ig.degree(nid) for nid in nodes}
        
        # Random initial vector, orthogonal to constant vector
        random.seed(42)
        v = [random.random() - 0.5 for _ in range(n)]
        
        # Make orthogonal to [1,1,1,...] by subtracting mean
        mean = sum(v) / n
        v = [x - mean for x in v]
        
        # Power iteration with Rayleigh quotient for Fiedler vector
        # This finds the eigenvector of smallest non-zero eigenvalue
        for _ in range(50):  # Usually converges quickly
            # Apply Laplacian: L @ v = D @ v - A @ v
            new_v = []
            for i, nid in enumerate(nodes):
                deg_val = degrees[nid] * v[i]
                neighbor_sum = sum(v[nodes.index(neighbor)]
                                 for neighbor in ig.edges[nid])
                new_v.append(deg_val - neighbor_sum)
            
            # Normalize
            norm = sum(x*x for x in new_v) ** 0.5
            if norm == 0:
                break
            v = [x / norm for x in new_v]
            
            # Keep orthogonal to constant vector
            mean = sum(v) / n
            v = [x - mean for x in v]
        
        # Sort by Fiedler vector value
        indexed = [(v[i], nodes[i]) for i in range(n)]
        indexed.sort()
        
        return [nid for _, nid in indexed]

def test_allocator():
    """Test the spectral coloring allocator."""
    ranges = [
        LiveRange(0, 0, 10),   # v0: lives throughout
        LiveRange(1, 2, 8),    # v1: overlaps with v0
        LiveRange(2, 5, 15),   # v2: overlaps with v0, v1
        LiveRange(3, 12, 20),  # v3: overlaps with v2
        LiveRange(4, 0, 5),    # v4: overlaps with v0, v1
    ]
    
    ig = InterferenceGraph()
    ig.build_from_ranges(ranges)
    
    print("Interference graph:")
    for nid in ig.nodes:
        neighbors = ig.edges[nid]
        print(f"  v{nid} (degree {ig.degree(nid)}): -> {sorted(neighbors)}")
    
    allocator = SpectralColoring(num_colors=3)
    colors = allocator.allocate(ig)
    
    print("\nAllocation (color = physical register, -1 = spill):")
    for nid in sorted(colors.keys()):
        lr = ig.nodes[nid]
        color = colors[nid]
        status = f"r{color}" if color >= 0 else "SPILL"
        print(f"  v{nid} [{lr.start}-{lr.end}]: {status}")
    
    # Verify no conflicts
    spills = sum(1 for c in colors.values() if c < 0)
    print(f"\nTotal spills: {spills}")
    
    violations = 0
    for nid in ig.nodes:
        for neighbor in ig.edges[nid]:
            if nid < neighbor:
                c1 = colors.get(nid, -1)
                c2 = colors.get(neighbor, -1)
                if c1 >= 0 and c2 >= 0 and c1 == c2:
                    print(f"VIOLATION: v{nid} and v{neighbor} have same color {c1}")
                    violations += 1
    
    print(f"Interference violations: {violations}")
    
    # Compare with simple greedy (degree order)
    print("\n--- Comparison with degree-order greedy ---")
    greedy_colors = {}
    sorted_nodes = sorted(ig.nodes.keys(), key=lambda nid: ig.degree(nid), reverse=True)
    for nid in sorted_nodes:
        used = {greedy_colors[neighbor] for neighbor in ig.edges[nid] 
               if neighbor in greedy_colors and greedy_colors[neighbor] >= 0}
        for c in range(3):
            if c not in used:
                greedy_colors[nid] = c
                break
        else:
            greedy_colors[nid] = -1
    
    greedy_spills = sum(1 for c in greedy_colors.values() if c < 0)
    print(f"Greedy spills: {greedy_spills}")
    print(f"Spectral spills: {spills}")
    
    return spills, violations

def test_stress():
    """Stress test with larger random interference graph."""
    print("\n--- Stress Test ---")
    
    # Generate random live ranges
    random.seed(123)
    ranges = []
    for i in range(50):
        start = random.randint(0, 100)
        end = start + random.randint(5, 30)
        ranges.append(LiveRange(i, start, end))
    
    ig = InterferenceGraph()
    ig.build_from_ranges(ranges)
    
    allocator = SpectralColoring(num_colors=16)
    colors = allocator.allocate(ig)
    
    spills = sum(1 for c in colors.values() if c < 0)
    
    violations = 0
    for nid in ig.nodes:
        for neighbor in ig.edges[nid]:
            if nid < neighbor:
                c1 = colors.get(nid, -1)
                c2 = colors.get(neighbor, -1)
                if c1 >= 0 and c2 >= 0 and c1 == c2:
                    violations += 1
    
    print(f"Nodes: {len(ranges)}, Edges: {sum(len(e) for e in ig.edges.values())//2}")
    print(f"Spills: {spills}, Violations: {violations}")
    
    # Compare with greedy
    greedy_colors = {}
    sorted_nodes = sorted(ig.nodes.keys(), key=lambda nid: ig.degree(nid), reverse=True)
    for nid in sorted_nodes:
        used = {greedy_colors[neighbor] for neighbor in ig.edges[nid] 
               if neighbor in greedy_colors and greedy_colors[neighbor] >= 0}
        for c in range(16):
            if c not in used:
                greedy_colors[nid] = c
                break
        else:
            greedy_colors[nid] = -1
    
    greedy_spills = sum(1 for c in greedy_colors.values() if c < 0)
    print(f"Greedy spills: {greedy_spills}")

if __name__ == "__main__":
    test_allocator()
    test_stress()
