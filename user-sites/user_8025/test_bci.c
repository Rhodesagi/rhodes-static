#include <stdio.h>
#include <time.h>

int main() {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    printf("BCI interface test\n");
    printf("System time: %ld.%09ld\n", ts.tv_sec, ts.tv_nsec);
    printf("sizeof(void*) = %zu\n", sizeof(void*));
    printf("sizeof(long) = %zu\n", sizeof(long));
    return 0;
}
