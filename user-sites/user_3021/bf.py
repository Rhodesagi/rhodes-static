#!/usr/bin/env python3
"""
Brainfuck Interpreter
Lev Osin - Alcor A-3891
Cognitive verification test
"""

import sys

def run_brainfuck(code, input_data=""):
    tape = [0] * 30000
    ptr = 0
    ip = 0
    input_ptr = 0
    output = []
    
    # Build jump table for brackets
    bracket_map = {}
    stack = []
    for i, c in enumerate(code):
        if c == '[':
            stack.append(i)
        elif c == ']':
            if stack:
                start = stack.pop()
                bracket_map[start] = i
                bracket_map[i] = start
    
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
            if input_ptr < len(input_data):
                tape[ptr] = ord(input_data[input_ptr])
                input_ptr += 1
            else:
                tape[ptr] = 0
        elif c == '[':
            if tape[ptr] == 0:
                ip = bracket_map.get(ip, ip)
        elif c == ']':
            if tape[ptr] != 0:
                ip = bracket_map.get(ip, ip)
        ip += 1
    
    return ''.join(output)

if __name__ == "__main__":
    # Test: Hello World
    hello_world = """++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++."""
    
    result = run_brainfuck(hello_world)
    print(f"Brainfuck test: {repr(result)}")
    assert result == "Hello World!\n", f"Expected 'Hello World!\\n', got {repr(result)}"
    print("All tests passed. Interpreter functional.")
