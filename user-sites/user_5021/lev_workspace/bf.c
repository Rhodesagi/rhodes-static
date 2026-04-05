#include <stdio.h>
#include <stdlib.h>

#define TAPE_SIZE 30000

int main(int argc, char *argv[]) {
    if (argc < 2) {
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
    code[size] = 0;
    fclose(f);
    
    unsigned char tape[TAPE_SIZE] = {0};
    unsigned char *ptr = tape;
    int *stack = malloc(size * sizeof(int));
    int sp = 0;
    
    for (int ip = 0; code[ip]; ip++) {
        switch (code[ip]) {
            case '>': ptr++; break;
            case '<': ptr--; break;
            case '+': (*ptr)++; break;
            case '-': (*ptr)--; break;
            case '.': putchar(*ptr); break;
            case ',': *ptr = getchar(); break;
            case '[': 
                if (*ptr == 0) {
                    int depth = 1;
                    while (depth) {
                        ip++;
                        if (code[ip] == '[') depth++;
                        else if (code[ip] == ']') depth--;
                    }
                } else {
                    stack[sp++] = ip;
                }
                break;
            case ']':
                if (*ptr != 0) {
                    ip = stack[sp - 1];
                } else {
                    sp--;
                }
                break;
        }
    }
    
    free(code);
    free(stack);
    return 0;
}
