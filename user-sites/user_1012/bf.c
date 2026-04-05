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
    if (argc > 1) {
        FILE *f = fopen(argv[1], "r");
        if (!f) { perror("fopen"); return 1; }
        fseek(f, 0, SEEK_END);
        long size = ftell(f);
        fseek(f, 0, SEEK_SET);
        char *code = malloc(size + 1);
        fread(code, 1, size, f);
        code[size] = 0;
        fclose(f);
        run(code);
        free(code);
    }
    return 0;
}
