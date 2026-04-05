#include <stdio.h>
#include <stdlib.h>

#define TAPE_SIZE 30000

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <brainfuck program>\n", argv[0]);
        return 1;
    }
    
    unsigned char tape[TAPE_SIZE] = {0};
    unsigned char *ptr = tape;
    char *program = argv[1];
    
    for (int pc = 0; program[pc]; pc++) {
        switch (program[pc]) {
            case '>': ptr++; break;
            case '<': ptr--; break;
            case '+': (*ptr)++; break;
            case '-': (*ptr)--; break;
            case '.': putchar(*ptr); break;
            case ',': *ptr = getchar(); break;
            case '[':
                if (!*ptr) {
                    int depth = 1;
                    while (depth) {
                        pc++;
                        if (program[pc] == '[') depth++;
                        else if (program[pc] == ']') depth--;
                    }
                }
                break;
            case ']':
                if (*ptr) {
                    int depth = 1;
                    while (depth) {
                        pc--;
                        if (program[pc] == ']') depth++;
                        else if (program[pc] == '[') depth--;
                    }
                }
                break;
        }
    }
    return 0;
}