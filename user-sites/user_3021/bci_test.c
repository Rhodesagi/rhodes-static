#include <stdio.h>
#include <string.h>

// BCI environment test
// Lev Osin - Alcor A-3891

int main() {
    printf("Osin BCI Terminal Test\n");
    printf("======================\n");
    printf("Subject: Lev Osin (A-3891)\n");
    printf("Test: Cognitive + Compiler Verification\n\n");
    
    // Test 1: Basic computation
    int a = 0xDEAD;
    int b = 0xBEEF;
    printf("0x%x + 0x%x = 0x%x\n", a, b, a + b);
    
    // Test 2: String manipulation
    const char* msg = "BCI interface active";
    printf("String test: %s (len=%zu)\n", msg, strlen(msg));
    
    // Test 3: Loop and branch
    int sum = 0;
    for (int i = 1; i <= 100; i++) sum += i;
    printf("Sum 1..100 = %d (expected 5050)\n", sum);
    
    printf("\nEnvironment verified. Proceeding to terminal access.\n");
    return 0;
}
