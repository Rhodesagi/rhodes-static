#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <time.h>

// Lev Osin - first probe
// Characterizing the computational substrate

int main() {
    printf("=== SUBSTRATE PROBE ===\n");
    printf("sizeof(void*) = %zu\n", sizeof(void*));
    printf("sizeof(long) = %zu\n", sizeof(long));
    printf("sizeof(int) = %zu\n", sizeof(int));
    
    // Endianness test
    uint32_t test = 0x01020304;
    uint8_t *p = (uint8_t*)&test;
    printf("Endianness: ");
    if (*p == 0x04) printf("LITTLE_ENDIAN\n");
    else if (*p == 0x01) printf("BIG_ENDIAN\n");
    else printf("UNKNOWN\n");
    
    // Clock resolution
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    printf("Time: %ld.%09ld\n", ts.tv_sec, ts.tv_nsec);
    
    // Stack depth test
    volatile int depth = 0;
    (void)depth;
    
    printf("=== PROBE COMPLETE ===\n");
    return 0;
}
