#include <stdio.h>
#include <stddef.h>

int main() {
#ifdef __x86_64__
    printf("Arch: x86_64\n");
#endif
#ifdef __i386__
    printf("Arch: i386\n");
#endif
#ifdef __aarch64__
    printf("Arch: AArch64\n");
#endif
#ifdef __arm__
    printf("Arch: ARM\n");
#endif
#ifdef __riscv
    printf("Arch: RISC-V\n");
#endif
#ifdef __APPLE__
    printf("OS: macOS/Darwin\n");
#endif
#ifdef __linux__
    printf("OS: Linux\n");
#endif
#ifdef __FreeBSD__
    printf("OS: FreeBSD\n");
#endif
    printf("Pointer size: %zu bits\n", sizeof(void*) * 8);
    printf("Int size: %zu bits\n", sizeof(int) * 8);
    printf("Long size: %zu bits\n", sizeof(long) * 8);
    return 0;
}