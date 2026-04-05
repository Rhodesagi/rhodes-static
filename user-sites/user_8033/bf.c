#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MEMSIZE 30000

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "usage: %s <program.bf>\n", argv[0]);
        return 1;
    }

    FILE *f = fopen(argv[1], "r");
    if (!f) {
        perror("fopen");
        return 1;
    }

    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    char *code = malloc(size + 1);
    fread(code, 1, size, f);
    code[size] = '\0';
    fclose(f);

    unsigned char mem[MEMSIZE] = {0};
    int ptr = 0;
    char *ip = code;

    while (*ip) {
        switch (*ip) {
            case '>': ptr = (ptr + 1) % MEMSIZE; break;
            case '<': ptr = (ptr - 1 + MEMSIZE) % MEMSIZE; break;
            case '+': mem[ptr]++; break;
            case '-': mem[ptr]--; break;
            case '.': putchar(mem[ptr]); break;
            case ',': mem[ptr] = getchar(); break;
            case '[':
                if (!mem[ptr]) {
                    int depth = 1;
                    while (depth > 0) {
                        ip++;
                        if (*ip == '[') depth++;
                        else if (*ip == ']') depth--;
                    }
                }
                break;
            case ']':
                if (mem[ptr]) {
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
