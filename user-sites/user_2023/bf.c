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
    char *ip = program;
    
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
                    int depth = 1;
                    while (depth > 0) {
                        ip++;
                        if (*ip == '[') depth++;
                        else if (*ip == ']') depth--;
                    }
                }
                break;
            case ']':
                if (*ptr != 0) {
                    int depth = 1;
                    while (depth > 0) {
                        ip--;
                        if (*ip == ']') depth++;
                        else if (*ip == '[') depth--;
                    }
                }
                break;
        }
        ip++;
    }
    
    return 0;
}
