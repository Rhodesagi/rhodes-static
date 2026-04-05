#!/usr/bin/env python3
"""Simple RISC-V assembler for test program"""
import struct

def encode_i(opcode, rd, funct3, rs1, imm):
    return (imm & 0xfff) << 20 | (rs1 & 0x1f) << 15 | (funct3 & 7) << 12 | (rd & 0x1f) << 7 | (opcode & 0x7f)

def encode_u(opcode, rd, imm):
    return (imm & 0xfffff000) | (rd & 0x1f) << 7 | (opcode & 0x7f)

def encode_j(opcode, rd, imm):
    imm = imm & 0xfffff  # 21-bit signed
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
# x1 = 10, x2 = 0, x3 = 1
# loop: if x3 > x1, goto done
# x2 += x3
# x3++
# goto loop
# done: exit with x2

# x1 = 10
# ADDI x1, x0, 10
prog = [
    encode_i(0x13, 1, 0, 0, 10),    # addi x1, x0, 10
    encode_i(0x13, 2, 0, 0, 0),     # addi x2, x0, 0
    encode_i(0x13, 3, 0, 0, 1),     # addi x3, x0, 1
]

# loop starts at offset 12 (3 instructions * 4 bytes)
loop_offset = 12
# done is at offset 28 (7 instructions)
done_offset = 28

# bgt x3, x1, done -> blt x1, x3, done (offset 12)
# Branch from PC=12 to PC=28, offset = 28 - 12 = 16
prog.append(encode_b(0x63, 4, 1, 3, 16))  # blt x1, x3, 16

# add x2, x2, x3 (add is OP: 0x33, funct3=0, funct7=0)
prog.append(0x003101b3)  # add x3, x2, x3 -> actually need add x2, x2, x3

# Let me recalculate:
# add: opcode=0x33, funct3=0, funct7=0
# add x2, x2, x3: rd=2, rs1=2, rs2=3
add_inst = 0 | (0 << 25) | (3 << 20) | (2 << 15) | (0 << 12) | (2 << 7) | 0x33
prog[-1] = add_inst

# addi x3, x3, 1
prog.append(encode_i(0x13, 3, 0, 3, 1))

# j loop: jal x0, -16 (offset from PC=24 to PC=12)
# jal encoding: imm[20|10:1|11|19:12]
jump_offset = 12 - 24  # = -12 (from PC after instruction = 28, to 12 = -16)
# Actually PC relative: at PC=24, after instruction PC=28, want to go to 12, offset = -16
j_imm = -16 & 0x1fffff  # 21-bit signed
# j_imm = 0x1fff0 (if -16 in 21-bit: 0x1fff0)
jal_inst = ((j_imm & 0x100000) >> 20) << 31 | \
           ((j_imm & 0x7fe) >> 1) << 21 | \
           ((j_imm & 0x800) >> 11) << 20 | \
           ((j_imm & 0xff000) >> 12) << 12 | \
           (0 << 7) | 0x6f
prog.append(jal_inst)

# done: addi x10, x0, 55 (expected sum)
prog.append(encode_i(0x13, 10, 0, 0, 55))

# ecall
prog.append(encode_ecall())

# Dump program
for i, inst in enumerate(prog):
    print(f"{i*4:04x}: 0x{inst:08x}")

# Write binary
with open('test.bin', 'wb') as f:
    for inst in prog:
        f.write(struct.pack('<I', inst))

print(f"\nWrote {len(prog)*4} bytes to test.bin")
