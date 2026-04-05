#!/usr/bin/env python3
"""RISC-V with full trace"""
import struct
import sys

class RISCV:
    MEM_SIZE = 1 << 20
    
    def __init__(self):
        self.regs = [0] * 32
        self.pc = 0
        self.mem = bytearray(self.MEM_SIZE)
        self.regs[2] = self.MEM_SIZE
        self.cycles = 0
        self.seen_pcs = set()
    
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
    
    def run(self, max_cycles=100):
        for _ in range(max_cycles):
            pc_before = self.pc
            if pc_before not in self.seen_pcs:
                self.seen_pcs.add(pc_before)
                inst = struct.unpack('<I', self.mem[self.pc:self.pc+4])[0]
                x1, x2, x3 = self.regs[1], self.regs[2], self.regs[3]
                print(f"PC=0x{pc_before:04x}: inst=0x{inst:08x} x1={x1} x2={x2} x3={x3}")
            
            inst = self.fetch()
            opcode = inst & 0x7f
            
            if opcode == 0x13:  # OP-IMM
                rd = (inst >> 7) & 0x1f
                rs1 = (inst >> 15) & 0x1f
                imm = (inst >> 20) if (inst >> 31) == 0 else ((inst >> 20) - 0x1000)
                self.regs[rd] = (self.regs[rs1] + imm) & 0xffffffff
                self.regs[0] = 0
            
            elif opcode == 0x33:  # OP
                rd = (inst >> 7) & 0x1f
                rs1 = (inst >> 15) & 0x1f
                rs2 = (inst >> 20) & 0x1f
                if (inst >> 30) & 1:
                    self.regs[rd] = (self.regs[rs1] - self.regs[rs2]) & 0xffffffff
                else:
                    self.regs[rd] = (self.regs[rs1] + self.regs[rs2]) & 0xffffffff
                self.regs[0] = 0
            
            elif opcode == 0x6f:  # JAL
                imm = self.decode_j_imm(inst)
                rd = (inst >> 7) & 0x1f
                self.regs[rd] = self.pc
                new_pc = (self.pc - 4 + imm) & 0xffffffff
                print(f"  JAL: imm={imm} -> PC=0x{new_pc:04x}")
                self.pc = new_pc
                self.regs[0] = 0
            
            elif opcode == 0x63:  # BRANCH
                rs1 = (inst >> 15) & 0x1f
                rs2 = (inst >> 20) & 0x1f
                imm = self.decode_b_imm(inst)
                funct3 = (inst >> 12) & 0x7
                take = False
                if funct3 == 5:  # BGE
                    take = not ((self.regs[rs1] - self.regs[rs2]) > 0x7fffffff)
                if take:
                    new_pc = (self.pc - 4 + imm) & 0xffffffff
                    print(f"  BGE taken: imm={imm} -> PC=0x{new_pc:04x}")
                    self.pc = new_pc
            
            elif opcode == 0x73:  # SYSTEM
                if inst == 0x00000073:
                    print(f"ECALL: x10={self.regs[10]} x17={self.regs[17]}")
                    if self.regs[17] == 93:
                        print(f"Exit with code {self.regs[10]}")
                        return
            
            else:
                print(f"Unknown opcode 0x{opcode:02x} at PC=0x{self.pc-4:x}")
                return
            
            self.cycles += 1

with open('test3.bin', 'rb') as f:
    prog = f.read()
cpu = RISCV()
cpu.load_program(prog)
cpu.run()
print(f"Cycles: {cpu.cycles}")
