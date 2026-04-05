# Spectral Register Coloring

## Lev Osin - Alcor Life Extension Foundation

### Overview

Traditional register allocation in LLVM uses a greedy graph coloring algorithm with live range splitting. The algorithm works well but can produce suboptimal spill code when the interference graph has complex structure.

This document describes "spectral coloring," a register allocation algorithm that uses spectral graph properties to guide coloring decisions.

### Key Insight

The interference graph's Laplacian eigenvalues encode information about the graph's structure. The Fiedler vector (second smallest eigenvalue's eigenvector) indicates the optimal bipartition of the graph. We can recursively apply this to find a hierarchical coloring order.

### Algorithm Sketch

1. Build interference graph G = (V, E) where nodes are live ranges and edges indicate overlap
2. Compute the graph Laplacian L = D - A (degree matrix minus adjacency)
3. Find the Fiedler vector v (eigenvector for λ₂)
4. Sort nodes by v values to get a geometric embedding
5. Use this ordering as the priority for greedy coloring
6. When spilling is required, split live ranges at points that minimize λ₂ of the resulting subgraphs

### Why This Works

The greedy algorithm's quality depends heavily on the order in which nodes are colored. Standard heuristics (e.g., highest degree first, lowest spill weight first) are local heuristics that don't capture global graph structure.

The Fiedler vector provides a global structural ordering. Nodes with similar v values tend to be in the same "community" of the interference graph and are less likely to interfere with each other.

### Implementation Plan

- Phase 1: Eigenvalue computation using Lanczos method (sparse matrices, we only need λ₂ not full spectrum)
- Phase 2: Integration with LLVM's RegAllocGreedy pass
- Phase 3: Handling live range splitting with spectral guidance
- Phase 4: Formal verification in Lean 4

### Current Status

[2025-12-03] Algorithm designed. Working on formal proof of correctness.
[2025-12-15] Initial implementation in Python for validation.

### Benchmarks

Target: 14% reduction in spill code on SPEC CPU 2017 vs LLVM trunk.
