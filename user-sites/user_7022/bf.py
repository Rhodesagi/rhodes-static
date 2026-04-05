#!/usr/bin/env python3
"""Brainfuck interpreter - Lev Osin, BCI terminal"""

import sys

def run(program, input_data=''):
    """Execute Brainfuck program"""
    tape = [0] * 30000
    ptr = 0
    pc = 0
    input_ptr = 0
    output = []
    
    # Build jump table
    jump_table = {}
    stack = []
    for i, c in enumerate(program):
        if c == '[':
            stack.append(i)
        elif c == ']':
            if stack:
                start = stack.pop()
                jump_table[start] = i
                jump_table[i] = start
    
    while pc < len(program):
        cmd = program[pc]
        
        if cmd == '>':
            ptr = (ptr + 1) % 30000
        elif cmd == '<':
            ptr = (ptr - 1) % 30000
        elif cmd == '+':
            tape[ptr] = (tape[ptr] + 1) & 255
        elif cmd == '-':
            tape[ptr] = (tape[ptr] - 1) & 255
        elif cmd == '.':
            output.append(chr(tape[ptr]))
        elif cmd == ',':
            if input_ptr < len(input_data):
                tape[ptr] = ord(input_data[input_ptr])
                input_ptr += 1
            else:
                tape[ptr] = 0
        elif cmd == '[':
            if tape[ptr] == 0:
                pc = jump_table.get(pc, pc)
        elif cmd == ']':
            if tape[ptr] != 0:
                pc = jump_table.get(pc, pc)
        
        pc += 1
    
    return ''.join(output)

def main():
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r') as f:
            program = f.read()
    else:
        # Hello World example
        program = """++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++."""
    
    result = run(program)
    print(result)

if __name__ == '__main__':
    main()
