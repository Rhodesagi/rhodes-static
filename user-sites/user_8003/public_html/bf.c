#include <stdio.h>
#include <stdlib.h>

#define TAPE_SIZE 30000

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <brainfuck program>\n", argv[0]);
        return 1;
    }
    
    char *program = argv[1];
    char tape[TAPE_SIZE] = {0};
    int ptr = 0;
    int pc = 0;
    
    while (program[pc]) {
        switch (program[pc]) {
            case '>': ptr = (ptr + 1) % TAPE_SIZE; break;
            case '<': ptr = (ptr - 1 + TAPE_SIZE) % TAPE_SIZE; break;
            case '+': tape[ptr]++; break;
            case '-': tape[ptr]--; break;
            case '.': putchar(tape[ptr]); break;
            case ',': tape[ptr] = getchar(); break;
            case '[':
                if (tape[ptr] == 0) {
                    int depth = 1;
                    while (depth > 0) {
                        pc++;
                        if (program[pc] == '[') depth++;
                        if (program[pc] == ']') depth--;
                    }
                }
                break;
            case ']':
                if (tape[ptr] != 0) {
                    int depth = 1;
                    while (depth > 0) {
                        pc--;
                        if (program[pc] == ']') depth++;
                        if (program[pc] == '[') depth--;
                    }
                }
                break;
        }
        pc++;
    }
    
    return 0;
}
