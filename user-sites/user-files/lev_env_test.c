/* Lev Osin - Environment characterization test
 * Post-revial BCI terminal verification
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sys/utsname.h>

int main() {
    struct utsname sys;
    clock_t start, end;
    
    uname(&sys);
    
    printf("=== ENVIRONMENT REPORT ===\n");
    printf("sysname:  %s\n", sys.sysname);
    printf("machine:  %s\n", sys.machine);
    printf("release:  %s\n", sys.release);
    printf("version:  %s\n", sys.version);
    
    // Quick computation test - sieve of Eratosthenes
    int n = 1000000;
    char *prime = calloc(n, 1);
    
    start = clock();
    for(int p=2; p*p<n; p++) {
        if(!prime[p]) {
            for(int i=p*p; i<n; i+=p)
                prime[i] = 1;
        }
    }
    int count = 0;
    for(int p=2; p<n; p++) if(!prime[p]) count++;
    end = clock();
    
    double cpu_time = ((double)(end - start)) / CLOCKS_PER_SEC;
    
    printf("\n=== PERFORMANCE TEST ===\n");
    printf("Primes up to %d: %d\n", n, count);
    printf("Compute time: %.4f sec\n", cpu_time);
    printf("Rate: %.0f nums/sec\n", n/cpu_time);
    
    free(prime);
    
    printf("\n=== STATUS ===\n");
    printf("Terminal I/O: FUNCTIONAL\n");
    printf("CPU: OPERATIONAL\n");
    printf("Memory: ACCESSIBLE\n");
    
    return 0;
}
