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

    char *code = NULL;
    size_t code_len = 0;
    char ch;
    while ((ch = fgetc(f)) != EOF) {
        if (ch == '>' || ch == '<' || ch == '+' || ch == '-' || 
            ch == '.' || ch == ',' || ch == '[' || ch == ']') {
            code = realloc(code, code_len + 1);
            code[code_len++] = ch;
        }
    }
    fclose(f);

    unsigned char tape[TAPE_SIZE] = {0};
    int tape_ptr = 0;
    int ip = 0;

    while (ip < code_len) {
        switch (code[ip]) {
            case '>': tape_ptr = (tape_ptr + 1) % TAPE_SIZE; break;
            case '<': tape_ptr = (tape_ptr - 1 + TAPE_SIZE) % TAPE_SIZE; break;
            case '+': tape[tape_ptr]++; break;
            case '-': tape[tape_ptr]--; break;
            case '.': putchar(tape[tape_ptr]); break;
            case ',': tape[tape_ptr] = getchar(); break;
            case '[':
                if (tape[tape_ptr] == 0) {
                    int depth = 1;
                    while (depth > 0) {
                        ip++;
                        if (code[ip] == '[') depth++;
                        if (code[ip] == ']') depth--;
                    }
                }
                break;
            case ']':
                if (tape[tape_ptr] != 0) {
                    int depth = 1;
                    while (depth > 0) {
                        ip--;
                        if (code[ip] == ']') depth++;
                        if (code[ip] == '[') depth--;
                    }
                }
                break;
        }
        ip++;
    }

    free(code);
    return 0;
}
