#!/usr/bin/env python3
import sys

def run(prog):
    tape = [0] * 30000
    ptr = 0
    pc = 0
    brackets = {i: j for i, j in find_brackets(prog)}
    
    while pc < len(prog):
        c = prog[pc]
        if c == '>': ptr = (ptr + 1) % 30000
        elif c == '<': ptr = (ptr - 1) % 30000
        elif c == '+': tape[ptr] = (tape[ptr] + 1) & 255
        elif c == '-': tape[ptr] = (tape[ptr] - 1) & 255
        elif c == '.': sys.stdout.write(chr(tape[ptr]))
        elif c == ',': tape[ptr] = ord(sys.stdin.read(1)) if not sys.stdin.isatty() else 0
        elif c == '[' and not tape[ptr]: pc = brackets[pc]
        elif c == ']' and tape[ptr]: pc = brackets[pc]
        pc += 1

def find_brackets(prog):
    stack = []
    pairs = {}
    for i, c in enumerate(prog):
        if c == '[': stack.append(i)
        elif c == ']':
            j = stack.pop()
            pairs[j], pairs[i] = i, j
    return pairs.items()

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <program.bf>", file=sys.stderr)
        sys.exit(1)
    with open(sys.argv[1]) as f:
        run(f.read())
