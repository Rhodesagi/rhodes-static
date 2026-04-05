#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MEM_SIZE 30000

int main(int argc, char **argv) {
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
    
    char *prog = malloc(sz + 1);
    fread(prog, 1, sz, f);
    prog[sz] = '\0';
    fclose(f);
    
    unsigned char mem[MEM_SIZE] = {0};
    int ptr = 0;
    char *pc = prog;
    
    while (*pc) {
        switch (*pc) {
            case '>': ptr = (ptr + 1) % MEM_SIZE; break;
            case '<': ptr = (ptr - 1 + MEM_SIZE) % MEM_SIZE; break;
            case '+': mem[ptr]++; break;
            case '-': mem[ptr]--; break;
            case '.': putchar(mem[ptr]); break;
            case ',': mem[ptr] = getchar(); break;
            case '[':
                if (!mem[ptr]) {
                    int depth = 1;
                    while (depth) {
                        pc++;
                        if (*pc == '[') depth++;
                        else if (*pc == ']') depth--;
                    }
                }
                break;
            case ']':
                if (mem[ptr]) {
                    int depth = 1;
                    while (depth) {
                        pc--;
                        if (*pc == '[') depth--;
                        else if (*pc == ']') depth++;
                    }
                }
                break;
        }
        pc++;
    }
    
    free(prog);
    return 0;
}
