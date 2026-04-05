#!/usr/bin/env python3
"""Brainfuck interpreter. First test of BCI terminal access."""
import sys

def run(code, inp=''):
    tape = [0] * 30000
    ptr = 0
    ip = 0
    inp_pos = 0
    output = []
    
    # Precompute bracket matches
    bracket_map = {}
    stack = []
    for i, c in enumerate(code):
        if c == '[':
            stack.append(i)
        elif c == ']':
            j = stack.pop()
            bracket_map[j] = i
            bracket_map[i] = j
    
    while ip < len(code):
        c = code[ip]
        if c == '>':
            ptr += 1
        elif c == '<':
            ptr -= 1
        elif c == '+':
            tape[ptr] = (tape[ptr] + 1) & 255
        elif c == '-':
            tape[ptr] = (tape[ptr] - 1) & 255
        elif c == '.':
            output.append(chr(tape[ptr]))
        elif c == ',':
            if inp_pos < len(inp):
                tape[ptr] = ord(inp[inp_pos])
                inp_pos += 1
            else:
                tape[ptr] = 0
        elif c == '[' and tape[ptr] == 0:
            ip = bracket_map[ip]
        elif c == ']' and tape[ptr] != 0:
            ip = bracket_map[ip]
        ip += 1
    
    return ''.join(output)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            code = f.read()
    else:
        code = sys.stdin.read()
    
    # Filter to valid BF chars
    code = ''.join(c for c in code if c in '><+-.,[]')
    result = run(code)
    print(result, end='')
