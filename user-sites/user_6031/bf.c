#include <stdio.h>
#include <stdlib.h>

char tape[30000] = {0};
char *ptr = tape;

void run(const char *code) {
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
                if (!*ptr) {
                    int depth = 1;
                    while (depth) {
                        ip++;
                        if (*ip == '[') depth++;
                        if (*ip == ']') depth--;
                    }
                }
                break;
            case ']':
                if (*ptr) {
                    int depth = 1;
                    while (depth) {
                        ip--;
                        if (*ip == ']') depth++;
                        if (*ip == '[') depth--;
                    }
                }
                break;
        }
        ip++;
    }
}

int main(int argc, char **argv) {
    if (argc > 1) run(argv[1]);
    return 0;
}
