#!/usr/bin/env python3
"""
Brainfuck interpreter.
"""
import sys

def brainfuck(program: str):
    tape = [0] * 30000
    ptr = 0
    pc = 0
    n = len(program)
    
    while pc < n:
        c = program[pc]
        if c == '>':
            ptr += 1
            if ptr >= len(tape):
                tape.append(0)
        elif c == '<':
            if ptr == 0:
                raise RuntimeError("Pointer moved left of tape start")
            ptr -= 1
        elif c == '+':
            tape[ptr] = (tape[ptr] + 1) & 0xFF
        elif c == '-':
            tape[ptr] = (tape[ptr] - 1) & 0xFF
        elif c == '.':
            sys.stdout.write(chr(tape[ptr]))
            sys.stdout.flush()
        elif c == ',':
            ch = sys.stdin.read(1)
            tape[ptr] = ord(ch) & 0xFF if ch else 0
        elif c == '[':
            if tape[ptr] == 0:
                # jump forward to matching ']'
                depth = 1
                while depth > 0:
                    pc += 1
                    if pc >= n:
                        raise RuntimeError("Unmatched '['")
                    if program[pc] == '[':
                        depth += 1
                    elif program[pc] == ']':
                        depth -= 1
        elif c == ']':
            if tape[ptr] != 0:
                # jump back to matching '['
                depth = 1
                while depth > 0:
                    pc -= 1
                    if pc < 0:
                        raise RuntimeError("Unmatched ']'")
                    if program[pc] == ']':
                        depth += 1
                    elif program[pc] == '[':
                        depth -= 1
        # ignore other characters
        pc += 1

if __name__ == '__main__':
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r') as f:
            code = f.read()
    else:
        code = sys.stdin.read()
    brainfuck(code)