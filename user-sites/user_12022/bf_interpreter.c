#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define TAPE_SIZE 30000

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <brainfuck_file>\n", argv[0]);
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

    char *program = malloc(size + 1);
    fread(program, 1, size, f);
    program[size] = '\0';
    fclose(f);

    unsigned char tape[TAPE_SIZE] = {0};
    int ptr = 0;
    char *ip = program;

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
                    while (depth) {
                        ip++;
                        if (*ip == '[') depth++;
                        else if (*ip == ']') depth--;
                    }
                }
                break;
            case ']':
                if (tape[ptr]) {
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

    free(program);
    return 0;
}
