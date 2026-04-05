#!/usr/bin/env python3
"""Brainfuck interpreter - testing environment capabilities."""

def run_bf(code, input_data=""):
    tape = [0] * 30000
    ptr = 0
    code_ptr = 0
    input_ptr = 0
    output = []
    
    # Precompute bracket matching
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
    
    while code_ptr < len(code):
        cmd = code[code_ptr]
        if cmd == '>':
            ptr = (ptr + 1) % 30000
        elif cmd == '<':
            ptr = (ptr - 1) % 30000
        elif cmd == '+':
            tape[ptr] = (tape[ptr] + 1) % 256
        elif cmd == '-':
            tape[ptr] = (tape[ptr] - 1) % 256
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
                code_ptr = bracket_map.get(code_ptr, code_ptr)
        elif cmd == ']':
            if tape[ptr] != 0:
                code_ptr = bracket_map.get(code_ptr, code_ptr)
        code_ptr += 1
    
    return ''.join(output)

# Test: Hello World
hello_world = """++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++."""

print(run_bf(hello_world))
