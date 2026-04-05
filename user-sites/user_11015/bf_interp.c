#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define TAPE_SIZE 30000

void execute(const char *code) {
    char tape[TAPE_SIZE] = {0};
    char *ptr = tape;
    const char *pc = code;
    size_t len = strlen(code);
    
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
                        else if (*pc == ']') depth--;
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
                        else if (*pc == '[') depth--;
                        pc--;
                    }
                    pc++;
                }
                break;
        }
        pc++;
    }
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <brainfuck code>\n", argv[0]);
        return 1;
    }
    execute(argv[1]);
    return 0;
}
