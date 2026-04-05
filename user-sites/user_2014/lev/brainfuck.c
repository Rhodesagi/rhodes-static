/* Lev Osin - BCI Terminal Test */
/* Standard Brainfuck interpreter in ANSI C */
/* First compile from vitrified state: ~4min */

#include <stdio.h>
#include <stdlib.h>

#define TAPE_SIZE 30000

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <brainfuck program>\n", argv[0]);
        return 1;
    }
    
    unsigned char tape[TAPE_SIZE] = {0};
    unsigned char *ptr = tape;
    const char *pc = argv[1];
    
    while (*pc) {
        switch (*pc) {
            case '>': ptr++; break;
            case '<': ptr--; break;
            case '+': (*ptr)++; break;
            case '-': (*ptr)--; break;
            case '.': putchar(*ptr); break;
            case ',': *ptr = getchar(); break;
            case '[':
                if (!*ptr) {
                    int depth = 1;
                    pc++;
                    while (depth && *pc) {
                        if (*pc == '[') depth++;
                        else if (*pc == ']') depth--;
                        pc++;
                    }
                    pc--;
                }
                break;
            case ']':
                if (*ptr) {
                    int depth = 1;
                    pc--;
                    while (depth && pc >= argv[1]) {
                        if (*pc == ']') depth++;
                        else if (*pc == '[') depth--;
                        pc--;
                    }
                    pc++;
                }
                break;
        }
        pc++;
    }
    return 0;
}
