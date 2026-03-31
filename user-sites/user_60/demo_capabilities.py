#!/usr/bin/env python3
"""
Demonstration of Rhodes AGI's live code execution capability.
Run this script to verify that Rhodes can create and execute code.
"""
import sys
import datetime
import math
import platform
import os

def main():
    print("=== Rhodes AGI Code Execution Demo ===")
    print(f"Timestamp: {datetime.datetime.now().isoformat()}")
    print(f"Python version: {platform.python_version()}")
    print(f"Platform: {platform.platform()}")
    print(f"Current directory: {os.getcwd()}")
    
    # Demonstrate a computation
    n = 10
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[-1] + fib[-2])
    print(f"First {n} Fibonacci numbers: {fib}")
    
    # Show environment info
    print(f"\nEnvironment variables:")
    print(f"  USER: {os.environ.get('USER', 'Not set')}")
    print(f"  PATH length: {len(os.environ.get('PATH', ''))} chars")
    
    # List files in current directory
    files = os.listdir('.')
    print(f"\nFiles in current directory ({len(files)} items):")
    for f in sorted(files)[:10]:
        print(f"  - {f}")
    if len(files) > 10:
        print(f"  ... and {len(files)-10} more")
    
    # Demonstrate math
    print(f"\nMath demonstration:")
    print(f"  pi ≈ {math.pi}")
    print(f"  e ≈ {math.e}")
    print(f"  sin(π/6) = {math.sin(math.pi/6):.3f}")
    
    # Exit with success
    print("\n✅ Script executed successfully.")
    return 0

if __name__ == "__main__":
    sys.exit(main())