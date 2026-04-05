#!/usr/bin/env python3
import sys

def run(program, input_data=''):
    tape = [0] * 30000
    ptr = 0
    pc = 0
    input_ptr = 0
    output = []
    
    while pc < len(program):
        cmd = program[pc]
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
                depth = 1
                pc += 1
                while depth > 0:
                    if program[pc] == '[':
                        depth += 1
                    elif program[pc] == ']':
                        depth -= 1
                    pc += 1
                pc -= 1
        elif cmd == ']':
            if tape[ptr] != 0:
                depth = 1
                pc -= 1
                while depth > 0:
                    if program[pc] == ']':
                        depth += 1
                    elif program[pc] == '[':
                        depth -= 1
                    pc -= 1
                pc += 1
        pc += 1
    
    return ''.join(output)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <brainfuck program>")
        sys.exit(1)
    
    program = sys.argv[1]
    result = run(program)
    print(result, end='')
