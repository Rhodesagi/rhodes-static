#include <stdio.h>
#include <stdlib.h>

int main(int argc, char **argv) {
    if (argc < 2) return 1;
    FILE *f = fopen(argv[1], "r");
    if (!f) return 1;
    
    char code[65536];
    int n = fread(code, 1, 65536, f);
    fclose(f);
    
    char mem[65536] = {0};
    int mp = 0;
    
    for (int ip = 0; ip < n; ip++) {
        switch (code[ip]) {
            case '>': mp++; break;
            case '<': mp--; break;
            case '+': mem[mp]++; break;
            case '-': mem[mp]--; break;
            case '.': putchar(mem[mp]); break;
            case ',': mem[mp] = getchar(); break;
            case '[':
                if (!mem[mp]) {
                    int depth = 1;
                    while (depth) {
                        ip++;
                        if (code[ip] == '[') depth++;
                        else if (code[ip] == ']') depth--;
                    }
                }
                break;
            case ']':
                if (mem[mp]) {
                    int depth = 1;
                    while (depth) {
                        ip--;
                        if (code[ip] == ']') depth++;
                        else if (code[ip] == '[') depth--;
                    }
                }
                break;
        }
    }
    return 0;
}
