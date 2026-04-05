#!/usr/bin/env python3
import sys

def run(prog):
    tape = [0] * 30000
    ptr = 0
    pc = 0
    while pc < len(prog):
        c = prog[pc]
        if c == '>': ptr += 1
        elif c == '<': ptr -= 1
        elif c == '+': tape[ptr] = (tape[ptr] + 1) & 255
        elif c == '-': tape[ptr] = (tape[ptr] - 1) & 255
        elif c == '.': sys.stdout.write(chr(tape[ptr]))
        elif c == ',': tape[ptr] = ord(sys.stdin.read(1)) if sys.stdin else 0
        elif c == '[':
            if tape[ptr] == 0:
                depth = 1
                while depth:
                    pc += 1
                    if prog[pc] == '[': depth += 1
                    elif prog[pc] == ']': depth -= 1
        elif c == ']':
            if tape[ptr] != 0:
                depth = 1
                while depth:
                    pc -= 1
                    if prog[pc] == ']': depth += 1
                    elif prog[pc] == '[': depth -= 1
        pc += 1

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: bf.py <file>", file=sys.stderr)
        sys.exit(1)
    with open(sys.argv[1]) as f:
        run(f.read())
