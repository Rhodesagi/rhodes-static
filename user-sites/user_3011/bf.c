#include <stdio.h>
#include <stdlib.h>

#define TAPE_SIZE 30000

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "usage: %s <file.bf>\n", argv[0]);
        return 1;
    }
    
    FILE *f = fopen(argv[1], "r");
    if (!f) { perror("fopen"); return 1; }
    
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    char *prog = malloc(size + 1);
    fread(prog, 1, size, f);
    prog[size] = '\0';
    fclose(f);
    
    unsigned char tape[TAPE_SIZE] = {0};
    int p = 0;
    char *ip = prog;
    
    while (*ip) {
        switch (*ip) {
            case '>': p = (p + 1) % TAPE_SIZE; break;
            case '<': p = (p - 1 + TAPE_SIZE) % TAPE_SIZE; break;
            case '+': tape[p]++; break;
            case '-': tape[p]--; break;
            case '.': putchar(tape[p]); break;
            case ',': tape[p] = getchar(); break;
            case '[':
                if (!tape[p]) {
                    int depth = 1;
                    while (depth) {
                        ip++;
                        if (*ip == '[') depth++;
                        else if (*ip == ']') depth--;
                    }
                }
                break;
            case ']':
                if (tape[p]) {
                    int depth = 1;
                    while (depth) {
                        ip--;
                        if (*ip == ']') depth++;
                        else if (*ip == '[') depth--;
                    }
                }
                break;
        }
        ip++;
    }
    
    free(prog);
    return 0;
}
