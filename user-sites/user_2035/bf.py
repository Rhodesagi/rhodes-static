#!/usr/bin/env python3
import sys

def run(code):
    tape = [0] * 30000
    p = 0
    ip = 0
    while ip < len(code):
        c = code[ip]
        if c == '>': p += 1
        elif c == '<': p -= 1
        elif c == '+': tape[p] = (tape[p] + 1) & 255
        elif c == '-': tape[p] = (tape[p] - 1) & 255
        elif c == '.': sys.stdout.write(chr(tape[p]))
        elif c == ',': tape[p] = ord(sys.stdin.read(1)) if not sys.stdin.isatty() else 0
        elif c == '[':
            if tape[p] == 0:
                depth = 1
                while depth:
                    ip += 1
                    if code[ip] == '[': depth += 1
                    if code[ip] == ']': depth -= 1
        elif c == ']':
            if tape[p] != 0:
                depth = 1
                while depth:
                    ip -= 1
                    if code[ip] == ']': depth += 1
                    if code[ip] == '[': depth -= 1
        ip += 1

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: bf.py <code>", file=sys.stderr)
        sys.exit(1)
    run(sys.argv[1])
