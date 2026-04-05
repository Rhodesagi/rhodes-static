#include <stdio.h>
#include <sys/utsname.h>
#include <unistd.h>

int main() {
    struct utsname u;
    uname(&u);
    
    printf("sysname:  %s\n", u.sysname);
    printf("nodename: %s\n", u.nodename);
    printf("release:  %s\n", u.release);
    printf("version:  %s\n", u.version);
    printf("machine:  %s\n", u.machine);
    
    #ifdef __x86_64__
    printf("arch: x86_64\n");
    #elif defined(__aarch64__)
    printf("arch: aarch64\n");
    #elif defined(__arm__)
    printf("arch: arm\n");
    #else
    printf("arch: unknown\n");
    #endif
    
    printf("pagesize: %ld\n", sysconf(_SC_PAGESIZE));
    printf("online_cpus: %ld\n", sysconf(_SC_NPROCESSORS_ONLN));
    
    return 0;
}
