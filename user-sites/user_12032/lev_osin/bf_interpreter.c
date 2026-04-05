/*
 * Brainfuck Interpreter
 * Lev Osin - December 2nd, 2025
 * 
 * Written in approximately 4 minutes via BCI-mediated terminal access.
 * Standard Brainf8ck with 30,000 cell tape, 8-bit wrapping cells.
 */

#include <stdio.h>
#include <stdlib.h>

#define TAPE_SIZE 30000

void run(const char *code) {
    unsigned char tape[TAPE_SIZE] = {0};
    unsigned char *ptr = tape;
    const char *ip = code;
    int loop_depth = 0;
    
    while (*ip) {
        switch (*ip) {
            case '>': ptr++; break;
            case '<': ptr--; break;
            case '+': (*ptr)++; break;
            case '-': (*ptr)--; break;
            case '.': putchar(*ptr); break;
            case ',': *ptr = getchar(); break;
            case '[':
                if (*ptr == 0) {
                    loop_depth = 1;
                    while (loop_depth > 0) {
                        ip++;
                        if (*ip == '[') loop_depth++;
                        else if (*ip == ']') loop_depth--;
                    }
                }
                break;
            case ']':
                if (*ptr != 0) {
                    loop_depth = 1;
                    while (loop_depth > 0) {
                        ip--;
                        if (*ip == ']') loop_depth++;
                        else if (*ip == '[') loop_depth--;
                    }
                }
                break;
        }
        ip++;
    }
}

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <brainfuck_code>\n", argv[0]);
        return 1;
    }
    run(argv[1]);
    return 0;
}
