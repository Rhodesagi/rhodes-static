#!/usr/bin/env python3
"""Brainfuck interpreter - testing BCI I/O path"""

import sys

def run(program: str) -> None:
    tape = [0] * 30000
    ptr = 0
    pc = 0
    
    # Precompute bracket matches
    stack = []
    match = {}
    for i, c in enumerate(program):
        if c == '[':
            stack.append(i)
        elif c == ']':
            if not stack:
                raise ValueError(f"Unmatched ] at {i}")
            j = stack.pop()
            match[j] = i
            match[i] = j
    if stack:
        raise ValueError("Unmatched [")
    
    while pc < len(program):
        c = program[pc]
        if c == '>':
            ptr += 1
        elif c == '<':
            ptr -= 1
        elif c == '+':
            tape[ptr] = (tape[ptr] + 1) & 0xFF
        elif c == '-':
            tape[ptr] = (tape[ptr] - 1) & 0xFF
        elif c == '.':
            sys.stdout.write(chr(tape[ptr]))
            sys.stdout.flush()
        elif c == ',':
            ch = sys.stdin.read(1)
            tape[ptr] = ord(ch) if ch else 0
        elif c == '[':
            if tape[ptr] == 0:
                pc = match[pc]
        elif c == ']':
            if tape[ptr] != 0:
                pc = match[pc]
        pc += 1

if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            code = f.read()
    else:
        code = sys.stdin.read()
    # Strip non-BF characters
    code = ''.join(c for c in code if c in '><+-.,[]')
    run(code)