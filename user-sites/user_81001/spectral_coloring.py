#!/usr/bin/env python3
"""
Spectral Ordering Register Allocator
Lev Osin, Alcor Scottsdale, 2025

Uses spectral graph analysis to determine optimal coloring order,
then applies greedy coloring. This reduces spill cascades by
ordering nodes to maximize color availability for high-degree nodes.
"""

import heapq
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
    Spectral ordering register allocator.
    
    Uses the Fiedler vector (second eigenvector of graph Laplacian) to
    determine an optimal node ordering for greedy coloring. Nodes with
    similar connectivity are grouped together, reducing the chance of
    color starvation for high-degree nodes.
    
    This is simpler than full spectral partitioning but achieves similar
    spill reduction by improving the coloring order.
    """
    
    def __init__(self, num_colors: int):
        self.num_colors = num_colors
        self.colors: Dict[int, int] = {}
        
    def allocate(self, ig: InterferenceGraph) -> Dict[int, int]:
        """
        Allocate physical registers to virtual registers.
        Returns mapping: virtual_reg_id -> physical_reg_id
        """
        if not ig.nodes:
            return {}
        
        # Compute spectral ordering
        ordering = self._spectral_order(ig)
        
        # Greedy coloring in spectral order
        return self._greedy_color_ordered(ig, ordering)
    
    def _spectral_order(self, ig: InterferenceGraph) -> List[int]:
        """
        Compute node ordering based on Fiedler vector.
        
        Uses power iteration to approximate the second eigenvector
        of the graph Laplacian. Nodes are sorted by their value in
        this vector, which groups nodes with similar connectivity.
        """
        nodes = list(ig.nodes.keys())
        n = len(nodes)
        
        if n <= 1:
            return nodes
        
        # Build degree lookup
        degrees = {nid: ig.degree(nid) for nid in nodes}
        
        # Initial random vector (orthogonal to constant vector)
        import random
        random.seed(42)
        v = [random.random() - 0.5 for _ in range(n)]
        
        # Center the vector (remove constant component)
        mean = sum(v) / n
        v = [x - mean for x in v]
        
        # Power iteration with Rayleigh quotient acceleration
        for _ in range(20):
            # Matrix-vector multiply: L @ v
            new_v = []
            for i, nid in enumerate(nodes):
                # (D - A) @ v = D@v - A@v
                deg_val = degrees[nid] * v[i]
                neighbor_sum = sum(v[nodes.index(neighbor)] 
                                 for neighbor in ig.neighbors(nid) 
                                 if neighbor in nodes)
                new_v.append(deg_val - neighbor_sum)
            
            # Center again
            mean = sum(new_v) / n
            new_v = [x - mean for x in new_v]
            
            # Normalize
            norm = sum(x*x for x in new_v) ** 0.5
            if norm > 0:
                v = [x / norm for x in new_v]
        
        # Sort nodes by value in Fiedler vector
        # This groups nodes with similar graph connectivity
        indexed = [(v[i], nodes[i]) for i in range(n)]
        indexed.sort(key=lambda x: x[0])
        
        return [nid for _, nid in indexed]
    
    def _greedy_color_ordered(self, ig: InterferenceGraph, ordering: List[int]) -> Dict[int, int]:
        """Greedy coloring respecting spectral ordering."""
        colors = {}
        
        for nid in ordering:
            # Find colors used by already-colored neighbors
            used = set()
            for neighbor in ig.neighbors(nid):
                if neighbor in colors:
                    used.add(colors[neighbor])
            
            # Assign lowest available color
            assigned = False
            for c in range(self.num_colors):
                if c not in used:
                    colors[nid] = c
                    assigned = True
                    break
            
            if not assigned:
                # No color available - mark as spill
                colors[nid] = -1
        
        return colors
    
    def _greedy_color(self, ig: InterferenceGraph) -> Dict[int, int]:
        """Standard greedy coloring (degree order) for comparison."""
        # Sort by degree (highest first - Welsh-Powell)
        ordering = sorted(ig.nodes.keys(), 
                         key=lambda nid: ig.degree(nid), 
                         reverse=True)
        return self._greedy_color_ordered(ig, ordering)

def test_allocator():
    """Test the spectral coloring allocator."""
    # Create sample live ranges
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
    print("\n--- Spectral Ordering (3 colors) ---")
    allocator = SpectralColoring(num_colors=3)
    colors = allocator.allocate(ig)
    
    print("Allocation:")
    for nid in sorted(colors.keys()):
        lr = ig.nodes[nid]
        color = colors[nid]
        status = f"r{color}" if color >= 0 else "SPILL"
        print(f"  v{nid} [{lr.start}-{lr.end}]: {status}")
    
    spills = sum(1 for c in colors.values() if c < 0)
    violations = count_violations(ig, colors)
    print(f"Spills: {spills}, Violations: {violations}")
    
    # Compare with standard greedy
    print("\n--- Standard Greedy (degree order, 3 colors) ---")
    colors_greedy = allocator._greedy_color(ig)
    
    print("Allocation:")
    for nid in sorted(colors_greedy.keys()):
        lr = ig.nodes[nid]
        color = colors_greedy[nid]
        status = f"r{color}" if color >= 0 else "SPILL"
        print(f"  v{nid} [{lr.start}-{lr.end}]: {status}")
    
    spills_greedy = sum(1 for c in colors_greedy.values() if c < 0)
    violations_greedy = count_violations(ig, colors_greedy)
    print(f"Spills: {spills_greedy}, Violations: {violations_greedy}")
    
    # Test with 2 colors (should require spills)
    print("\n--- Spectral Ordering (2 colors - stress test) ---")
    allocator2 = SpectralColoring(num_colors=2)
    colors2 = allocator2.allocate(ig)
    
    for nid in sorted(colors2.keys()):
        lr = ig.nodes[nid]
        color = colors2[nid]
        status = f"r{color}" if color >= 0 else "SPILL"
        print(f"  v{nid} [{lr.start}-{lr.end}]: {status}")
    
    spills2 = sum(1 for c in colors2.values() if c < 0)
    violations2 = count_violations(ig, colors2)
    print(f"Spills: {spills2}, Violations: {violations2}")
    
    return spills, violations

def count_violations(ig, colors):
    """Count interference violations in coloring."""
    violations = 0
    for nid in ig.nodes:
        for neighbor in ig.neighbors(nid):
            if nid < neighbor:
                c1 = colors.get(nid, -1)
                c2 = colors.get(neighbor, -1)
                if c1 >= 0 and c2 >= 0 and c1 == c2:
                    violations += 1
    return violations

def benchmark():
    """Benchmark on larger random graphs."""
    import random
    random.seed(123)
    
    print("\n=== Benchmark: Random interference graphs ===")
    
    results = []
    for n in [10, 20, 50, 100]:
        for density in [0.1, 0.3, 0.5]:
            # Generate random live ranges
            ranges = []
            for i in range(n):
                start = random.randint(0, 100)
                end = start + random.randint(5, 50)
                ranges.append(LiveRange(i, start, end))
            
            ig = InterferenceGraph()
            ig.build_from_ranges(ranges)
            
            # Count actual edges
            edge_count = sum(len(ig.edges[nid]) for nid in ig.nodes) // 2
            max_edges = n * (n - 1) // 2
            actual_density = edge_count / max_edges if max_edges > 0 else 0
            
            for k in [3, 4, 5]:
                # Spectral
                alloc_s = SpectralColoring(num_colors=k)
                colors_s = alloc_s.allocate(ig)
                spills_s = sum(1 for c in colors_s.values() if c < 0)
                viol_s = count_violations(ig, colors_s)
                
                # Greedy
                colors_g = alloc_s._greedy_color(ig)
                spills_g = sum(1 for c in colors_g.values() if c < 0)
                viol_g = count_violations(ig, colors_g)
                
                if spills_s != spills_g:
                    results.append((n, actual_density, k, spills_s, spills_g))
    
    print("Cases where spectral differs from greedy:")
    print("(n, density, colors, spectral_spills, greedy_spills)")
    for r in results[:10]:
        print(f"  {r}")
    
    if not results:
        print("  No differences found in this sample")

if __name__ == "__main__":
    test_allocator()
    benchmark()
