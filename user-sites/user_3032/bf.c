#include <stdio.h>
#include <stdlib.h>

int main(int argc, char **argv) {
    if (argc < 2) { fprintf(stderr, "Usage: %s <code>\n", argv[0]); return 1; }
    char *p = calloc(30000, 1), *code = argv[1];
    for (int i = 0, loops[1000], *lp = loops; code[i]; i++) {
        switch (code[i]) {
            case '>': p++; break;
            case '<': p--; break;
            case '+': (*p)++; break;
            case '-': (*p)--; break;
            case '.': putchar(*p); break;
            case ',': *p = getchar(); break;
            case '[': if (!*p) { int d = 1; while (d) d += (code[++i] == '[') - (code[i] == ']'); } else *lp++ = i; break;
            case ']': if (*p) i = *(lp-1); else lp--; break;
        }
    }
    return 0;
}
