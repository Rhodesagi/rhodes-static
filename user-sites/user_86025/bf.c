#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MEMORY_SIZE 30000

int main(int argc, char **argv) {
    unsigned char memory[MEMORY_SIZE] = {0};
    unsigned char *ptr = memory;
    
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <bf program>\n", argv[0]);
        return 1;
    }
    
    char *program = argv[1];
    size_t program_len = strlen(program);
    
    for (size_t pc = 0; pc < program_len; pc++) {
        switch (program[pc]) {
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
                        pc++;
                        if (program[pc] == '[') depth++;
                        else if (program[pc] == ']') depth--;
                    }
                }
                break;
            case ']':
                if (*ptr != 0) {
                    int depth = 1;
                    while (depth > 0) {
                        pc--;
                        if (program[pc] == ']') depth++;
                        else if (program[pc] == '[') depth--;
                    }
                }
                break;
            default:
                // ignore other characters
                break;
        }
    }
    
    return 0;
}