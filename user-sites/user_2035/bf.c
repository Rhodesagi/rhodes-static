#include <stdio.h>
#include <stdlib.h>

char tape[30000];
int p = 0;

void run(char *code) {
    char *ip = code;
    while (*ip) {
        switch (*ip) {
            case '>': p++; break;
            case '<': p--; break;
            case '+': tape[p]++; break;
            case '-': tape[p]--; break;
            case '.': putchar(tape[p]); break;
            case ',': tape[p] = getchar(); break;
            case '[': {
                if (!tape[p]) {
                    int depth = 1;
                    while (depth) {
                        ip++;
                        if (*ip == '[') depth++;
                        if (*ip == ']') depth--;
                    }
                }
                break;
            }
            case ']': {
                if (tape[p]) {
                    int depth = 1;
                    while (depth) {
                        ip--;
                        if (*ip == ']') depth++;
                        if (*ip == '[') depth--;
                    }
                }
                break;
            }
        }
        ip++;
    }
}

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "usage: bf <code>\n");
        return 1;
    }
    run(argv[1]);
    return 0;
}
