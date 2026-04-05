#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    printf("Architecture: ");
    #ifdef __x86_64__
    printf("x86_64\n");
    #elif defined(__aarch64__)
    printf("aarch64\n");
    #elif defined(__arm__)
    printf("arm\n");
    #else
    printf("unknown\n");
    #endif
    
    printf("Compiler: %s %d.%d\n", 
        __GNUC__ ? "gcc" : "clang",
        __GNUC_MAJOR__, __GNUC_MINOR__);
    
    printf("Pointer size: %zu\n", sizeof(void*));
    printf("Time check: %lu\n", (unsigned long)time(NULL));
    
    return 0;
}
