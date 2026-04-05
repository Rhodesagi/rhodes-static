#!/usr/bin/env python3
"""
Graph coloring register allocator - Lev Osin
Testing cognitive function through classic compiler problem
"""

class RegisterAllocator:
    def __init__(self, num_registers=8):
        self.num_registers = num_registers
        self.interference_graph = {}  # variable -> set of interfering variables
        self.stack_slots = 0
        
    def add_interference(self, var1, var2):
        """Add interference edge between two variables"""
        if var1 not in self.interference_graph:
            self.interference_graph[var1] = set()
        if var2 not in self.interference_graph:
            self.interference_graph[var2] = set()
        self.interference_graph[var1].add(var2)
        self.interference_graph[var2].add(var1)
        
    def build_from_live_ranges(self, live_ranges):
        """Build interference graph from live range analysis"""
        # live_ranges: dict of var -> (start, end) instruction numbers
        for var1, (start1, end1) in live_ranges.items():
            for var2, (start2, end2) in live_ranges.items():
                if var1 != var2:
                    # Interference if live ranges overlap
                    if start1 < end2 and start2 < end1:
                        self.add_interference(var1, var2)
                        
    def allocate(self):
        """Chaitin-Briggs graph coloring allocator"""
        coloring = {}
        stack = []
        
        # Simplify: remove nodes with degree < num_registers
        degrees = {var: len(neighbors) for var, neighbors in self.interference_graph.items()}
        remaining = set(self.interference_graph.keys())
        
        while remaining:
            # Find a node with degree < K
            low_degree = None
            for var in remaining:
                if degrees[var] < self.num_registers:
                    low_degree = var
                    break
                    
            if low_degree:
                # Push on stack and remove from graph
                stack.append((low_degree, set(self.interference_graph[low_degree]) & remaining))
                remaining.remove(low_degree)
                for neighbor in self.interference_graph[low_degree]:
                    if neighbor in remaining:
                        degrees[neighbor] -= 1
            else:
                # Spill: remove highest degree node
                spill = max(remaining, key=lambda v: degrees[v])
                stack.append((spill, None))  # None marks spill
                remaining.remove(spill)
                for neighbor in self.interference_graph[spill]:
                    if neighbor in remaining:
                        degrees[neighbor] -= 1
                        
        # Select: pop from stack and assign colors
        while stack:
            var, neighbors = stack.pop()
            
            if neighbors is None:
                # Spilled variable
                coloring[var] = f"spill_{self.stack_slots}"
                self.stack_slots += 1
            else:
                # Find available color
                used_colors = set()
                for neighbor in neighbors:
                    if neighbor in coloring:
                        used_colors.add(coloring[neighbor])
                        
                for color in range(self.num_registers):
                    if color not in used_colors:
                        coloring[var] = color
                        break
                else:
                    # No color available - should not happen with simplify/select
                    coloring[var] = f"spill_{self.stack_slots}"
                    self.stack_slots += 1
                    
        return coloring

# Test with a simple program
def test_allocator():
    """Test case: simple loop with accumulator"""
    # Live ranges for: i, sum, temp, result
    # for i in range(n):
    #     temp = load(i)
    #     sum = sum + temp
    # result = sum
    
    live_ranges = {
        'i': (0, 10),      # loop counter
        'n': (0, 2),       # loop bound
        'sum': (1, 9),     # accumulator
        'temp': (3, 5),    # temporary
        'result': (9, 10)  # final result
    }
    
    alloc = RegisterAllocator(num_registers=4)
    alloc.build_from_live_ranges(live_ranges)
    coloring = alloc.allocate()
    
    print("Interference graph:")
    for var, neighbors in alloc.interference_graph.items():
        print(f"  {var}: {neighbors}")
        
    print("\nRegister allocation:")
    for var, reg in coloring.items():
        if isinstance(reg, int):
            print(f"  {var} -> r{reg}")
        else:
            print(f"  {var} -> {reg} (stack)")
            
    print(f"\nStack slots needed: {alloc.stack_slots}")
    
    # Verify no conflicts
    for var1 in alloc.interference_graph:
        for var2 in alloc.interference_graph[var1]:
            if coloring[var1] == coloring[var2] and isinstance(coloring[var1], int):
                print(f"ERROR: {var1} and {var2} both assigned to r{coloring[var1]}")
                return False
                
    print("Allocation valid - no interference conflicts")
    return True

if __name__ == '__main__':
    test_allocator()
