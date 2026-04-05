#!/usr/bin/env python3
# Brainfuck interpreter - Lev Osin, BCI terminal
# Target: <4 minutes. Start: now.

import sys

def run_bf(code, input_data=b''):
    tape = [0] * 30000
    ptr = 0
    ip = 0
    input_ptr = 0
    output = []
    
    # Preprocess: find matching brackets
    bracket_map = {}
    stack = []
    for i, c in enumerate(code):
        if c == '[':
            stack.append(i)
        elif c == ']':
            if stack:
                j = stack.pop()
                bracket_map[j] = i
                bracket_map[i] = j
    
    while ip < len(code):
        c = code[ip]
        if c == '>':
            ptr = (ptr + 1) % 30000
        elif c == '<':
            ptr = (ptr - 1) % 30000
        elif c == '+':
            tape[ptr] = (tape[ptr] + 1) % 256
        elif c == '-':
            tape[ptr] = (tape[ptr] - 1) % 256
        elif c == '.':
            output.append(chr(tape[ptr]))
        elif c == ',':
            if input_ptr < len(input_data):
                tape[ptr] = input_data[input_ptr]
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
    # Hello World program
    prog = "++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++."
    result = run_bf(prog)
    print(f"Output: {result}")
    print(f"Length: {len(prog)} instructions")
    print("Interpreter: functional")
