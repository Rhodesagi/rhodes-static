#!/usr/bin/env python3
"""Brainfuck interpreter - functional test"""
import sys

def run(code):
    tape = [0] * 30000
    ptr = 0
    ip = 0
    code_len = len(code)
    
    while ip < code_len:
        cmd = code[ip]
        if cmd == '>':
            ptr = (ptr + 1) % 30000
        elif cmd == '<':
            ptr = (ptr - 1) % 30000
        elif cmd == '+':
            tape[ptr] = (tape[ptr] + 1) & 255
        elif cmd == '-':
            tape[ptr] = (tape[ptr] - 1) & 255
        elif cmd == '.':
            print(chr(tape[ptr]), end='', flush=True)
        elif cmd == ',':
            tape[ptr] = ord(sys.stdin.read(1)) & 255 if not sys.stdin.isatty() else 0
        elif cmd == '[':
            if tape[ptr] == 0:
                depth = 1
                ip += 1
                while depth > 0 and ip < code_len:
                    if code[ip] == '[':
                        depth += 1
                    elif code[ip] == ']':
                        depth -= 1
                    ip += 1
                ip -= 1
        elif cmd == ']':
            if tape[ptr] != 0:
                depth = 1
                ip -= 1
                while depth > 0 and ip >= 0:
                    if code[ip] == ']':
                        depth += 1
                    elif code[ip] == '[':
                        depth -= 1
                    ip -= 1
                ip += 1
        ip += 1

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <brainfuck_code>", file=sys.stderr)
        sys.exit(1)
    run(sys.argv[1])
