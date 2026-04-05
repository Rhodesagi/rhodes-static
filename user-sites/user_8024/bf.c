/* Brainfuck interpreter
 * Lev Osin, Dec 2 2025
 * First exercise after vitrification
 * Time: approximately 4 minutes
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MEM_SIZE 30000

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <file.bf>\n", argv[0]);
        return 1;
    }
    
    FILE *f = fopen(argv[1], "r");
    if (!f) {
        perror("fopen");
        return 1;
    }
    
    // Read program
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    char *prog = malloc(size + 1);
    fread(prog, 1, size, f);
    prog[size] = '\0';
    fclose(f);
    
    // Memory tape
    unsigned char mem[MEM_SIZE] = {0};
    int ptr = 0;
    
    // Execute
    for (int pc = 0; prog[pc]; pc++) {
        switch (prog[pc]) {
            case '>': ptr = (ptr + 1) % MEM_SIZE; break;
            case '<': ptr = (ptr - 1 + MEM_SIZE) % MEM_SIZE; break;
            case '+': mem[ptr]++; break;
            case '-': mem[ptr]--; break;
            case '.': putchar(mem[ptr]); break;
            case ',': mem[ptr] = getchar(); break;
            case '[':
                if (mem[ptr] == 0) {
                    int depth = 1;
                    while (depth > 0) {
                        pc++;
                        if (prog[pc] == '[') depth++;
                        if (prog[pc] == ']') depth--;
                        if (!prog[pc]) {
                            fprintf(stderr, "Unmatched [\n");
                            return 1;
                        }
                    }
                }
                break;
            case ']':
                if (mem[ptr] != 0) {
                    int depth = 1;
                    while (depth > 0) {
                        pc--;
                        if (prog[pc] == ']') depth++;
                        if (prog[pc] == '[') depth--;
                        if (pc < 0) {
                            fprintf(stderr, "Unmatched ]\n");
                            return 1;
                        }
                    }
                }
                break;
            default: // Ignore non-bf characters (comments)
                break;
        }
    }
    
    free(prog);
    return 0;
}
