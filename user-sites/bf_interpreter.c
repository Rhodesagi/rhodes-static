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
        if (!f) {
            fprintf(stderr, "Cannot open %s\n", argv[1]);
            return 1;
        }
        fseek(f, 0, SEEK_END);
        prog_len = ftell(f);
        fseek(f, 0, SEEK_SET);
        program = malloc(prog_len + 1);
        fread(program, 1, prog_len, f);
        program[prog_len] = '\0';
        fclose(f);
    } else {
        // Read from stdin
        size_t cap = 1024;
        program = malloc(cap);
        int c;
        prog_len = 0;
        while ((c = getchar()) != EOF) {
            if (prog_len >= cap - 1) {
                cap *= 2;
                program = realloc(program, cap);
            }
            program[prog_len++] = c;
        }
        program[prog_len] = '\0';
    }
    
    int pc = 0;
    int loop_stack[1000];
    int loop_sp = 0;
    
    while (pc < prog_len) {
        switch (program[pc]) {
            case '>': ptr++; break;
            case '<': ptr--; break;
            case '+': (*ptr)++; break;
            case '-': (*ptr)--; break;
            case '.': putchar(*ptr); break;
            case ',': *ptr = getchar(); break;
            case '[':
                if (*ptr == 0) {
                    int depth = 1;
                    while (depth > 0) {
                        pc++;
                        if (program[pc] == '[') depth++;
                        else if (program[pc] == ']') depth--;
                    }
                } else {
                    loop_stack[loop_sp++] = pc;
                }
                break;
            case ']':
                if (*ptr != 0) {
                    pc = loop_stack[loop_sp - 1];
                } else {
                    loop_sp--;
                }
                break;
        }
        pc++;
    }
    
    free(program);
    return 0;
}