#include <stdio.h>
#include <stdint.h>

int main() {
    printf("Testing substrate...\n");
    
    // Check pointer size
    printf("Pointer size: %zu bits\n", sizeof(void*) * 8);
    
    // Check endianness
    uint16_t test = 0x0102;
    printf("Endianness: %s\n", (*(uint8_t*)&test == 0x01) ? "big" : "little");
    
    // Basic int sizes
    printf("int: %zu, long: %zu, long long: %zu\n", 
           sizeof(int), sizeof(long), sizeof(long long));
    
    // Try to detect architecture from compiler defines
    #ifdef __x86_64__
    printf("Arch: x86_64\n");
    #elif __aarch64__
    printf("Arch: aarch64\n");
    #elif __arm__
    printf("Arch: arm\n");
    #elif __riscv
    printf("Arch: riscv\n");
    #else
    printf("Arch: unknown\n");
    #endif
    
    return 0;
}
