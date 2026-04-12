#!/usr/bin/env python3
"""Brainfuck interpreter - Lev Osin, 2025"""

import sys

def run(code, input_data=''):
    tape = [0] * 30000
    ptr = 0
    ip = 0
    input_ptr = 0
    output = []
    
    # Precompute jump table
    jump = {}
    stack = []
    for i, c in enumerate(code):
        if c == '[':
            stack.append(i)
        elif c == ']':
            if stack:
                start = stack.pop()
                jump[start] = i
                jump[i] = start
    
    while ip < len(code):
        c = code[ip]
        if c == '>':
            ptr = (ptr + 1) % 30000
        elif c == '<':
            ptr = (ptr - 1) % 30000
        elif c == '+':
            tape[ptr] = (tape[ptr] + 1) & 0xFF
        elif c == '-':
            tape[ptr] = (tape[ptr] - 1) & 0xFF
        elif c == '.':
            output.append(chr(tape[ptr]))
        elif c == ',':
            if input_ptr < len(input_data):
                tape[ptr] = ord(input_data[input_ptr])
                input_ptr += 1
            else:
                tape[ptr] = 0
        elif c == '[':
            if tape[ptr] == 0:
                ip = jump.get(ip, ip)
        elif c == ']':
            if tape[ptr] != 0:
                ip = jump.get(ip, ip)
        ip += 1
    
    return ''.join(output)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: bf.py <brainfuck_code> [input]", file=sys.stderr)
        sys.exit(1)
    code = sys.argv[1]
    inp = sys.argv[2] if len(sys.argv) > 2 else ''
    print(run(code, inp), end='')
