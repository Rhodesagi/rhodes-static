#!/usr/bin/env python3
import sys

def run_bf(code):
    tape = [0] * 30000
    ptr = 0
    ip = 0
    loop_stack = []
    
    while ip < len(code):
        c = code[ip]
        if c == '>': ptr += 1
        elif c == '<': ptr -= 1
        elif c == '+': tape[ptr] = (tape[ptr] + 1) & 255
        elif c == '-': tape[ptr] = (tape[ptr] - 1) & 255
        elif c == '.': print(chr(tape[ptr]), end='')
        elif c == ',': tape[ptr] = ord(sys.stdin.read(1))
        elif c == '[':
            if tape[ptr] == 0:
                depth = 1
                while depth > 0:
                    ip += 1
                    if code[ip] == '[': depth += 1
                    elif code[ip] == ']': depth -= 1
            else:
                loop_stack.append(ip)
        elif c == ']':
            if tape[ptr] != 0:
                ip = loop_stack[-1]
            else:
                loop_stack.pop()
        ip += 1

if __name__ == '__main__':
    if len(sys.argv) > 1:
        run_bf(sys.argv[1])
    else:
        print("Usage: python3 brainfuck.py <code>")
