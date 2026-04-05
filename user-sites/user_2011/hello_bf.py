#!/usr/bin/env python3
"""Brainfuck interpreter - verifying Python environment"""
import sys

def run_brainfuck(code, input_data=""):
    tape = [0] * 30000
    ptr = 0
    ip = 0
    input_ptr = 0
    output = []
    stack = []
    
    while ip < len(code):
        cmd = code[ip]
        if cmd == '>': ptr = (ptr + 1) % 30000
        elif cmd == '<': ptr = (ptr - 1 + 30000) % 30000
        elif cmd == '+': tape[ptr] = (tape[ptr] + 1) % 256
        elif cmd == '-': tape[ptr] = (tape[ptr] - 1) % 256
        elif cmd == '.': output.append(chr(tape[ptr]))
        elif cmd == ',': 
            if input_ptr < len(input_data):
                tape[ptr] = ord(input_data[input_ptr])
                input_ptr += 1
            else:
                tape[ptr] = 0
        elif cmd == '[':
            if tape[ptr] == 0:
                depth = 1
                ip += 1
                while depth and ip < len(code):
                    if code[ip] == '[': depth += 1
                    if code[ip] == ']': depth -= 1
                    ip += 1
                ip -= 1
            else:
                stack.append(ip)
        elif cmd == ']':
            if tape[ptr] != 0:
                ip = stack[-1]
            else:
                stack.pop()
        ip += 1
    
    return ''.join(output)

if __name__ == "__main__":
    # Hello World in Brainfuck
    hello_bf = """++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.+"""
    
    result = run_brainfuck(hello_bf)
    print(f"Output: {result}")
    assert result == "Hello World!", f"Expected 'Hello World!', got '{result}'"
    print("Environment verified. Python interpreter functional.")
