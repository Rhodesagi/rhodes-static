#include <stdio.h>
#include <stdlib.h>

#define TAPE_SIZE 30000

void interpret(const char *code) {
    char tape[TAPE_SIZE] = {0};
    int ptr = 0;
    const char *ip = code;
    
    while (*ip) {
        switch (*ip) {
            case '>': ptr = (ptr + 1) % TAPE_SIZE; break;
            case '<': ptr = (ptr - 1 + TAPE_SIZE) % TAPE_SIZE; break;
            case '+': tape[ptr]++; break;
            case '-': tape[ptr]--; break;
            case '.': putchar(tape[ptr]); break;
            case ',': tape[ptr] = getchar(); break;
            case '[': 
                if (!tape[ptr]) {
                    int depth = 1;
                    ip++;
                    while (depth) {
                        if (*ip == '[') depth++;
                        else if (*ip == ']') depth--;
                        ip++;
                    }
                    ip--;
                }
                break;
            case ']':
                if (tape[ptr]) {
                    int depth = 1;
                    ip--;
                    while (depth) {
                        if (*ip == ']') depth++;
                        else if (*ip == '[') depth--;
                        ip--;
                    }
                    ip++;
                }
                break;
        }
        ip++;
    }
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <brainfuck_code>\n", argv[0]);
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
    
    interpret(code);
    free(code);
    return 0;
}
