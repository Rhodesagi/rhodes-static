#include <stdio.h>
#include <stdlib.h>

#define TAPE_SIZE 30000

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <brainfuck.bf>\n", argv[0]);
        return 1;
    }

    FILE *fp = fopen(argv[1], "r");
    if (!fp) {
        perror("fopen");
        return 1;
    }

    fseek(fp, 0, SEEK_END);
    long size = ftell(fp);
    fseek(fp, 0, SEEK_SET);

    char *program = malloc(size + 1);
    fread(program, 1, size, fp);
    program[size] = '\0';
    fclose(fp);

    char tape[TAPE_SIZE] = {0};
    char *ptr = tape;
    char *pc = program;

    while (*pc) {
        switch (*pc) {
            case '>': ptr++; break;
            case '<': ptr--; break;
            case '+': (*ptr)++; break;
            case '-': (*ptr)--; break;
            case '.': putchar(*ptr); break;
            case ',': *ptr = getchar(); break;
            case '[':
                if (*ptr == 0) {
                    int depth = 1;
                    pc++;
                    while (depth > 0) {
                        if (*pc == '[') depth++;
                        if (*pc == ']') depth--;
                        pc++;
                    }
                    pc--;
                }
                break;
            case ']':
                if (*ptr != 0) {
                    int depth = 1;
                    pc--;
                    while (depth > 0) {
                        if (*pc == ']') depth++;
                        if (*pc == '[') depth--;
                        pc--;
                    }
                    pc++;
                }
                break;
        }
        pc++;
    }

    free(program);
    return 0;
}
