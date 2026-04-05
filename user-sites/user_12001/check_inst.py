#!/usr/bin/env python3
import struct

# Check instruction decoding
def decode_i(inst):
    opcode = inst & 0x7f
    rd = (inst >> 7) & 0x1f
    funct3 = (inst >> 12) & 0x7
    rs1 = (inst >> 15) & 0x1f
    imm = (inst >> 20) & 0xfff
    return opcode, rd, funct3, rs1, imm

insts = [
    0x00a00513,  # addi a0, x0, 10
    0x00000593,  # addi a1, x0, 0
    0x00100613,  # addi a2, x0, 1
    0x00000693,  # addi a3, x0, 0
    0x00a68463,  # beq a3, a0, 40
    0x00c70733,  # add a4, a1, a2
    0x00060693,  # addi a3, a2, 0 (WRONG! should be addi a1, a2, 0)
    # addi rd, rs1, imm: imm[11:0] rs1 funct3 rd opcode
    # addi x11, x12, 0: 000000000000 01100 000 01011 0010011 = 0x00060693
    # That's what I have. Let me check: rs1 = 01100 = 12 (x12), rd = 01011 = 11 (a1/x11)
    # So this should be correct...
    0x00070733,  # addi x12, x14, 0 (WRONG! should be addi a2, a4, 0)
    0x00168693,  # addi a3, a3, 1
    0xff1ff06f,  # jal x0, -20
    0x00050513,  # addi a0, a1, 0
    0x00000073,  # ecall
]

for i, inst in enumerate(insts):
    opcode, rd, funct3, rs1, imm = decode_i(inst)
    print(f"Inst {i}: 0x{inst:08x}")
    print(f"  opcode={opcode:07b}, rd={rd}, funct3={funct3}, rs1={rs1}, imm={imm}")
    if opcode == 0b0010011:
        print(f"  addi x{rd}, x{rs1}, {imm}")
