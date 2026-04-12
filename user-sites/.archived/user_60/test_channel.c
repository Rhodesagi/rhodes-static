#include <stdio.h>
#include <time.h>

int main() {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    
    // Test stdout through BCI
    printf("BCI channel active\n");
    printf("Time: %lld.%.9ld\n", (long long)ts.tv_sec, ts.tv_nsec);
    
    // Check if we can detect architecture
    #ifdef __x86_64__
    printf("ARCH: x86_64\n");
    #elif __aarch64__
    printf("ARCH: aarch64\n");
    #elif __riscv
    printf("ARCH: riscv\n");
    #else
    printf("ARCH: unknown\n");
    #endif
    
    return 0;
}
