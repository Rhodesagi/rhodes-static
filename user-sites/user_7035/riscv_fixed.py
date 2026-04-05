#!/usr/bin/env python3
"""RISC-V RV32I emulator - fixed 32-bit arithmetic"""
import struct
import sys

class RISCV:
    MEM_SIZE = 1 << 20
    
    def __init__(self):
        self.regs = [0] * 32
        self.pc = 0
        self.mem = bytearray(self.MEM_SIZE)
        self.regs[2] = self.MEM_SIZE
    
    def load_program(self, data, offset=0):
        for i, b in enumerate(data):
            if offset + i < self.MEM_SIZE:
                self.mem[offset + i] = b
    
    def fetch(self):
        inst = struct.unpack('<I', self.mem[self.pc:self.pc+4])[0]
        self.pc += 4
        return inst
    
    def decode_b_imm(self, inst):
        imm = (((inst >> 31) & 1) << 12 |
               ((inst >> 7) & 1) << 11 |
               ((inst >> 25) & 0x3f) << 5 |
               ((inst >> 8) & 0xf) << 1)
        return imm if imm < 0x1000 else (imm - 0x2000)
    
    def decode_j_imm(self, inst):
        imm = (((inst >> 31) & 1) << 20 |
               ((inst >> 21) & 0x3ff) << 1 |
               ((inst >> 20) & 1) << 11 |
               ((inst >> 12) & 0xff) << 12)
        return imm if imm < 0x100000 else (imm - 0x200000)
    
    def run(self, max_cycles=10000):
        for cycle in range(max_cycles):
            inst = self.fetch()
            opcode = inst & 0x7f
            rd = (inst >> 7) & 0x1f
            rs1 = (inst >> 15) & 0x1f
            rs2 = (inst >> 20) & 0x1f
            funct3 = (inst >> 12) & 0x7
            
            if opcode == 0x13:  # OP-IMM
                imm = (inst >> 20) if (inst >> 31) == 0 else ((inst >> 20) - 0x1000)
                if funct3 == 0:  # ADDI
                    self.regs[rd] = (self.regs[rs1] + imm) & 0xffffffff
            elif opcode == 0x33:  # OP
                if funct3 == 0:
                    if (inst >> 30) & 1:  # SUB
                        self.regs[rd] = (self.regs[rs1] - self.regs[rs2]) & 0xffffffff
                    else:  # ADD
                        self.regs[rd] = (self.regs[rs1] + self.regs[rs2]) & 0xffffffff
            elif opcode == 0x6f:  # JAL
                imm = self.decode_j_imm(inst)
                self.regs[rd] = self.pc
                self.pc = (self.pc - 4 + imm) & 0xffffffff
            elif opcode == 0x63:  # BRANCH
                imm = self.decode_b_imm(inst)
                take = False
                # FIX: Mask to 32-bit unsigned for comparison
                v1 = self.regs[rs1] & 0xffffffff
                v2 = self.regs[rs2] & 0xffffffff
                diff = (v1 - v2) & 0xffffffff
                if funct3 == 5:  # BGE - signed >=
                    take = not (diff > 0x7fffffff)
                elif funct3 == 4:  # BLT - signed <
                    take = diff > 0x7fffffff
                elif funct3 == 6:  # BLTU - unsigned <
                    take = v1 < v2
                elif funct3 == 7:  # BGEU - unsigned >=
                    take = v1 >= v2
                elif funct3 == 0:  # BEQ
                    take = v1 == v2
                elif funct3 == 1:  # BNE
                    take = v1 != v2
                if take:
                    self.pc = (self.pc - 4 + imm) & 0xffffffff
            elif opcode == 0x73:  # SYSTEM
                if inst == 0x00000073:  # ECALL
                    if self.regs[17] == 93:  # exit
                        return self.regs[10]
            else:
                print(f"Unknown opcode 0x{opcode:02x} at PC=0x{self.pc-4:x}")
                return None
            self.regs[0] = 0

with open(sys.argv[1], 'rb') as f:
    prog = f.read()
cpu = RISCV()
cpu.load_program(prog)
print(f"Loaded {len(prog)} bytes")
result = cpu.run()
print(f"Exit code: {result}")
