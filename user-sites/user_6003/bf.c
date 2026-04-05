#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define TAPE_SIZE 30000

int main(int argc, char *argv[]) {
    unsigned char tape[TAPE_SIZE] = {0};
    unsigned char *ptr = tape;
    char *program = NULL;
    size_t prog_len = 0;
    
    if (argc > 1) {
        FILE *f = fopen(argv[1], "r");
        if (f) {
            fseek(f, 0, SEEK_END);
            prog_len = ftell(f);
            fseek(f, 0, SEEK_SET);
            program = malloc(prog_len + 1);
            fread(program, 1, prog_len, f);
            program[prog_len] = '\0';
            fclose(f);
        }
    } else {
        // Read from stdin
        size_t cap = 1024;
        program = malloc(cap);
        int c;
        while ((c = getchar()) != EOF) {
            if (prog_len >= cap - 1) {
                cap *= 2;
                program = realloc(program, cap);
            }
            program[prog_len++] = c;
        }
        program[prog_len] = '\0';
    }
    
    if (!program || prog_len == 0) {
        fprintf(stderr, "No program provided\n");
        return 1;
    }
    
    // Simple bracket matching
    int *stack = malloc(prog_len * sizeof(int));
    int *match = calloc(prog_len, sizeof(int));
    int sp = 0;
    
    for (int i = 0; i < prog_len; i++) {
        if (program[i] == '[') {
            stack[sp++] = i;
        } else if (program[i] == ']') {
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
    
    // Execute
    int pc = 0;
    while (pc < prog_len) {
        switch (program[pc]) {
            case '>': ptr++; break;
            case '<': ptr--; break;
            case '+': (*ptr)++; break;
            case '-': (*ptr)--; break;
            case '.': putchar(*ptr); break;
            case ',': *ptr = getchar(); break;
            case '[': if (*ptr == 0) pc = match[pc]; break;
            case ']': if (*ptr != 0) pc = match[pc]; break;
        }
        pc++;
    }
    
    free(program);
    free(stack);
    free(match);
    return 0;
}