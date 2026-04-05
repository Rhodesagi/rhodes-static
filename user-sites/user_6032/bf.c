#include <stdio.h>
#include <stdlib.h>

#define MEMSIZE 30000

int main(int argc, char **argv) {
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
    long len = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    char *prog = malloc(len + 1);
    fread(prog, 1, len, f);
    prog[len] = 0;
    fclose(f);
    
    char mem[MEMSIZE] = {0};
    char *p = mem;
    char *ip = prog;
    
    while (*ip) {
        switch (*ip) {
            case '>': p++; break;
            case '<': p--; break;
            case '+': (*p)++; break;
            case '-': (*p)--; break;
            case '.': putchar(*p); break;
            case ',': *p = getchar(); break;
            case '[':
                if (!*p) {
                    int depth = 1;
                    while (depth) {
                        ip++;
                        if (*ip == '[') depth++;
                        if (*ip == ']') depth--;
                    }
                }
                break;
            case ']':
                if (*p) {
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
    
    return 0;
}
