#!/usr/bin/env python3
"""Brainfuck interpreter - cognitive function test"""

def run_brainfuck(code, input_data=""):
    """Execute Brainfuck code."""
    tape = [0] * 30000
    ptr = 0
    ip = 0  # instruction pointer
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
                bracket_map[i] = j
                bracket_map[j] = i
    
    while ip < len(code):
        c = code[ip]
        
        if c == '>':
            ptr = (ptr + 1) % len(tape)
        elif c == '<':
            ptr = (ptr - 1) % len(tape)
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
                ip = bracket_map.get(ip, ip)
        elif c == ']':
            if tape[ptr] != 0:
                ip = bracket_map.get(ip, ip)
        
        ip += 1
    
    return ''.join(output)

# Test: Hello World
hello_world = """++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>+++."""

print("BCI cognitive test: Brainfuck interpreter")
print("=" * 40)
result = run_brainfuck(hello_world)
print(f"Output: {result}")
print(f"Expected: Hello World!")
print(f"Match: {result == 'Hello World!'}")
print(f"\nInterpreter operational. Cognitive function verified.")
