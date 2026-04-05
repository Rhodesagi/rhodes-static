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

    char *program = malloc(size + 1);
    fread(program, 1, size, f);
    program[size] = '\0';
    fclose(f);

    char tape[TAPE_SIZE] = {0};
    char *ptr = tape;
    char *pc = program;
    int loop_stack[1000], sp = 0;

    while (*pc) {
        switch (*pc) {
            case '>': ptr++; break;
            case '<': ptr--; break;
            case '+': (*ptr)++; break;
            case '-': (*ptr)--; break;
            case '.': putchar(*ptr); break;
            case ',': *ptr = getchar(); break;
            case '[':
                if (!*ptr) {
                    int depth = 1;
                    pc++;
                    while (depth > 0) {
                        if (*pc == '[') depth++;
                        if (*pc == ']') depth--;
                        pc++;
                    }
                    pc--;
                } else {
                    loop_stack[sp++] = pc - program;
                }
                break;
            case ']':
                if (*ptr) {
                    pc = program + loop_stack[sp - 1] - 1;
                } else {
                    sp--;
                }
                break;
        }
        pc++;
    }

    free(program);
    return 0;
}