#include <stdio.h>
#include <stdlib.h>
#define TAPE_SIZE 30000

int main(int argc, char **argv) {
    if (argc < 2) { fprintf(stderr, "Usage: %s <file.bf>\n", argv[0]); return 1; }
    FILE *f = fopen(argv[1], "r");
    if (!f) { perror("fopen"); return 1; }
    
    char *code = NULL;
    size_t n = 0;
    int c;
    while ((c = fgetc(f)) != EOF) {
        if (c == '>' || c == '<' || c == '+' || c == '-' || c == '.' || c == ',' || c == '[' || c == ']') {
            code = realloc(code, n + 1);
            code[n++] = c;
        }
    }
    fclose(f);
    
    char tape[TAPE_SIZE] = {0};
    int ip = 0, dp = 0;
    
    while (ip < n) {
        switch (code[ip]) {
            case '>': dp++; break;
            case '<': dp--; break;
            case '+': tape[dp]++; break;
            case '-': tape[dp]--; break;
            case '.': putchar(tape[dp]); break;
            case ',': tape[dp] = getchar(); break;
            case '[': if (!tape[dp]) { int d = 1; while (d) { ip++; if (code[ip] == '[') d++; else if (code[ip] == ']') d--; } } break;
            case ']': if (tape[dp]) { int d = 1; while (d) { ip--; if (code[ip] == ']') d++; else if (code[ip] == '[') d--; } } break;
        }
        ip++;
    }
    free(code);
    return 0;
}
