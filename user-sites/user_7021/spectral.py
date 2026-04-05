"""
Spectral Coloring Register Allocator
Lev Osin - November 2025 (post-rewarming)

A graph coloring register allocator that uses spectral methods
to find better colorings than greedy heuristics, reducing spill code.

This is a research prototype written without distractions.
"""
from typing import List, Dict, Set, Tuple
import heapq
from dataclasses import dataclass, field

@dataclass
class InterferenceGraph:
    """Register interference graph for a basic block."""
    nodes: Set[str] = field(default_factory=set)
    edges: Dict[str, Set[str]] = field(default_factory=dict)
    weights: Dict[Tuple[str, str], float] = field(default_factory=dict)
    degrees: Dict[str, int] = field(default_factory=dict)
    
    def add_node(self, node: str):
        if node not in self.nodes:
            self.nodes.add(node)
            self.edges[node] = set()
    
    def add_edge(self, u: str, v: str, weight: float = 1.0):
        if u == v:
            return
        self.add_node(u)
        self.add_node(v)
        self.edges[u].add(v)
        self.edges[v].add(u)
        key = tuple(sorted([u, v]))
        self.weights[key] = self.weights.get(key, 0.0) + weight
    
    def get_degree(self, node: str) -> int:
        return len(self.edges[node])
    
    def neighbors(self, node: str) -> Set[str]:
        return self.edges[node]

class SpectralColoringAllocator:
    """
    Spectral graph coloring for register allocation.
    
    Uses the Fiedler vector (eigenvector of Laplacian for 2nd smallest eigenvalue)
    to guide coloring decisions, often producing better colorings than
    traditional greedy approaches like Chaitin-Briggs.
    
    Key insight: The Fiedler vector minimizes the quadratic form
    x^T L x = sum_{(i,j) in E} (x_i - x_j)^2, which tends to place
    interfering variables at different ends of the spectrum.
    """
    
    def __init__(self, num_colors: int = 16, max_iterations: int = 100):
        self.num_colors = num_colors
        self.max_iterations = max_iterations
        self.k = num_colors  # number of registers
        
    def build_laplacian(self, graph: InterferenceGraph) -> Dict[str, Dict[str, float]]:
        """Build weighted graph Laplacian matrix as dict of dicts."""
        L = {node: {} for node in graph.nodes}
        
        for node in graph.nodes:
            degree = sum(
                graph.weights.get(tuple(sorted([node, neighbor])), 1.0)
                for neighbor in graph.neighbors(node)
            )
            L[node][node] = degree  # Diagonal
            
            for neighbor in graph.neighbors(node):
                weight = graph.weights.get(tuple(sorted([node, neighbor])), 1.0)
                L[node][neighbor] = -weight
        
        return L
    
    def power_iteration(self, graph: InterferenceGraph, L: Dict, 
                        num_eigenvectors: int = 3) -> Dict[str, List[float]]:
        """
        Compute approximate eigenvectors using power iteration with deflation.
        Returns dict mapping node -> [eigenvalue components].
        """
        nodes = list(graph.nodes)
        n = len(nodes)
        if n == 0:
            return {}
        
        # Initialize random vectors
        import random
        random.seed(42)
        
        eigenvectors = []
        
        for eig_idx in range(num_eigenvectors):
            # Initialize random vector
            v = {node: random.random() - 0.5 for node in nodes}
            
            # Gram-Schmidt orthogonalization against previous eigenvectors
            for prev_eig in eigenvectors:
                proj = sum(v[n] * prev_eig[n] for n in nodes)
                v = {n: v[n] - proj * prev_eig[n] for n in nodes}
            
            # Normalize
            norm = sum(x*x for x in v.values()) ** 0.5
            if norm > 0:
                v = {n: v[n]/norm for n in nodes}
            
            # Power iteration
            for _ in range(self.max_iterations):
                # Matrix-vector multiplication: L * v
                new_v = {}
                for node in nodes:
                    val = 0.0
                    for other, weight in L[node].items():
                        val += weight * v[other]
                    new_v[node] = val
                
                # Gram-Schmidt against previous eigenvectors
                for prev_eig in eigenvectors:
                    proj = sum(new_v[n] * prev_eig[n] for n in nodes)
                    new_v = {n: new_v[n] - proj * prev_eig[n] for n in nodes}
                
                # Normalize
                norm = sum(x*x for x in new_v.values()) ** 0.5
                if norm < 1e-10:
                    break
                v = {n: new_v[n]/norm for n in nodes}
            
            eigenvectors.append(v)
        
        # Return spectral embedding (Fiedler and higher eigenvectors)
        result = {}
        for node in nodes:
            result[node] = [v[node] for v in eigenvectors]
        return result
    
    def allocate(self, graph: InterferenceGraph) -> Dict[str, int]:
        """
        Perform register allocation using spectral coloring.
        
        Returns mapping from virtual register to physical register (color).
        Spilled registers are assigned color -1.
        """
        if not graph.nodes:
            return {}
        
        # Build Laplacian
        L = self.build_laplacian(graph)
        
        # Compute spectral embedding (Fiedler vector + higher eigenvectors)
        embedding = self.power_iteration(graph, L, num_eigenvectors=3)
        
        # Sort nodes by spectral coordinate (Fiedler vector value)
        # This tends to separate interfering nodes
        nodes_sorted = sorted(
            graph.nodes, 
            key=lambda n: (embedding.get(n, [0, 0, 0])[0], 
                         embedding.get(n, [0, 0, 0])[1],
                         graph.get_degree(n))
        )
        
        # Greedy coloring guided by spectral ordering
        coloring = {}
        spilled = set()
        
        for node in nodes_sorted:
            if node in spilled:
                continue
            
            # Find colors used by neighbors
            forbidden = set()
            for neighbor in graph.neighbors(node):
                if neighbor in coloring:
                    forbidden.add(coloring[neighbor])
            
            # Try to assign a color
            assigned = False
            for color in range(self.num_colors):
                if color not in forbidden:
                    coloring[node] = color
                    assigned = True
                    break
            
            if not assigned:
                # Need to spill
                spilled.add(node)
        
        # Mark spilled nodes
        for node in spilled:
            coloring[node] = -1
        
        return coloring
    
    def compute_spill_cost(self, graph: InterferenceGraph, coloring: Dict[str, int]) -> int:
        """Count number of spilled nodes."""
        return sum(1 for c in coloring.values() if c < 0)
    
    def compute_interference_cost(self, graph: InterferenceGraph, 
                                   coloring: Dict[str, int]) -> float:
        """
        Compute sum of interference conflicts (same color for interfering nodes).
        Should be 0 for valid coloring.
        """
        cost = 0.0
        for u in graph.nodes:
            for v in graph.neighbors(u):
                if u < v:  # avoid double counting
                    if coloring.get(u, -1) >= 0 and coloring.get(v, -1) >= 0:
                        if coloring[u] == coloring[v]:
                            weight = graph.weights.get(tuple(sorted([u, v])), 1.0)
                            cost += weight
        return cost


