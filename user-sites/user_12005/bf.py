#!/usr/bin/env python3
"""Brainfuck interpreter - Lev Osin, Alcor Scottsdale"""

import sys

def run(prog):
    tape = [0] * 30000
    ptr = 0
    pc = 0
    
    # Precompute bracket matching
    bracket_map = {}
    stack = []
    for i, c in enumerate(prog):
        if c == '[':
            stack.append(i)
        elif c == ']':
            if stack:
                j = stack.pop()
                bracket_map[j] = i
                bracket_map[i] = j
    
    while pc < len(prog):
        c = prog[pc]
        if c == '>':
            ptr = (ptr + 1) % 30000
        elif c == '<':
            ptr = (ptr - 1 + 30000) % 30000
        elif c == '+':
            tape[ptr] = (tape[ptr] + 1) & 0xFF
        elif c == '-':
            tape[ptr] = (tape[ptr] - 1) & 0xFF
        elif c == '.':
            sys.stdout.write(chr(tape[ptr]))
            sys.stdout.flush()
        elif c == ',':
            tape[ptr] = ord(sys.stdin.read(1)) if sys.stdin.readable() else 0
        elif c == '[':
            if tape[ptr] == 0:
                pc = bracket_map.get(pc, pc)
        elif c == ']':
            if tape[ptr] != 0:
                pc = bracket_map.get(pc, pc)
        pc += 1

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <program.bf>")
        sys.exit(1)
    
    with open(sys.argv[1], 'r') as f:
        prog = f.read()
    
    run(prog)
