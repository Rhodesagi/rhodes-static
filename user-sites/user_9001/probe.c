#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    printf("=== SUBSTRATE PROBE ===\n");
    
    // Word size
    printf("sizeof(void*): %zu\n", sizeof(void*));
    printf("sizeof(long): %zu\n", sizeof(long));
    printf("sizeof(int): %zu\n", sizeof(int));
    
    // Endianness
    union {
        uint32_t i;
        char c[4];
    } endian_test = {0x01020304};
    printf("endian: %s\n", 
        endian_test.c[0] == 0x01 ? "BIG" : "LITTLE");
    
    // Stack probe
    volatile char stack_test[1024*1024];
    printf("stack allocation: 1MB ok\n");
    
    // Heap probe
    size_t heap_sizes[] = {1024*1024, 16*1024*1024, 128*1024*1024, 512*1024*1024};
    for (int i = 0; i < 4; i++) {
        void *p = malloc(heap_sizes[i]);
        if (p) {
            memset(p, 0xAA, heap_sizes[i]);
            free(p);
            printf("heap: %zu MB alloc ok\n", heap_sizes[i]/(1024*1024));
        } else {
            printf("heap: %zu MB alloc FAILED\n", heap_sizes[i]/(1024*1024));
        }
    }
    
    // CPU features via /proc if available
    FILE *f = fopen("/proc/cpuinfo", "r");
    if (f) {
        char line[256];
        int count = 0;
        while (fgets(line, sizeof(line), f) && count < 10) {
            if (strstr(line, "model name") || strstr(line, "Architecture")) {
                printf("cpu: %s", line);
                count++;
            }
        }
        fclose(f);
    }
    
    // Clock
    printf("clock test: ");
    volatile uint64_t counter = 0;
    for (int i = 0; i < 100000000; i++) {
        counter++;
    }
    printf("100M iterations completed\n");
    
    return 0;
}
