#include <stdio.h>
#include <stdlib.h>
#include <string.h>

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
    prog[size] = '\0';
    fclose(f);
    
    unsigned char tape[TAPE_SIZE] = {0};
    int ptr = 0;
    int pc = 0;
    int prog_len = strlen(prog);
    
    int *stack = malloc(prog_len * sizeof(int));
    int *match = malloc(prog_len * sizeof(int));
    int sp = 0;
    
    for (int i = 0; i < prog_len; i++) {
        if (prog[i] == '[') {
            stack[sp++] = i;
        } else if (prog[i] == ']') {
            if (sp == 0) {
                fprintf(stderr, "Unmatched ] at %d\n", i);
                return 1;
            }
            int open = stack[--sp];
            match[open] = i;
            match[i] = open;
        }
    }
    if (sp != 0) {
        fprintf(stderr, "Unmatched [\n");
        return 1;
    }
    
    while (pc < prog_len) {
        char c = prog[pc];
        switch (c) {
            case '>': ptr = (ptr + 1) % TAPE_SIZE; break;
            case '<': ptr = (ptr - 1 + TAPE_SIZE) % TAPE_SIZE; break;
            case '+': tape[ptr]++; break;
            case '-': tape[ptr]--; break;
            case '.': putchar(tape[ptr]); break;
            case ',': tape[ptr] = getchar(); break;
            case '[': if (tape[ptr] == 0) pc = match[pc]; break;
            case ']': if (tape[ptr] != 0) pc = match[pc]; break;
        }
        pc++;
    }
    
    free(prog);
    free(stack);
    free(match);
    return 0;
}
