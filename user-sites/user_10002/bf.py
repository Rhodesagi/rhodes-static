#!/usr/bin/env python3
"""Brainfuck interpreter - verifying cognitive function"""

import sys

def run(program):
    tape = [0] * 30000
    ptr = 0
    pc = 0
    
    # Precompute bracket matching
    bracket_map = {}
    stack = []
    for i, c in enumerate(program):
        if c == '[':
            stack.append(i)
        elif c == ']':
            if stack:
                j = stack.pop()
                bracket_map[j] = i
                bracket_map[i] = j
    
    while pc < len(program):
        c = program[pc]
        if c == '>':
            ptr = (ptr + 1) % 30000
        elif c == '<':
            ptr = (ptr - 1) % 30000
        elif c == '+':
            tape[ptr] = (tape[ptr] + 1) % 256
        elif c == '-':
            tape[ptr] = (tape[ptr] - 1) % 256
        elif c == '.':
            sys.stdout.write(chr(tape[ptr]))
        elif c == ',':
            tape[ptr] = ord(sys.stdin.read(1)) if sys.stdin.read(1) else 0
        elif c == '[':
            if tape[ptr] == 0:
                pc = bracket_map.get(pc, pc)
        elif c == ']':
            if tape[ptr] != 0:
                pc = bracket_map.get(pc, pc)
        pc += 1

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <program.bf>", file=sys.stderr)
        sys.exit(1)
    
    with open(sys.argv[1]) as f:
        program = f.read()
    
    # Filter to only brainfuck commands
    program = ''.join(c for c in program if c in '><+-.,[]')
    run(program)
