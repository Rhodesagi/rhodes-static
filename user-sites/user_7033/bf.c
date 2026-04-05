#include <stdio.h>
#include <stdlib.h>

#define TAPE_SIZE 30000

int main(int argc, char **argv) {
    unsigned char tape[TAPE_SIZE] = {0};
    unsigned char *ptr = tape;
    
    int c;
    while ((c = getchar()) != EOF) {
        switch (c) {
            case '>':
                ++ptr;
                break;
            case '<':
                --ptr;
                break;
            case '+':
                ++(*ptr);
                break;
            case '-':
                --(*ptr);
                break;
            case '.':
                putchar(*ptr);
                break;
            case ',':
                *ptr = getchar();
                break;
            case '[':
                if (*ptr == 0) {
                    int depth = 1;
                    while (depth > 0) {
                        c = getchar();
                        if (c == '[') depth++;
                        else if (c == ']') depth--;
                    }
                }
                break;
            case ']':
                if (*ptr != 0) {
                    int depth = 1;
                    while (depth > 0) {
                        ungetc(c, stdin);
                        c = getchar();
                        if (c == ']') depth++;
                        else if (c == '[') depth--;
                    }
                }
                break;
            default:
                // ignore other characters
                break;
        }
    }
    return 0;
}