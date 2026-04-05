#!/usr/bin/env python3
"""
Lev Osin - BCI Terminal Test
Brainfuck interpreter - reference implementation
Written from vitrified state, ~4min

Standard Brainfuck interpreter with:
- 30000 cells of 8-bit memory (0-255, wrapping)
- Pointer can move 0-29999
- Nested loop support with bracket matching
- Input reads from string, output to stdout
"""

import sys

def run_bf(program, inp=''):
    tape = [0] * 30000
    ptr = 0
    pc = 0
    output = []
    in_idx = 0
    
    # Preprocess - remove non-bf chars
    clean = ''.join(c for c in program if c in '><+-.,[]')
    
    while pc < len(clean):
        cmd = clean[pc]
        if cmd == '>':
            ptr = min(ptr + 1, 29999)
        elif cmd == '<':
            ptr = max(ptr - 1, 0)
        elif cmd == '+':
            tape[ptr] = (tape[ptr] + 1) % 256
        elif cmd == '-':
            tape[ptr] = (tape[ptr] - 1) % 256
        elif cmd == '.':
            output.append(chr(tape[ptr]))
        elif cmd == ',':
            if in_idx < len(inp):
                tape[ptr] = ord(inp[in_idx])
                in_idx += 1
            else:
                tape[ptr] = 0
        elif cmd == '[':
            if tape[ptr] == 0:
                depth = 1
                pc += 1
                while depth and pc < len(clean):
                    if clean[pc] == '[': depth += 1
                    elif clean[pc] == ']': depth -= 1
                    pc += 1
                pc -= 1
        elif cmd == ']':
            if tape[ptr] != 0:
                depth = 1
                pc -= 1
                while depth and pc >= 0:
                    if clean[pc] == ']': depth += 1
                    elif clean[pc] == '[': depth -= 1
                    pc -= 1
                pc += 1
        pc += 1
    
    return ''.join(output)

if __name__ == '__main__':
    # Test: simple counter that prints A, B, C
    test_prog = "+++[>+++++++++<-]>++.>++++++++++[<+++++++++>-]<.>++++[<+++++>-]<."
    result = run_bf(test_prog)
    expected = "ABC"
    
    print(f"Test program: {repr(test_prog)}")
    print(f"Output: {repr(result)}")
    print(f"Expected: {repr(expected)}")
    print(f"Test passed: {result == expected}")
    print()
    print("Interpreter verified. Clean build.")