def test_spectral_allocator():
    """Test spectral coloring on sample interference graphs."""
    print("=== Spectral Coloring Register Allocator Tests ===\n")
    
    # Test 1: Simple chain graph (should color with 2 colors)
    print("Test 1: Path graph P4 (should use 2 colors)")
    g1 = InterferenceGraph()
    g1.add_edge("v0", "v1")
    g1.add_edge("v1", "v2")
    g1.add_edge("v2", "v3")
    
    alloc = SpectralColoringAllocator(num_colors=4)
    coloring = alloc.allocate(g1)
    print(f"  Coloring: {coloring}")
    spill_cost = alloc.compute_spill_cost(g1, coloring)
    interference = alloc.compute_interference_cost(g1, coloring)
    print(f"  Spilled: {spill_cost}, Interference violations: {interference}")
    assert spill_cost == 0, "Path graph with 4 nodes should fit in 4 colors"
    assert interference == 0, "No interference violations expected"
    print("  PASSED\n")
    
    # Test 2: Cycle C5 (needs 3 colors minimum)
    print("Test 2: Cycle C5 (needs 3 colors)")
    g2 = InterferenceGraph()
    for i in range(5):
        g2.add_edge(f"v{i}", f"v{(i+1)%5}")
    
    alloc2 = SpectralColoringAllocator(num_colors=3)
    coloring2 = alloc2.allocate(g2)
    print(f"  Coloring: {coloring2}")
    spill_cost2 = alloc2.compute_spill_cost(g2, coloring2)
    interference2 = alloc2.compute_interference_cost(g2, coloring2)
    print(f"  Spilled: {spill_cost2}, Interference violations: {interference2}")
    assert interference2 == 0, "No interference violations expected"
    print("  PASSED\n")
    
    # Test 3: Complete graph K4 (needs exactly 4 colors)
    print("Test 3: Complete graph K4 (needs 4 colors)")
    g3 = InterferenceGraph()
    nodes = ["v0", "v1", "v2", "v3"]
    for i in range(4):
        for j in range(i+1, 4):
            g3.add_edge(nodes[i], nodes[j])
    
    alloc3 = SpectralColoringAllocator(num_colors=4)
    coloring3 = alloc3.allocate(g3)
    print(f"  Coloring: {coloring3}")
    spill_cost3 = alloc3.compute_spill_cost(g3, coloring3)
    interference3 = alloc3.compute_interference_cost(g3, coloring3)
    print(f"  Spilled: {spill_cost3}, Interference violations: {interference3}")
    assert spill_cost3 == 0, "K4 should fit in 4 colors"
    assert interference3 == 0, "No interference violations expected"
    print("  PASSED\n")
    
    # Test 4: Complete graph K5 with 4 colors (must spill)
    print("Test 4: Complete graph K5 with 4 colors (should spill 1)")
    g4 = InterferenceGraph()
    nodes = [f"v{i}" for i in range(5)]
    for i in range(5):
        for j in range(i+1, 5):
            g4.add_edge(nodes[i], nodes[j])
    
    alloc4 = SpectralColoringAllocator(num_colors=4)
    coloring4 = alloc4.allocate(g4)
    print(f"  Coloring: {coloring4}")
    spill_cost4 = alloc4.compute_spill_cost(g4, coloring4)
    interference4 = alloc4.compute_interference_cost(g4, coloring4)
    print(f"  Spilled: {spill_cost4}, Interference violations: {interference4}")
    # K5 needs 5 colors, so with 4 colors at least one must spill
    assert spill_cost4 >= 1, "K5 with 4 colors must spill at least 1"
    assert interference4 == 0, "No interference violations expected"
    print("  PASSED\n")
    
    print("=== All spectral coloring tests passed ===")

if __name__ == "__main__":
    test_spectral_allocator()
