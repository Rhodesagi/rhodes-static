#!/usr/bin/env python3
import sys

def run_bf(code):
    mem = [0] * 30000
    p = ip = 0
    loops = []
    output = []
    while ip < len(code):
        c = code[ip]
        if c == '>': p = (p + 1) % 30000
        elif c == '<': p = (p - 1) % 30000
        elif c == '+': mem[p] = (mem[p] + 1) & 255
        elif c == '-': mem[p] = (mem[p] - 1) & 255
        elif c == '.': output.append(chr(mem[p]))
        elif c == ',': pass  # no input
        elif c == '[':
            if not mem[p]:
                depth = 1
                while depth:
                    ip += 1
                    depth += (code[ip] == '[') - (code[ip] == ']')
            else:
                loops.append(ip)
        elif c == ']':
            if mem[p]:
                ip = loops[-1]
            else:
                loops.pop()
        ip += 1
    return ''.join(output)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: bf.py <code>", file=sys.stderr)
        sys.exit(1)
    print(run_bf(sys.argv[1]), end='')
