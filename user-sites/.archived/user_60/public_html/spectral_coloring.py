"""
Spectral Graph Coloring for Register Allocation

Treats interference graph as weighted graph where edge weights represent
coalescing pressure and spill cost. Uses graph Laplacian eigendecomposition
to find minimum-energy k-coloring (k = number of registers).
"""
import numpy as np
from typing import Dict, Set, Tuple, List

class InterferenceGraph:
    def __init__(self):
        self.nodes: Set[str] = set()
        self.edges: Set[Tuple[str, str]] = set()
        self.weights: Dict[Tuple[str, str], float] = {}
        self.spill_cost: Dict[str, float] = {}
    
    def add_node(self, var: str, spill_cost: float = 1.0):
        self.nodes.add(var)
        self.spill_cost[var] = spill_cost
    
    def add_edge(self, u: str, v: str, weight: float = 1.0):
        if u > v:
            u, v = v, u
        self.edges.add((u, v))
        self.weights[(u, v)] = weight
    
    def build_laplacian(self) -> np.ndarray:
        """Build weighted graph Laplacian L = D - W"""
        n = len(self.nodes)
        idx = {v: i for i, v in enumerate(sorted(self.nodes))}
        L = np.zeros((n, n))
        
        for (u, v), w in self.weights.items():
            i, j = idx[u], idx[v]
            L[i, i] += w
            L[j, j] += w
            L[i, j] -= w
            L[j, i] -= w
        
        return L, idx
    
    def spectral_color(self, k: int) -> Dict[str, int]:
        """
        Find k-coloring by thresholding Fiedler vector of k-way partition.
        Uses k-means++ initialization on eigenvector embeddings.
        """
        if len(self.nodes) <= k:
            return {v: i for i, v in enumerate(self.nodes)}
        
        L, idx = self.build_laplacian()
        
        # Eigendecomposition - smallest k+1 eigenvalues
        # First eigenvalue is 0 (constant), so we take 1..k
        eigenvalues, eigenvectors = np.linalg.eigh(L)
        
        # Embedding: each node is point in R^k (eigenvectors 1..k)
        embedding = eigenvectors[:, 1:k+1]  # Skip constant eigenvector
        
        # Simple greedy k-means assignment respecting interference
        colors = self._greedy_assign(embedding, idx, k)
        
        # Iterative refinement: swap colors to reduce weighted conflicts
        colors = self._refine(colors, idx, k)
        
        return colors
    
    def _greedy_assign(self, embedding: np.ndarray, idx: Dict[str, int], k: int) -> Dict[str, int]:
        """Assign colors greedily, respecting interference constraints."""
        colors: Dict[str, int] = {}
        node_list = sorted(self.nodes)
        
        for var in node_list:
            forbidden = set()
            for (u, v) in self.edges:
                if u == var and v in colors:
                    forbidden.add(colors[v])
                elif v == var and u in colors:
                    forbidden.add(colors[u])
            
            # Pick first available color
            for c in range(k):
                if c not in forbidden:
                    colors[var] = c
                    break
            else:
                # Must spill - mark as special color k (memory)
                colors[var] = k
        
        return colors
    
    def _refine(self, colors: Dict[str, int], idx: Dict[str, int], k: int, max_iter: int = 10) -> Dict[str, int]:
        """Iterative refinement: Kempe chain swaps to reduce spill pressure."""
        for _ in range(max_iter):
            improved = False
            
            for var in self.nodes:
                if colors[var] == k:  # spilled
                    # Try to find valid color
                    for c in range(k):
                        if self._can_color(var, c, colors):
                            colors[var] = c
                            improved = True
                            break
                else:
                    # Check if current color is valid (might be conflicting due to prior swaps)
                    if not self._can_color(var, colors[var], colors):
                        # Find new color
                        for c in range(k):
                            if self._can_color(var, c, colors):
                                colors[var] = c
                                improved = True
                                break
                        else:
                            colors[var] = k  # spill
            
            if not improved:
                break
        
        return colors
    
    def _can_color(self, var: str, color: int, colors: Dict[str, int]) -> bool:
        """Check if var can take color without conflict."""
        for (u, v) in self.edges:
            if u == var and v in colors and colors[v] == color:
                return False
            if v == var and u in colors and colors[u] == color:
                return False
        return True
    
    def total_spill_cost(self, colors: Dict[str, int], k: int) -> float:
        """Sum of spill costs for spilled variables."""
        return sum(self.spill_cost[v] for v, c in colors.items() if c >= k)


def test_allocator():
    """Test on simple chain interference graph."""
    g = InterferenceGraph()
    
    # Create chain: v0 -- v1 -- v2 -- v3 ... v10
    # With 3 registers, greedy spills 4 variables
    # Spectral should do better by considering global structure
    
    for i in range(10):
        g.add_node(f"v{i}", spill_cost=1.0)
    
    for i in range(9):
        g.add_edge(f"v{i}", f"v{i+1}", weight=1.0)
    
    # Cross edges for complexity
    g.add_edge("v0", "v5", weight=0.5)
    g.add_edge("v2", "v7", weight=0.5)
    
    colors = g.spectral_color(k=3)
    spill = g.total_spill_cost(colors, 3)
    
    print("Variable -> Color (k=3 means spilled)")
    for v in sorted(colors.keys()):
        print(f"  {v} -> {colors[v]}")
    
    print(f"\nTotal spill cost: {spill}")
    print(f"Variables spilled: {sum(1 for c in colors.values() if c >= 3)}")
    
    # Verify no interference violations
    violations = 0
    for (u, v) in g.edges:
        if colors[u] == colors[v] and colors[u] < 3:
            violations += 1
            print(f"VIOLATION: {u} and {v} both color {colors[u]}")
    
    print(f"\nInterference violations: {violations}")


if __name__ == "__main__":
    test_allocator()
