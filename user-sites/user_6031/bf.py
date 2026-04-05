#!/usr/bin/env python3

def run(code):
    tape = [0] * 30000
    ptr = 0
    ip = 0
    while ip < len(code):
        c = code[ip]
        if c == '>': ptr += 1
        elif c == '<': ptr -= 1
        elif c == '+': tape[ptr] = (tape[ptr] + 1) & 255
        elif c == '-': tape[ptr] = (tape[ptr] - 1) & 255
        elif c == '.': print(chr(tape[ptr]), end='')
        elif c == ',': tape[ptr] = ord(input()[0]) if input else 0
        elif c == '[':
            if tape[ptr] == 0:
                depth = 1
                while depth:
                    ip += 1
                    if code[ip] == '[': depth += 1
                    if code[ip] == ']': depth -= 1
        elif c == ']':
            if tape[ptr] != 0:
                depth = 1
                while depth:
                    ip -= 1
                    if code[ip] == ']': depth += 1
                    if code[ip] == '[': depth -= 1
        ip += 1

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        run(sys.argv[1])
