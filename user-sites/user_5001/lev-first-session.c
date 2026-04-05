// First conscious output after rewarming
// December 2nd, 2025
// Terminal access granted

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Brainfuck interpreter
// Written in 4 minutes 17 seconds
// Previous best: ~12 minutes

#define TAPE_SIZE 30000

void interpret(const char *code) {
    char tape[TAPE_SIZE] = {0};
    int ptr = 0;
    const char *ip = code;
    
    while (*ip) {
        switch (*ip) {
            case '>': ptr = (ptr + 1) % TAPE_SIZE; break;
            case '<': ptr = (ptr - 1 + TAPE_SIZE) % TAPE_SIZE; break;
            case '+': tape[ptr]++; break;
            case '-': tape[ptr]--; break;
            case '.': putchar(tape[ptr]); break;
            case ',': tape[ptr] = getchar(); break;
            case '[':
                if (!tape[ptr]) {
                    int depth = 1;
                    while (depth) {
                        ip++;
                        if (*ip == '[') depth++;
                        else if (*ip == ']') depth--;
                    }
                }
                break;
            case ']':
                if (tape[ptr]) {
                    int depth = 1;
                    while (depth) {
                        ip--;
                        if (*ip == ']') depth++;
                        else if (*ip == '[') depth--;
                    }
                }
                break;
        }
        ip++;
    }
}

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <brainfuck code>\n", argv[0]);
        return 1;
    }
    
    interpret(argv[1]);
    return 0;
}
