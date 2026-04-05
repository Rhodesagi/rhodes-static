#include <stdio.h>
#include <stdint.h>

int main() {
    // Characterize the substrate
    printf("sizeof(void*) = %zu\n", sizeof(void*));
    printf("sizeof(long) = %zu\n", sizeof(long));
    
    #if defined(__x86_64__)
    printf("arch: x86_64\n");
    #elif defined(__aarch64__)
    printf("arch: aarch64\n");
    #elif defined(__arm__)
    printf("arch: arm\n");
    #else
    printf("arch: unknown\n");
    #endif
    
    #if defined(__clang__)
    printf("compiler: clang %d.%d.%d\n", __clang_major__, __clang_minor__, __clang_patchlevel__);
    #elif defined(__GNUC__)
    printf("compiler: gcc %d.%d.%d\n", __GNUC__, __GNUC_MINOR__, __GNUC_PATCHLEVEL__);
    #else
    printf("compiler: unknown\n");
    #endif
    
    return 0;
}
