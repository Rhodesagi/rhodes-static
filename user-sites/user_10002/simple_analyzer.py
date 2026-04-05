#!/usr/bin/env python3
"""
Simplified static analyzer - testing compiler cognition
"""

import sys
import re

def analyze(source):
    lines = source.split('\n')
    
    # Find function definitions
    func_pattern = re.compile(r'^(\w+\s+)+(\w+)\s*\(([^)]*)\)\s*\{')
    
    functions = []
    in_function = False
    func_brace_depth = 0
    current_func = None
    complexity = 1
    
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        
        # Skip comments and empty lines
        if not stripped or stripped.startswith('//'):
            continue
        
        # Look for function start
        if not in_function:
            match = func_pattern.search(line)
            if match:
                return_type = match.group(1).strip()
                name = match.group(2)
                params = match.group(3)
                in_function = True
                func_brace_depth = 1
                current_func = {
                    'name': name,
                    'return_type': return_type,
                    'line': i,
                    'params': params,
                    'complexity': 1
                }
                continue
        
        # Inside function body
        if in_function:
            # Count braces
            func_brace_depth += stripped.count('{')
            func_brace_depth -= stripped.count('}')
            
            # Check for control flow
            if re.search(r'\b(if|while|for|case)\b', stripped):
                current_func['complexity'] += 1
            if '&&' in stripped or '||' in stripped:
                current_func['complexity'] += stripped.count('&&') + stripped.count('||')
            
            # Function ended
            if func_brace_depth <= 0:
                functions.append(current_func)
                in_function = False
                current_func = None
    
    return functions

def report(functions):
    print(f"\n{'='*60}")
    print(f"STATIC ANALYSIS REPORT")
    print(f"{'='*60}")
    print(f"Functions found: {len(functions)}")
    
    if functions:
        avg_complexity = sum(f['complexity'] for f in functions) / len(functions)
        print(f"Average cyclomatic complexity: {avg_complexity:.2f}")
        
        print(f"\n{'Function':<25} {'Line':<8} {'Complexity':<12}")
        print('-'*45)
        for func in sorted(functions, key=lambda f: f['complexity'], reverse=True):
            print(f"{func['name']:<25} {func['line']:<8} {func['complexity']:<12}")
        
        high = [f for f in functions if f['complexity'] > 10]
        if high:
            print(f"\n⚠ High complexity: {len(high)} function(s)")
    
    print(f"{'='*60}\n")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <source.c>", file=sys.stderr)
        sys.exit(1)
    
    with open(sys.argv[1]) as f:
        source = f.read()
    
    functions = analyze(source)
    report(functions)
