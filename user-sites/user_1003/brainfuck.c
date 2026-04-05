#include <stdio.h>
#include <stdlib.h>

#define TAPE_SIZE 30000

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <brainfuck_code>\n", argv[0]);
        return 1;
    }
    
    char tape[TAPE_SIZE] = {0};
    char *ptr = tape;
    char *code = argv[1];
    char loop_stack[1000];
    int loop_sp = 0;
    
    for (int i = 0; code[i]; i++) {
        switch (code[i]) {
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
                        i++;
                        if (code[i] == '[') depth++;
                        else if (code[i] == ']') depth--;
                    }
                } else {
                    loop_stack[loop_sp++] = i;
                }
                break;
            case ']':
                if (*ptr != 0) {
                    i = loop_stack[loop_sp - 1];
                } else {
                    loop_sp--;
                }
                break;
        }
    }
    return 0;
}
