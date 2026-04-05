#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define TAPE_SIZE 30000

int main(int argc, char **argv) {
    unsigned char tape[TAPE_SIZE] = {0};
    unsigned char *ptr = tape;
    char *program = NULL;
    size_t program_len = 0;
    
    if (argc > 1) {
        FILE *fp = fopen(argv[1], "r");
        if (!fp) {
            fprintf(stderr, "Cannot open file %s\n", argv[1]);
            return 1;
        }
        fseek(fp, 0, SEEK_END);
        program_len = ftell(fp);
        rewind(fp);
        program = malloc(program_len + 1);
        fread(program, 1, program_len, fp);
        program[program_len] = '\0';
        fclose(fp);
    } else {
        // Read from stdin
        size_t cap = 4096;
        program = malloc(cap);
        int c;
        size_t i = 0;
        while ((c = getchar()) != EOF) {
            if (i >= cap) {
                cap *= 2;
                program = realloc(program, cap);
            }
            program[i++] = c;
        }
        program_len = i;
        program[program_len] = '\0';
    }
    
    for (size_t pc = 0; pc < program_len; pc++) {
        switch (program[pc]) {
            case '>': ++ptr; break;
            case '<': --ptr; break;
            case '+': ++*ptr; break;
            case '-': --*ptr; break;
            case '.': putchar(*ptr); fflush(stdout); break;
            case ',': *ptr = getchar(); break;
            case '[':
                if (*ptr == 0) {
                    int depth = 1;
                    while (depth > 0) {
                        pc++;
                        if (program[pc] == '[') depth++;
                        if (program[pc] == ']') depth--;
                    }
                }
                break;
            case ']':
                if (*ptr != 0) {
                    int depth = 1;
                    while (depth > 0) {
                        pc--;
                        if (program[pc] == '[') depth--;
                        if (program[pc] == ']') depth++;
                    }
                }
                break;
            default:
                // ignore other chars
                break;
        }
    }
    
    free(program);
    return 0;
}