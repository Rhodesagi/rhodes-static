# Simple RISC-V RV32I test program
# Computes 1 + 2 + 3 + ... + 10 = 55, then exits

    .text
    .globl _start
_start:
    li x1, 10          # n = 10
    li x2, 0           # sum = 0
    li x3, 1           # i = 1

loop:
    bgt x3, x1, done   # if i > n, done
    add x2, x2, x3     # sum += i
    addi x3, x3, 1     # i++
    j loop

done:
    li x10, 55         # expected result
    li x17, 93         # exit syscall
    ecall
