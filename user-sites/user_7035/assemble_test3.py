#!/usr/bin/env python3
"""Fixed RISC-V assembler - correct loop jump"""
import struct

def encode_i(opcode, rd, funct3, rs1, imm):
    return (imm & 0xfff) << 20 | (rs1 & 0x1f) << 15 | (funct3 & 7) << 12 | (rd & 0x1f) << 7 | (opcode & 0x7f)

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

def encode_add(rd, rs1, rs2):
    return (0 << 25) | (rs2 << 20) | (rs1 << 15) | (0 << 12) | (rd << 7) | 0x33

# Program:
# 0x00: addi x1, x0, 10    # n = 10
# 0x04: addi x2, x0, 0     # sum = 0  
# 0x08: addi x3, x0, 1     # i = 1
# 0x0c: bge x3, x1, done   # if i >= n, exit (offset to 0x1c = 16)
# 0x10: add x2, x2, x3     # sum += i
# 0x14: addi x3, x3, 1     # i++
# 0x18: jal x0, loop       # back to 0x0c (offset = 0x0c - 0x18 = -12)
# 0x1c: addi x10, x0, 55   # expected sum
# 0x20: ecall

prog = []
prog.append(encode_i(0x13, 1, 0, 0, 10))    # 0x00: addi x1, x0, 10
prog.append(encode_i(0x13, 2, 0, 0, 0))      # 0x04: addi x2, x0, 0
prog.append(encode_i(0x13, 3, 0, 0, 1))      # 0x08: addi x3, x0, 1
prog.append(encode_b(0x63, 5, 3, 1, 16))      # 0x0c: bge x3, x1, 16 -> to 0x1c
prog.append(encode_add(2, 2, 3))             # 0x10: add x2, x2, x3
prog.append(encode_i(0x13, 3, 0, 3, 1))      # 0x14: addi x3, x3, 1

# JAL at 0x18: PC after fetch = 0x1c, PC-4 = 0x18
# Target 0x0c, offset = 0x0c - 0x18 = -12
prog.append(encode_j(0x6f, 0, -12))           # 0x18: jal x0, -12

prog.append(encode_i(0x13, 10, 0, 0, 55))    # 0x1c: addi x10, x0, 55
prog.append(encode_ecall())                   # 0x20: ecall

# Dump
for i, inst in enumerate(prog):
    print(f"{i*4:04x}: 0x{inst:08x}")

# Verify jump offset calculation
jal_pc = 0x18  # PC during fetch
after_fetch = jal_pc + 4  # 0x1c
offset = -12
new_pc = jal_pc + offset  # = 0xc
print(f"\nJAL at 0x{jal_pc:x}: offset={offset}, new_pc=0x{new_pc:x} (target 0x0c)")

# Write binary
with open('test3.bin', 'wb') as f:
    for inst in prog:
        f.write(struct.pack('<I', inst))
print(f"Wrote {len(prog)*4} bytes to test3.bin")
