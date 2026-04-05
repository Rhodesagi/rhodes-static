#!/usr/bin/env python3
import struct

# Correct RISC-V instructions for fib(10)
insts = [
    0x00a00513,  # addi x10, x0, 10    # n = 10
    0x00000593,  # addi x11, x0, 0     # a = 0
    0x00100613,  # addi x12, x0, 1     # b = 1
    0x00000693,  # addi x13, x0, 0     # i = 0
    # loop at 16:
    0x00a68663,  # beq x13, x10, 40    # if i==n goto done
    0x00c70733,  # add x14, x11, x12   # c = a + b
    0x00060593,  # addi x11, x12, 0    # a = b
    0x00070693,  # addi x12, x14, 0    # b = c
    0x00168693,  # addi x13, x13, 1    # i++
    0xfedff06f,  # jal x0, -20         # j loop (correct encoding)
    # done at 40:
    0x00058513,  # addi x10, x11, 0    # return a
    0x00000073,  # ecall               # halt
]

data = b''.join(struct.pack('<I', i) for i in insts)

with open('/var/www/html/user-sites/user_12001/fib.bin', 'wb') as f:
    f.write(data)

print(f"Written {len(data)} bytes ({len(insts)} instructions)")
for i, inst in enumerate(insts):
    print(f"  {i*4:3d}: 0x{inst:08x}")
