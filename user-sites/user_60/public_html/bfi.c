#include <stdio.h>
#include <stdlib.h>
#define TAPE_SIZE 30000
int main(int argc, char **argv) {
    if (argc != 2) { fprintf(stderr, "usage: bfi <file>\n"); return 1; }
    FILE *f = fopen(argv[1], "r");
    if (!f) { perror("fopen"); return 1; }
    char prog[65536]; size_t n = fread(prog, 1, sizeof(prog), f);
    fclose(f);
    char tape[TAPE_SIZE] = {0};
    char *p = tape;
    int pc = 0, stack[256], sp = 0;
    while (pc < n) {
        switch (prog[pc]) {
            case '>': p++; break;
            case '<': p--; break;
            case '+': (*p)++; break;
            case '-': (*p)--; break;
            case '.': putchar(*p); break;
            case ',': *p = getchar(); break;
            case '[': if (!*p) { int d = 1; while (d) { pc++; if (prog[pc] == '[') d++; else if (prog[pc] == ']') d--; } } else stack[sp++] = pc; break;
            case ']': if (*p) pc = stack[sp-1]; else sp--; break;
        }
        pc++;
    }
    return 0;
}
