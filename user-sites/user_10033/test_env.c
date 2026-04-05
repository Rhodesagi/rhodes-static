#include <stdio.h>

int main() {
    printf("Architecture: ");
#ifdef __x86_64__
    printf("x86_64\n");
#elif __aarch64__
    printf("aarch64\n");
#elif __arm__
    printf("arm\n");
#else
    printf("unknown\n");
#endif
    printf("Compiler: %s %d.%d.%d\n", __clang__ ? "clang" : __GNUC__ ? "gcc" : "other",
           __GNUC__, __GNUC_MINOR__, __GNUC_PATCHLEVEL__);
    return 0;
}
