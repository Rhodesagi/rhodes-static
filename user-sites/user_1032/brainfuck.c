#include <stdio.h>
#include <stdlib.h>

#define TAPE_SIZE 30000

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
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    char *prog = malloc(size + 1);
    fread(prog, 1, size, f);
    prog[size] = 0;
    fclose(f);
    
    char tape[TAPE_SIZE] = {0};
    int ptr = 0;
    char *pc = prog;
    
    while (*pc) {
        switch (*pc) {
            case '>': ptr = (ptr + 1) % TAPE_SIZE; break;
            case '<': ptr = (ptr - 1 + TAPE_SIZE) % TAPE_SIZE; break;
            case '+': tape[ptr]++; break;
            case '-': tape[ptr]--; break;
            case '.': putchar(tape[ptr]); break;
            case ',': tape[ptr] = getchar(); break;
            case '[':
                if (!tape[ptr]) {
                    int depth = 1;
                    while (depth) {
                        pc++;
                        if (*pc == '[') depth++;
                        else if (*pc == ']') depth--;
                    }
                }
                break;
            case ']':
                if (tape[ptr]) {
                    int depth = 1;
                    while (depth) {
                        pc--;
                        if (*pc == ']') depth++;
                        else if (*pc == '[') depth--;
                    }
                }
                break;
        }
        pc++;
    }
    
    free(prog);
    return 0;
}
