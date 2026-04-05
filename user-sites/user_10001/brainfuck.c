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
    
    unsigned char tape[TAPE_SIZE] = {0};
    unsigned char *ptr = tape;
    int pc = 0;
    
    while (program[pc]) {
        switch (program[pc]) {
            case '>': ptr++; break;
            case '<': ptr--; break;
            case '+': (*ptr)++; break;
            case '-': (*ptr)--; break;
            case '.': putchar(*ptr); break;
            case ',': *ptr = getchar(); break;
            case '[':
                if (!*ptr) {
                    int depth = 1;
                    while (depth) {
                        pc++;
                        if (program[pc] == '[') depth++;
                        else if (program[pc] == ']') depth--;
                    }
                }
                break;
            case ']':
                if (*ptr) {
                    int depth = 1;
                    while (depth) {
                        pc--;
                        if (program[pc] == ']') depth++;
                        else if (program[pc] == '[') depth--;
                    }
                }
                break;
        }
        pc++;
    }
    
    return 0;
}
