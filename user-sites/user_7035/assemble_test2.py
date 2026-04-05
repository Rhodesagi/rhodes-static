#!/usr/bin/env python3
"""Fixed RISC-V assembler - correct jump target"""
import struct

def encode_i(opcode, rd, funct3, rs1, imm):
    return (imm & 0xfff) << 20 | (rs1 & 0x1f) << 15 | (funct3 & 7) << 12 | (rd & 0x1f) << 7 | (opcode & 0x7f)

def encode_u(opcode, rd, imm):
    return (imm & 0xfffff000) | (rd & 0x1f) << 7 | (opcode & 0x7f)

def encode_j(opcode, rd, imm):
    imm = imm & 0x1fffff  # 21-bit signed
    enc = ((imm & 0x100000) >> 20) << 31 | \
          ((imm & 0x7fe) >> 1) << 21 | \
          ((imm & 0x800) >> 11) << 20 | \
          ((imm & 0xff000) >> 12) << 12
    return enc | (rd & 0x1f) << 7 | (opcode & 0x7f)

def encode_b(opcode, funct3, rs1, rs2, imm):
    imm = imm & 0x1fff  # 13-bit signed
    enc = ((imm & 0x1000) >> 12) << 31 | \
          ((imm & 0x7e0) >> 5) << 25 | \
          ((imm & 0x1e) >> 1) << 8 | \
          ((imm & 0x800) >> 11) << 7
    return enc | (rs2 & 0x1f) << 20 | (rs1 & 0x1f) << 15 | (funct3 & 7) << 12 | (opcode & 0x7f)

def encode_ecall():
    return 0x00000073

# Program:
# 0x00: addi x1, x0, 10    # n = 10
# 0x04: addi x2, x0, 0     # sum = 0  
# 0x08: addi x3, x0, 1     # i = 1
# 0x0c: blt x3, x1, skip   # if i < n, continue (skip done)
# 0x10: j done             # else exit
# 0x14: add x2, x2, x3     # sum += i
# 0x18: addi x3, x3, 1     # i++
# 0x1c: j loop             # back to branch
# 0x20: addi x10, x0, 55   # expected sum
# 0x24: ecall

# Actually simpler - use BGE for the exit condition:
# blt x1, x3, done  # if n < i (i > n), done
# Or use: bge x3, x1, done  # if i >= n, done

prog = []
# x1 = 10, x2 = 0, x3 = 1
prog.append(encode_i(0x13, 1, 0, 0, 10))    # addi x1, x0, 10 @ 0x00
prog.append(encode_i(0x13, 2, 0, 0, 0))      # addi x2, x0, 0 @ 0x04
prog.append(encode_i(0x13, 3, 0, 0, 1))      # addi x3, x0, 1 @ 0x08

# loop: at 0x0c
# bge x3, x1, done -> if x3 >= x1 (i >= n), exit
# PC of this instruction = 0x0c
# done target = 0x20
# offset = 0x20 - 0x0c = 0x14 = 20
prog.append(encode_b(0x63, 5, 3, 1, 20))     # bge x3, x1, 20 @ 0x0c

# add x2, x2, x3 @ 0x10
prog.append(0x00310133)

# addi x3, x3, 1 @ 0x14
prog.append(encode_i(0x13, 3, 0, 3, 1))

# j loop: jump back to 0x0c
# This instruction at 0x18
# After this instruction, PC = 0x1c
# Target = 0x0c
# Offset = 0x0c - 0x1c = -16
prog.append(encode_j(0x6f, 0, -16))

# done: at 0x1c + 4 = 0x20... wait, need to recalculate
# Current: 0x00, 0x04, 0x08, 0x0c, 0x10, 0x14, 0x18
# That's 7 instructions = 28 bytes = 0x1c
# So done is at 0x1c, not 0x20

# Actually let me recalculate offsets
# Instructions are at:
# 0: 0x00
# 1: 0x04  
# 2: 0x08
# 3: 0x0c (loop start, branch)
# 4: 0x10 (add)
# 5: 0x14 (addi)
# 6: 0x18 (jal back)
# 7: 0x1c (done: addi x10)
# 8: 0x20 (ecall)

# So done is at 0x1c
# Branch from 0x0c to 0x1c: offset = 0x1c - 0x0c = 16 = 0x10
prog[3] = encode_b(0x63, 5, 3, 1, 16)  # bge x3, x1, 16

# done code at 0x1c
prog.append(encode_i(0x13, 10, 0, 0, 55))  # addi x10, x0, 55

# ecall at 0x20
prog.append(encode_ecall())

# Dump program
for i, inst in enumerate(prog):
    print(f"{i*4:04x}: 0x{inst:08x}")

# Write binary
with open('test2.bin', 'wb') as f:
    for inst in prog:
        f.write(struct.pack('<I', inst))

print(f"\nWrote {len(prog)*4} bytes to test2.bin")
