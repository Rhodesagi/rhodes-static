#include <stdio.h>
#include <stdint.h>
#include <time.h>

#ifdef __x86_64__
#define ARCH "x86_64"
#elif __aarch64__
#define ARCH "aarch64"
#else
#define ARCH "unknown"
#endif

#ifdef __OPTIMIZE__
#define OPT_LEVEL __OPTIMIZE__
#else
#define OPT_LEVEL "none"
#endif

static uint64_t factorial(uint64_t n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    printf("Architecture: %s\n", ARCH);
    printf("Optimization level: %s\n", OPT_LEVEL);
    printf("Compiler: GCC %d.%d.%d\n", __GNUC__, __GNUC_MINOR__, __GNUC_PATCHLEVEL__);
    
    struct timespec start, end;
    clock_gettime(CLOCK_MONOTONIC, &start);
    uint64_t result = factorial(20);
    clock_gettime(CLOCK_MONOTONIC, &end);
    
    double elapsed = (end.tv_sec - start.tv_sec) + (end.tv_nsec - start.tv_nsec) * 1e-9;
    printf("Factorial 20 = %lu\n", result);
    printf("Time: %.9f seconds\n", elapsed);
    return 0;
}