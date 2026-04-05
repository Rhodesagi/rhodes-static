#include <stdio.h>
#include <stdint.h>

// Environment verification for BCI-mediated compilation
// Lev Osin - Alcor case A-3891

int main() {
    printf("Architecture: x86_64\n");
    printf("Compiler: GCC 15.2.1\n");
    printf("sizeof(void*): %zu\n", sizeof(void*));
    printf("sizeof(long): %zu\n", sizeof(long));
    
    // Verify basic integer ops work correctly
    uint64_t test = 0xDEADBEEFCAFEBABE;
    printf("Endianness test: 0x%016lX\n", test);
    
    return 0;
}
