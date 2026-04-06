#!/usr/bin/env python3
"""
Brainfuck Interpreter in Python
Lev Osin, Alcor Life Extension Foundation
December 2025

Reference implementation for BCI substrate characterization.
Translates to C semantics for eventual compilation.
"""

import sys
from array import array

def run(code: str, input_data: bytes = b"", tape_size: int = 30000) -> bytes:
    """
    Execute Brainfuck code.
    
    Args:
        code: Brainfuck source code (+-<>[],.)
        input_data: Input bytes for , instruction
        tape_size: Memory tape size (default 30,000)
    
    Returns:
        Output bytes from . instructions
    """
    # Initialize tape with unsigned bytes
    tape = array('B', [0]) * tape_size
    ptr = 0
    ip = 0  # Instruction pointer
    inp = 0  # Input pointer
    output = bytearray()
    
    # Build jump table for O(1) bracket matching
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
    
    # Execute
    while ip < len(code):
        c = code[ip]
        
        if c == '>':
            ptr = (ptr + 1) % tape_size
        elif c == '<':
            ptr = (ptr - 1) % tape_size
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
