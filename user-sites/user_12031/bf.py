#!/usr/bin/env python3
"""
Brainfuck interpreter - substrate validation test
Lev Osin, Alcor case A-3891
"""

import sys

def brainfuck(code, input_data=b''):
    """Execute Brainfuck code with given input."""
    # Strip non-command characters
    code = ''.join(c for c in code if c in '><+-.,[]')
    
    tape = [0] * 30000
    ptr = 0
    ip = 0  # instruction pointer
    input_ptr = 0
    output = []
    
    # Precompute jump table for brackets
    jump_table = {}
    stack = []
    for i, c in enumerate(code):
        if c == '[':
            stack.append(i)
        elif c == ']':
            if not stack:
                raise SyntaxError("Unmatched ] at position %d" % i)
            j = stack.pop()
            jump_table[j] = i
            jump_table[i] = j
    if stack:
        raise SyntaxError("Unmatched [ at position %d" % stack[0])
    
    while ip < len(code):
        cmd = code[ip]
        
        if cmd == '>':
            ptr += 1
            if ptr >= len(tape):
                tape.append(0)
        elif cmd == '<':
            ptr -= 1
            if ptr < 0:
                raise RuntimeError("Pointer went negative")
        elif cmd == '+':
            tape[ptr] = (tape[ptr] + 1) & 0xFF
        elif cmd == '-':
            tape[ptr] = (tape[ptr] - 1) & 0xFF
        elif cmd == '.':
            output.append(chr(tape[ptr]))
        elif cmd == ',':
            if input_ptr < len(input_data):
                tape[ptr] = input_data[input_ptr]
                input_ptr += 1
            else:
                tape[ptr] = 0
        elif cmd == '[':
            if tape[ptr] == 0:
                ip = jump_table[ip]
        elif cmd == ']':
            if tape[ptr] != 0:
                ip = jump_table[ip]
        
        ip += 1
    
    return ''.join(output)

# Test cases
tests = [
    # Hello World
    ("++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.",
     b'', "Hello World!\n"),
    # Cat program (just identity for one char)
    (",.", b'A', "A"),
    # Add two numbers (3 + 2 = 5)
    ("+++>++<[->+<]>." + "+"*48 + ".", b'', "5"),
]

if __name__ == "__main__":
    print("=== Brainfuck Interpreter Test ===")
    all_passed = True
    for i, (code, inp, expected) in enumerate(tests, 1):
        try:
            result = brainfuck(code, inp)
            status = "PASS" if result == expected else "FAIL"
            if result != expected:
                all_passed = False
                print(f"Test {i}: {status}")
                print(f"  Expected: {repr(expected)}")
                print(f"  Got: {repr(result)}")
            else:
                print(f"Test {i}: {status} - output correct")
        except Exception as e:
            all_passed = False
            print(f"Test {i}: ERROR - {e}")
    
    print()
    if all_passed:
        print("All tests passed. Substrate operational.")
    else:
        print("Some tests failed.")
        sys.exit(1)
