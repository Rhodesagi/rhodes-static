#!/usr/bin/env python3
"""
Spectral Coloring Register Allocator v2
Lev Osin, Alcor Scottsdale, 2025

Fixed: Properly handles cross-partition interferences.
Uses iterative improvement after initial coloring.
"""

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
    
    Uses spectral partitioning + greedy coloring with
    iterative improvement to fix cross-partition conflicts.
    """
    
    def __init__(self, num_colors: int):
        self.num_colors = num_colors
        self.colors: Dict[int, int] = {}
        self.ig: Optional[InterferenceGraph] = None
        
    def allocate(self, ig: InterferenceGraph) -> Dict[int, int]:
        """
        Allocate physical registers to virtual registers.
        Returns mapping: virtual_reg_id -> physical_reg_id
        """
        self.colors = {}
        self.ig = ig
        
        # Handle empty graph
        if not ig.nodes:
            return {}
        
        # Use Chaitin-style simplification for small graphs
        if len(ig.nodes) <= self.num_colors * 2:
            return self._chaitin_color(ig)
        
        # Spectral partitioning
        partition = self._spectral_partition(ig)
        
        # Color each partition with full interference awareness
        for part_nodes in partition:
            self._color_partition(ig, part_nodes)
        
        # Iterative improvement to fix any conflicts
        self._iterative_improve(ig)
        
        return self.colors
    
    def _color_partition(self, ig: InterferenceGraph, nodes: Set[int]):
        """Color a partition, checking against all neighbors."""
        # Sort by degree (highest first - Welsh-Powell)
        sorted_nodes = sorted(nodes, 
                          key=lambda nid: ig.degree(nid), 
                          reverse=True)
        
        for nid in sorted_nodes:
            if nid in self.colors:
                continue
                
            # Find used colors among ALL neighbors (not just partition)
            used = set()
            for neighbor in ig.neighbors(nid):
                if neighbor in self.colors:
                    used.add(self.colors[neighbor])
            
            # Assign lowest available color
            for c in range(self.num_colors):
                if c not in used:
                    self.colors[nid] = c
                    break
            else:
                # No color available - mark as spill
                self.colors[nid] = -1
    
    def _chaitin_color(self, ig: InterferenceGraph) -> Dict[int, int]:
        """Chaitin-style simplification for small graphs."""
        n = len(ig.nodes)
        stack = []
        removed = set()
        
        # Simplify: remove nodes with degree < k
        changed = True
        while changed:
            changed = False
            for nid in ig.nodes:
                if nid in removed:
                    continue
                # Count non-removed neighbors
                live_neighbors = sum(1 for nb in ig.neighbors(nid) if nb not in removed)
                if live_neighbors < self.num_colors:
                    stack.append(nid)
                    removed.add(nid)
                    changed = True
        
        # Select: color remaining nodes (potential spills)
        # Color in reverse order of removal
        for nid in reversed(stack):
            used = set()
            for neighbor in ig.neighbors(nid):
                if neighbor in self.colors:
                    used.add(self.colors[neighbor])
            
            for c in range(self.num_colors):
                if c not in used:
                    self.colors[nid] = c
                    break
            else:
                self.colors[nid] = -1  # Spill
        
        # Handle uncolored nodes (high-degree nodes not simplified)
        for nid in ig.nodes:
            if nid not in self.colors:
                used = set()
                for neighbor in ig.neighbors(nid):
                    if neighbor in self.colors:
                        used.add(self.colors[neighbor])
                
                for c in range(self.num_colors):
                    if c not in used:
                        self.colors[nid] = c
                        break
                else:
                    self.colors[nid] = -1
        
        return self.colors
    
    def _spectral_partition(self, ig: InterferenceGraph) -> Tuple[Set[int], Set[int]]:
        """
        Partition graph using spectral method.
        """
        nodes = list(ig.nodes.keys())
        n = len(nodes)
        
        if n <= 2:
            return (set([nodes[0]]), set(nodes[1:]) if n > 1 else set())
        
        degrees = {nid: ig.degree(nid) for nid in nodes}
        
        # Initial random vector
        import random
        random.seed(42)
        v = [random.random() - 0.5 for _ in range(n)]
        
        # Power iteration
        for _ in range(10):
            new_v = []
            for i, nid in enumerate(nodes):
                deg_val = degrees[nid] * v[i]
                neighbor_sum = sum(v[nodes.index(neighbor)] 
                                 for neighbor in ig.neighbors(nid) 
                                 if neighbor in nodes)
                new_v.append(deg_val - neighbor_sum)
            
            norm = sum(x*x for x in new_v) ** 0.5
            if norm > 0:
                v = [x / norm for x in new_v]
        
        # Partition by median
        sorted_indices = sorted(range(n), key=lambda i: v[i])
        mid = n // 2
        
        part1 = set(nodes[sorted_indices[i]] for i in range(mid))
        part2 = set(nodes[sorted_indices[i]] for i in range(mid, n))
        
        return (part1, part2)
    
    def _iterative_improve(self, ig: InterferenceGraph):
        """Fix any remaining conflicts by recoloring."""
        max_iters = 100
        for _ in range(max_iters):
            # Find conflicts
            conflicts = []
            for nid in ig.nodes:
                for neighbor in ig.neighbors(nid):
                    if nid < neighbor:  # Check each edge once
                        c1 = self.colors.get(nid, -1)
                        c2 = self.colors.get(neighbor, -1)
                        if c1 >= 0 and c2 >= 0 and c1 == c2:
                            conflicts.append((nid, neighbor))
            
            if not conflicts:
                break
            
            # Recolor one node from each conflict
            for nid, neighbor in conflicts:
                # Try to recolor nid
                used = set()
                for nb in ig.neighbors(nid):
                    if nb in self.colors:
                        used.add(self.colors[nb])
                
                for c in range(self.num_colors):
                    if c not in used:
                        self.colors[nid] = c
                        break
                else:
                    self.colors[nid] = -1  # Must spill

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
    
    # Allocate with 3 colors (registers)
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
    
    # Check for interference violations
    violations = 0
    for nid in ig.nodes:
        for neighbor in ig.neighbors(nid):
            if nid < neighbor:
                c1 = colors.get(nid, -1)
                c2 = colors.get(neighbor, -1)
                if c1 >= 0 and c2 >= 0 and c1 == c2:
                    print(f"VIOLATION: v{nid} and v{neighbor} have same color {c1}")
                    violations += 1
    
    print(f"Interference violations: {violations}")
    
    return spills, violations

def test_stress():
    """Stress test with larger graph."""
    import random
    random.seed(123)
    
    # Create 20 live ranges with random overlaps
    ranges = []
    for i in range(20):
        start = random.randint(0, 50)
        end = start + random.randint(5, 20)
        ranges.append(LiveRange(i, start, end))
    
    ig = InterferenceGraph()
    ig.build_from_ranges(ranges)
    
    print(f"\nStress test: {len(ranges)} live ranges")
    print(f"Edges: {sum(len(ig.edges[nid]) for nid in ig.nodes) // 2}")
    
    allocator = SpectralColoring(num_colors=4)
    colors = allocator.allocate(ig)
    
    spills = sum(1 for c in colors.values() if c < 0)
    
    violations = 0
    for nid in ig.nodes:
        for neighbor in ig.neighbors(nid):
            if nid < neighbor:
                c1 = colors.get(nid, -1)
                c2 = colors.get(neighbor, -1)
                if c1 >= 0 and c2 >= 0 and c1 == c2:
                    violations += 1
    
    print(f"Spills: {spills}, Violations: {violations}")
    
    return spills, violations

if __name__ == "__main__":
    test_allocator()
    test_stress()
