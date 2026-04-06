#!/usr/bin/env python3
"""Test spectral vs greedy allocator on various graph types."""

import random
from spectral_coloring import LiveRange, InterferenceGraph, SpectralColoring

def count_spills(colors):
    return sum(1 for c in colors.values() if c < 0)

def count_violations(ig, colors):
    violations = 0
    for nid in ig.nodes:
        for neighbor in ig.neighbors(nid):
            if nid < neighbor:
                c1 = colors.get(nid, -1)
                c2 = colors.get(neighbor, -1)
                if c1 >= 0 and c2 >= 0 and c1 == c2:
                    violations += 1
    return violations

def test_dense_graph(num_ranges, num_regs, seed):
    """Test on a densely connected interference graph."""
    random.seed(seed)
    
    # Generate longer live ranges for higher interference
    ranges = []
    for i in range(num_ranges):
        start = random.randint(0, 100)
        end = start + random.randint(30, 80)
        ranges.append(LiveRange(i, start, end))
    
    ig = InterferenceGraph()
    ig.build_from_ranges(ranges)
    
    num_edges = sum(len(e) for e in ig.edges.values()) // 2
    density = num_edges / (num_ranges * (num_ranges - 1) / 2) * 100
    
    # Spectral
    spectral = SpectralColoring(num_colors=num_regs)
    s_colors = spectral.allocate(ig)
    s_spills = count_spills(s_colors)
    s_viol = count_violations(ig, s_colors)
    
    # Greedy (Welsh-Powell)
    greedy = SpectralColoring(num_colors=num_regs)
    g_colors = greedy._greedy_color(ig)
    g_spills = count_spills(g_colors)
    g_viol = count_violations(ig, g_colors)
    
    return {
        'nodes': num_ranges,
        'edges': num_edges,
        'density': density,
        'spectral_spills': s_spills,
        'greedy_spills': g_spills,
        'spectral_viol': s_viol,
        'greedy_viol': g_viol
    }

def main():
    print("=== Register Allocator Comparison ===\n")
    
    configs = [
        (50, 8, 100),
        (100, 16, 200),
        (100, 8, 300),  # High pressure
        (200, 16, 400),
        (200, 8, 500),  # Very high pressure
    ]
    
    for num_ranges, num_regs, seed in configs:
        print(f"\nTest: {num_ranges} ranges, {num_regs} registers")
        result = test_dense_graph(num_ranges, num_regs, seed)
        
        print(f"  Graph: {result['nodes']} nodes, {result['edges']} edges ({result['density']:.1f}% density)")
        print(f"  Spectral: {result['spectral_spills']} spills, {result['spectral_viol']} violations")
        print(f"  Greedy:   {result['greedy_spills']} spills, {result['greedy_viol']} violations")
        
        if result['spectral_spills'] < result['greedy_spills']:
            improvement = (result['greedy_spills'] - result['spectral_spills']) / result['greedy_spills'] * 100
            print(f"  -> Spectral wins by {improvement:.1f}%")
        elif result['greedy_spills'] < result['spectral_spills']:
            improvement = (result['spectral_spills'] - result['greedy_spills']) / result['spectral_spills'] * 100
            print(f"  -> Greedy wins by {improvement:.1f}%")
        else:
            print(f"  -> Tie")

if __name__ == "__main__":
    main()
