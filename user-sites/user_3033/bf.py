#!/usr/bin/env python3
"""Brainfuck interpreter - Lev Osin, BCI terminal"""
import sys

def run_brainfuck(code, input_data=b''):
    """Execute Brainfuck code with given input."""
    tape = [0] * 30000
    ptr = 0
    code_ptr = 0
    input_ptr = 0
    output = []
    
    # Preprocess: build jump table for brackets
    jump_table = {}
    stack = []
    for i, c in enumerate(code):
        if c == '[':
            stack.append(i)
        elif c == ']':
            if stack:
                start = stack.pop()
                jump_table[start] = i
                jump_table[i] = start
    
    while code_ptr < len(code):
        cmd = code[code_ptr]
        
        if cmd == '>':
            ptr = (ptr + 1) % len(tape)
        elif cmd == '<':
            ptr = (ptr - 1) % len(tape)
        elif cmd == '+':
            tape[ptr] = (tape[ptr] + 1) % 256
        elif cmd == '-':
            tape[ptr] = (tape[ptr] - 1) % 256
        elif cmd == '.':
            output.append(chr(tape[ptr]))
        elif cmd == ',':
            if input_ptr < len(input_data):
                tape[ptr] = input_data[input_ptr] if isinstance(input_data[input_ptr], int) else ord(input_data[input_ptr])
                input_ptr += 1
            else:
                tape[ptr] = 0
        elif cmd == '[':
            if tape[ptr] == 0:
                code_ptr = jump_table.get(code_ptr, code_ptr)
        elif cmd == ']':
            if tape[ptr] != 0:
                code_ptr = jump_table.get(code_ptr, code_ptr)
        
        code_ptr += 1
    
    return ''.join(output)

if __name__ == '__main__':
    # Hello World in Brainfuck
    hello_code = """++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++."""
    
    result = run_brainfuck(hello_code)
    print(f"Output: {repr(result)}")
    # Note: The standard Hello World BF program outputs without newline
    expected = "Hello World!\n"
    if result == expected:
        print("Test passed.")
    else:
        print(f"Expected: {repr(expected)}")
