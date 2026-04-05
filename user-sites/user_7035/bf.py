#!/usr/bin/env python3
"""Brainfuck interpreter - Lev Osin, 2025"""
import sys

def run(program: str):
    tape = [0] * 30000
    ptr = 0
    pc = 0
    
    # Precompute bracket matches
    stack = []
    matches = {}
    for i, c in enumerate(program):
        if c == '[':
            stack.append(i)
        elif c == ']':
            if stack:
                j = stack.pop()
                matches[j] = i
                matches[i] = j
    
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
            print(chr(tape[ptr]), end='', flush=True)
        elif c == ',':
            ch = sys.stdin.read(1)
            tape[ptr] = ord(ch) if ch else 0
        elif c == '[':
            if tape[ptr] == 0:
                pc = matches.get(pc, pc)
        elif c == ']':
            if tape[ptr] != 0:
                pc = matches.get(pc, pc)
        pc += 1

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <program.bf>", file=sys.stderr)
        sys.exit(1)
    
    with open(sys.argv[1]) as f:
        program = f.read()
    
    # Filter to valid BF chars only
    program = ''.join(c for c in program if c in '><+-.,[]')
    run(program)
