#!/usr/bin/env python3
"""RISC-V with execution trace"""
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
        for cycle in range(max_cycles):
            inst = self.fetch()
            opcode = inst & 0x7f
            rd = (inst >> 7) & 0x1f
            rs1 = (inst >> 15) & 0x1f
            rs2 = (inst >> 20) & 0x1f
            funct3 = (inst >> 12) & 0x7
            
            print(f"C{cycle:02d} PC=0x{self.pc-4:04x} inst=0x{inst:08x} x1={self.regs[1]} x3={self.regs[3]}", end='')
            
            if opcode == 0x13:  # OP-IMM
                imm = (inst >> 20) if (inst >> 31) == 0 else ((inst >> 20) - 0x1000)
                if funct3 == 0:  # ADDI
                    old_val = self.regs[rd]
                    self.regs[rd] = (self.regs[rs1] + imm) & 0xffffffff
                    print(f" ADDI: x{rd} = {old_val} -> {self.regs[rd]} (rs1=x{rs1}={self.regs[rs1]}, imm={imm})")
                else:
                    print(f" OP-IMM funct3={funct3}")
                    return
            elif opcode == 0x33:  # OP
                if funct3 == 0:
                    old_val = self.regs[rd]
                    if (inst >> 30) & 1:  # SUB
                        self.regs[rd] = (self.regs[rs1] - self.regs[rs2]) & 0xffffffff
                        print(f" SUB")
                    else:  # ADD
                        self.regs[rd] = (self.regs[rs1] + self.regs[rs2]) & 0xffffffff
                        print(f" ADD: x{rd} = {old_val} -> {self.regs[rd]}")
                else:
                    print(f" OP funct3={funct3}")
                    return
            elif opcode == 0x6f:  # JAL
                imm = self.decode_j_imm(inst)
                self.regs[rd] = self.pc
                new_pc = (self.pc - 4 + imm) & 0xffffffff
                print(f" JAL -> PC=0x{new_pc:04x}")
                self.pc = new_pc
            elif opcode == 0x63:  # BRANCH
                imm = self.decode_b_imm(inst)
                take = False
                if funct3 == 5:  # BGE
                    take = not ((self.regs[rs1] - self.regs[rs2]) > 0x7fffffff)
                    print(f" BGE x{rs1}={self.regs[rs1]} x{rs2}={self.regs[rs2]} {'TAKEN' if take else 'NOT'}", end='')
                if take:
                    new_pc = (self.pc - 4 + imm) & 0xffffffff
                    print(f" -> 0x{new_pc:04x}")
                    self.pc = new_pc
                else:
                    print()
            elif opcode == 0x73:  # SYSTEM
                if inst == 0x00000073:
                    print(f" ECALL x10={self.regs[10]} x17={self.regs[17]}")
                    if self.regs[17] == 93:
                        print(f"EXIT code={self.regs[10]}")
                        return
            else:
                print(f" Unknown opcode 0x{opcode:02x}")
                return
            
            self.regs[0] = 0

with open('test3.bin', 'rb') as f:
    prog = f.read()
cpu = RISCV()
cpu.load_program(prog)
print(f"Loaded {len(prog)} bytes")
cpu.run()
