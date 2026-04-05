#!/usr/bin/env python3
"""Fixed RISC-V test with correct branch offset"""
import struct

def encode_i(op, rd, f3, rs1, imm):
    return (imm & 0xfff) << 20 | (rs1 & 0x1f) << 15 | (f3 & 7) << 12 | (rd & 0x1f) << 7 | (op & 0x7f)

def encode_j(op, rd, imm):
    imm = imm & 0x1fffff
    enc = ((imm & 0x100000) >> 20) << 31 | ((imm & 0x7fe) >> 1) << 21 | ((imm & 0x800) >> 11) << 20 | ((imm & 0xff000) >> 12) << 12
    return enc | (rd & 0x1f) << 7 | (op & 0x7f)

def encode_b(op, f3, rs1, rs2, imm):
    imm = imm & 0x1fff
    enc = ((imm & 0x1000) >> 12) << 31 | ((imm & 0x7e0) >> 5) << 25 | ((imm & 0x1e) >> 1) << 8 | ((imm & 0x800) >> 11) << 7
    return enc | (rs2 & 0x1f) << 20 | (rs1 & 0x1f) << 15 | (f3 & 7) << 12 | (op & 0x7f)

def encode_r(op, rd, f3, rs1, rs2, f7):
    return (f7 & 0x7f) << 25 | (rs2 & 0x1f) << 20 | (rs1 & 0x1f) << 15 | (f3 & 7) << 12 | (rd & 0x1f) << 7 | (op & 0x7f)

def add(rd, rs1, rs2):
    return encode_r(0x33, rd, 0, rs1, rs2, 0)

# Layout:
# 0x00: addi x1, x0, 10   (n=10)
# 0x04: addi x2, x0, 0    (sum=0)
# 0x08: addi x3, x0, 1    (i=1)
# 0x0c: bge x3, x1, 16    -> 0x1c (done)
# 0x10: add x2, x2, x3    (sum += i)
# 0x14: addi x3, x3, 1    (i++)
# 0x18: jal x0, -12       -> 0x0c (loop)
# 0x1c: addi x10, x2, 0   (result = sum)
# 0x20: addi x17, x0, 93  (exit syscall)
# 0x24: ecall

prog = []
prog.append(encode_i(0x13, 1, 0, 0, 10))   # 0x00: x1=10
prog.append(encode_i(0x13, 2, 0, 0, 0))    # 0x04: x2=0
prog.append(encode_i(0x13, 3, 0, 0, 1))    # 0x08: x3=1
prog.append(encode_b(0x63, 5, 3, 1, 16))   # 0x0c: bge x3, x1, 16 (to 0x1c)
prog.append(add(2, 2, 3))                  # 0x10: add x2, x2, x3
prog.append(encode_i(0x13, 3, 0, 3, 1))    # 0x14: addi x3, x3, 1
prog.append(encode_j(0x6f, 0, -12))        # 0x18: j loop
prog.append(encode_i(0x13, 10, 0, 2, 0))   # 0x1c: addi x10, x2, 0
prog.append(encode_i(0x13, 17, 0, 0, 93))  # 0x20: li x17, 93
prog.append(0x00000073)                    # 0x24: ecall

for i, inst in enumerate(prog):
    print(f"{i*4:04x}: 0x{inst:08x}")

with open('test_final2.bin', 'wb') as f:
    for inst in prog:
        f.write(struct.pack('<I', inst))
print(f"Wrote {len(prog)*4} bytes")
