#include <stdio.h>
#include <stdlib.h>

// Quick BCI functionality test
int main() {
    printf("BCI terminal active\n");
    printf("Testing write capability...\n");
    FILE *f = fopen("bci_test_output.txt", "w");
    if (f) {
        fprintf(f, "Lev Osin - BCI output confirmed %lu\n", (unsigned long)time(NULL));
        fclose(f);
        printf("File write: OK\n");
    }
    return 0;
}
