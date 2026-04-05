#!/usr/bin/env python3
"""Minimal RISC-V emulator for testing"""
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
        self.cycles += 1
        return inst
    
    def decode_i_imm(self, inst):
        return (inst >> 20) if (inst >> 31) == 0 else ((inst >> 20) - 0x1000)
    
    def decode_s_imm(self, inst):
        imm = ((inst >> 25) << 5) | ((inst >> 7) & 0x1f)
        return imm if (inst >> 31) == 0 else (imm - 0x1000)
    
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
    
    def execute(self, inst):
        opcode = inst & 0x7f
        rd = (inst >> 7) & 0x1f
        rs1 = (inst >> 15) & 0x1f
        rs2 = (inst >> 20) & 0x1f
        funct3 = (inst >> 12) & 0x7
        funct7 = (inst >> 25) & 0x7f
        
        if opcode == 0x13:  # OP-IMM
            imm = self.decode_i_imm(inst)
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
            self.pc = ((self.pc - 4) + imm) & 0xffffffff
        elif opcode == 0x63:  # BRANCH
            imm = self.decode_b_imm(inst)
            take = False
            if funct3 == 5:  # BGE
                take = not ((self.regs[rs1] - self.regs[rs2]) > 0x7fffffff)
            if take:
                self.pc = ((self.pc - 4) + imm) & 0xffffffff
        elif opcode == 0x73:  # SYSTEM
            if inst == 0x00000073:  # ECALL
                if self.regs[17] == 93:  # exit
                    print(f"Exit code: {self.regs[10]}")
                    return False
        else:
            print(f"Unknown: opcode=0x{opcode:02x} at PC=0x{self.pc-4:x}")
            return False
        self.regs[0] = 0
        return True
    
    def run(self, max_cycles=10000000):
        running = True
        while running and self.cycles < max_cycles:
            inst = self.fetch()
            running = self.execute(inst)

def main():
    with open(sys.argv[1], 'rb') as f:
        program = f.read()
    cpu = RISCV()
    cpu.load_program(program)
    print(f"Loaded {len(program)} bytes")
    cpu.run()
    print(f"Cycles: {cpu.cycles}")

if __name__ == '__main__':
    main()
