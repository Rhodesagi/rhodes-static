/* Brainfuck interpreter - written to test terminal output */
#include <stdio.h>
#include <stdlib.h>

#define MEM_SIZE 30000

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <program.bf>\n", argv[0]);
        return 1;
    }
    
    FILE *f = fopen(argv[1], "r");
    if (!f) {
        perror("fopen");
        return 1;
    }
    
    fseek(f, 0, SEEK_END);
    long sz = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    char *code = malloc(sz + 1);
    fread(code, 1, sz, f);
    code[sz] = '\0';
    fclose(f);
    
    unsigned char mem[MEM_SIZE] = {0};
    unsigned char *ptr = mem;
    char *ip = code;
    
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
    
    free(code);
    return 0;
}
