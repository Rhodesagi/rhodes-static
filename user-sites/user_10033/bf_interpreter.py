#!/usr/bin/env python3
"""
Brainfuck interpreter - testing BCI-to-code pipeline
Lev Osin - Alcor facility
"""

def run_brainfuck(code, input_data=""):
    """Execute Brainfuck code."""
    # Filter to only valid BF characters
    code = ''.join(c for c in code if c in '<>+-.,[]')
    
    tape = [0] * 30000
    ptr = 0
    code_ptr = 0
    input_ptr = 0
    output = []
    
    # Precompute bracket matches
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
                tape[ptr] = ord(input_data[input_ptr])
                input_ptr += 1
            else:
                tape[ptr] = 0
        elif cmd == '[':
            if tape[ptr] == 0:
                code_ptr = bracket_map.get(code_ptr, code_ptr + 1)
        elif cmd == ']':
            if tape[ptr] != 0:
                code_ptr = bracket_map.get(code_ptr, code_ptr)
        
        code_ptr += 1
    
    return ''.join(output)

if __name__ == "__main__":
    # Hello World
    hello_world = """++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++."""
    
    result = run_brainfuck(hello_world)
    print(f"Output: {result}")
    print(f"Expected: Hello World!")
    print(f"Match: {result == 'Hello World!'}")
