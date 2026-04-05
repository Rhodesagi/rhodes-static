#include <stdio.h>
#include <stdlib.h>

#define TAPE_SIZE 30000

void run(const char *code) {
    char tape[TAPE_SIZE] = {0};
    char *ptr = tape;
    const char *ip = code;
    
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
                    ip++;
                    while (depth > 0) {
                        if (*ip == '[') depth++;
                        else if (*ip == ']') depth--;
                        ip++;
                    }
                    ip--;
                }
                break;
            case ']':
                if (*ptr != 0) {
                    int depth = 1;
                    ip--;
                    while (depth > 0) {
                        if (*ip == ']') depth++;
                        else if (*ip == '[') depth--;
                        ip--;
                    }
                    ip++;
                }
                break;
        }
        ip++;
    }
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <brainfuck code>\n", argv[0]);
        return 1;
    }
    run(argv[1]);
    return 0;
}
