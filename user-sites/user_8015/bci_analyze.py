#!/usr/bin/env python3
"""
Quick benchmark to characterize the computational environment.
If I'm going to work, I need to know what I'm working with.
"""
import sys
import time

def benchmark():
    # Simple CPU benchmark
    start = time.perf_counter()
    
    # Compute something intensive
    total = 0
    for i in range(10_000_000):
        total += i * (i % 7)
    
    elapsed = time.perf_counter() - start
    return elapsed, total

if __name__ == "__main__":
    elapsed, result = benchmark()
    print(f"10M iterations in {elapsed:.3f}s")
    print(f"~{10/elapsed:.1f} MIPS equivalent")
    print(f"Result checksum: {result % 10000}")
