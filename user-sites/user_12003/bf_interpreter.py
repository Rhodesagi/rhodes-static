#!/usr/bin/env python3
"""
Brainfuck Interpreter
Lev Osin, Alcor Life Extension Foundation
December 2025

First BCI terminal output test.
Reference implementation with O(1) bracket matching.
"""

import sys
from array import array

def run(code: str, input_data: bytes = b"") -> bytes:
    """
    Execute Brainfuck code.
    
    Memory: 30,000 cells, 8-bit wrapping
    Pointer: starts at cell 0
    """
    tape = array('B', [0]) * 30000
    ptr = 0
    ip = 0  # instruction pointer
    inp = 0  # input pointer
    output = bytearray()
    
    # Precompute jump table for O(1) bracket matching
    jump = {}
    stack = []
    for i, c in enumerate(code):
        if c == '[':
            stack.append(i)
        elif c == ']':
            if stack:
                j = stack.pop()
                jump[j] = i
                jump[i] = j
    
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
            output.append(tape[ptr])
        elif c == ',':
            if inp < len(input_data):
                tape[ptr] = input_data[inp]
                inp += 1
            else:
                tape[ptr] = 0
        elif c == '[':
            if tape[ptr] == 0:
                ip = jump.get(ip, ip)
        elif c == ']':
            if tape[ptr] != 0:
                ip = jump.get(ip, ip)
        
        ip += 1
    
    return bytes(output)


def main():
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r') as f:
            code = f.read()
    else:
        # Default: Hello World
        code = """++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>+++."""
    
    result = run(code)
    sys.stdout.buffer.write(result)
    sys.stdout.buffer.flush()


if __name__ == "__main__":
    main()
