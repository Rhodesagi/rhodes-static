#!/usr/bin/env python3
import struct

# Correct RISC-V instructions for fib(10)
# Computes: a=0, b=1, for i in range(10): c=a+b; a=b; b=c; return a

insts = [
    0x00a00513,  # addi x10, x0, 10    # n = 10
    0x00000593,  # addi x11, x0, 0     # a = 0
    0x00100613,  # addi x12, x0, 1     # b = 1
    0x00000693,  # addi x13, x0, 0     # i = 0
    # loop at 16:
    0x00a68463,  # beq x13, x10, 40    # if i==n goto done (offset=6)
    0x00c70733,  # add x14, x11, x12   # c = a + b
    0x00058693,  # addi x11, x12, 0    # a = b (mv a1, a2)
    0x00070713,  # addi x14, x14, 0    # b = c (mv a2, a4) - wait, wrong
    # Actually mv a2, a4 = addi x12, x14, 0
    # addi rd, rs1, imm: imm[11:0]=0, rs1=14, funct3=000, rd=12, opcode=0010011
    # 000000000000 01110 000 01100 0010011 = 0x00070693
    0x00070693,  # addi x12, x14, 0    # b = c
    0x00168693,  # addi x13, x13, 1    # i++
    0xfe9ff06f,  # jal x0, -24         # j loop (offset = 16-40 = -24)
    # done at 40:
    0x00058513,  # addi x10, x11, 0    # return a (mv a0, a1)
    0x00000073,  # ecall               # halt
]

data = b''.join(struct.pack('<I', i) for i in insts)

with open('/var/www/html/user-sites/user_12001/fib.bin', 'wb') as f:
    f.write(data)

print(f"Written {len(data)} bytes ({len(insts)} instructions)")
for i, inst in enumerate(insts):
    print(f"  {i*4:3d}: 0x{inst:08x}")
