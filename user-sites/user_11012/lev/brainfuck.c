#include <stdio.h>
#include <stdlib.h>

#define TAPE_SIZE 30000

int main(int argc, char *argv[]) {
    unsigned char tape[TAPE_SIZE] = {0};
    unsigned char *ptr = tape;
    
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <brainfuck program>\n", argv[0]);
        return 1;
    }
    
    char *program = argv[1];
    char *pc = program;
    
    while (*pc) {
        switch (*pc) {
            case '>': ptr++; break;
            case '<': ptr--; break;
            case '+': (*ptr)++; break;
            case '-': (*ptr)--; break;
            case '.': putchar(*ptr); break;
            case ',': *ptr = getchar(); break;
            case '[':
                if (*ptr == 0) {
                    int depth = 1;
                    pc++;
                    while (depth > 0) {
                        if (*pc == '[') depth++;
                        if (*pc == ']') depth--;
                        pc++;
                    }
                    pc--;
                }
                break;
            case ']':
                if (*ptr != 0) {
                    int depth = 1;
                    pc--;
                    while (depth > 0) {
                        if (*pc == ']') depth++;
                        if (*pc == '[') depth--;
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
