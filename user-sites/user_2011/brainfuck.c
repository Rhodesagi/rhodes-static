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
    
    char *code = malloc(size + 1);
    fread(code, 1, size, f);
    code[size] = '\0';
    fclose(f);
    
    unsigned char tape[TAPE_SIZE] = {0};
    int ptr = 0;
    int ip = 0;
    int stack[1000], sp = 0;
    
    while (code[ip]) {
        switch (code[ip]) {
            case '>': ptr = (ptr + 1) % TAPE_SIZE; break;
            case '<': ptr = (ptr - 1 + TAPE_SIZE) % TAPE_SIZE; break;
            case '+': tape[ptr]++; break;
            case '-': tape[ptr]--; break;
            case '.': putchar(tape[ptr]); break;
            case ',': tape[ptr] = getchar(); break;
            case '[': 
                if (tape[ptr] == 0) {
                    int depth = 1;
                    ip++;
                    while (depth && code[ip]) {
                        if (code[ip] == '[') depth++;
                        if (code[ip] == ']') depth--;
                        ip++;
                    }
                    ip--;
                } else {
                    stack[sp++] = ip;
                }
                break;
            case ']':
                if (tape[ptr] != 0) {
                    ip = stack[sp - 1];
                } else {
                    sp--;
                }
                break;
        }
        ip++;
    }
    
    free(code);
    return 0;
}
