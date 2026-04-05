# Simple RISC-V test program
# Computes fib(10) = 55

    .text
    .globl _start
_start:
    li   a0, 10          # n = 10
    li   a1, 0           # a = 0
    li   a2, 1           # b = 1
    li   a3, 0           # i = 0
    
loop:
    beq  a3, a0, done    # if i == n, exit
    add  a4, a1, a2      # c = a + b
    mv   a1, a2          # a = b
    mv   a2, a4          # b = c
    addi a3, a3, 1       # i++
    j    loop
    
done:
    mv   a0, a1          # return a
    ecall                # halt
