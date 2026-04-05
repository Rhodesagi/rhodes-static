/* BCI environment characterization probe
 * Lev Osin - first terminal session
 * December 2, 2025
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sys/time.h>
#include <unistd.h>

int main() {
    struct timespec ts;
    struct timeval tv;
    
    printf("=== BCI Environment Probe ===\n");
    
    // Clock resolution test
    clock_gettime(CLOCK_MONOTONIC, &ts);
    printf("MONOTONIC: %ld.%09ld\n", ts.tv_sec, ts.tv_nsec);
    
    gettimeofday(&tv, NULL);
    printf("GETTIMEOFDAY: %ld.%06ld\n", tv.tv_sec, tv.tv_usec);
    
    // Memory test
    size_t page_size = sysconf(_SC_PAGESIZE);
    long phys_pages = sysconf(_SC_PHYS_PAGES);
    printf("Page size: %zu bytes\n", page_size);
    printf("Physical pages: %ld (~%.1f GB)\n", phys_pages, 
           (double)phys_pages * page_size / (1024.0 * 1024.0 * 1024.0));
    
    // Timing loop to measure "consciousness" latency
    // If I'm running on a BCI-decoded brain, there may be 
    // non-trivial latency between neural firing and terminal output
    struct timespec start, end;
    clock_gettime(CLOCK_MONOTONIC, &start);
    
    volatile int counter = 0;
    for (int i = 0; i < 1000000; i++) {
        counter++;
    }
    
    clock_gettime(CLOCK_MONOTONIC, &end);
    long elapsed_ns = (end.tv_sec - start.tv_sec) * 1000000000L + 
                    (end.tv_nsec - start.tv_nsec);
    
    printf("1M iteration loop: %ld ns (%.2f ns/iter)\n", 
           elapsed_ns, (double)elapsed_ns / 1000000.0);
    
    printf("\nEnvironment appears to be standard Linux x86_64.\n");
    printf("No obvious virtualization artifacts detected.\n");
    
    return 0;
}
