#!/usr/bin/env python3
"""RISC-V RV32I emulator with tracing"""
import struct
import sys

class RISCV:
    MEM_SIZE = 1 << 20
    
    def __init__(self, trace=False):
        self.regs = [0] * 32
        self.pc = 0
        self.mem = bytearray(self.MEM_SIZE)
        self.running = False
        self.regs[2] = self.MEM_SIZE
        self.cycles = 0
        self.trace = trace
        self.breakpoints = set()
    
    def load_program(self, data, offset=0):
        for i, b in enumerate(data):
            if offset + i < self.MEM_SIZE:
                self.mem[offset + i] = b
    
    def reg_name(self, n):
        names = ['zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2', 's0', 's1',
                 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7',
                 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11',
                 't3', 't4', 't5', 't6']
        return names[n] if n < len(names) else f'x{n}'
    
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
        # B-type: imm[12|10:5|4:1|11] at bits[31|30:25|11:8|7]
        imm = (((inst >> 31) & 1) << 12 |
               ((inst >> 7) & 1) << 11 |
               ((inst >> 25) & 0x3f) << 5 |
               ((inst >> 8) & 0xf) << 1)
        # Sign extend 13-bit
        return imm if imm < 0x1000 else (imm - 0x2000)
    
    def decode_j_imm(self, inst):
        # J-type: imm[20|10:1|11|19:12]
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
        
        if self.trace and self.pc-4 not in self.breakpoints:
            print(f"PC=0x{self.pc-4:08x}  x1={self.regs[1]:08x}  x2={self.regs[2]:08x}  x3={self.regs[3]:08x}  opcode=0x{opcode:02x}")
            self.breakpoints.add(self.pc-4)
        
        if opcode == 0x13:  # OP-IMM
            imm = self.decode_i_imm(inst)
            if funct3 == 0:  # ADDI
                self.regs[rd] = (self.regs[rs1] + imm) & 0xffffffff
            elif funct3 == 2:  # SLTI
                self.regs[rd] = 1 if (self.regs[rs1] < imm) else 0
        
        elif opcode == 0x33:  # OP
            if funct3 == 0:  # ADD/SUB
                if (inst >> 30) & 1:
                    self.regs[rd] = (self.regs[rs1] - self.regs[rs2]) & 0xffffffff
                else:
                    self.regs[rd] = (self.regs[rs1] + self.regs[rs2]) & 0xffffffff
        
        elif opcode == 0x6f:  # JAL
            imm = self.decode_j_imm(inst)
            self.regs[rd] = self.pc
            new_pc = ((self.pc - 4) + imm) & 0xffffffff
            if self.trace:
                print(f"  JAL imm={imm}, new_pc=0x{new_pc:x}")
            self.pc = new_pc
        
        elif opcode == 0x63:  # BRANCH
            imm = self.decode_b_imm(inst)
            take = False
            if funct3 == 0:  # BEQ
                take = self.regs[rs1] == self.regs[rs2]
            elif funct3 == 1:  # BNE
                take = self.regs[rs1] != self.regs[rs2]
            elif funct3 == 4:  # BLT
                take = (self.regs[rs1] - self.regs[rs2]) > 0x7fffffff
            elif funct3 == 5:  # BGE
                take = not ((self.regs[rs1] - self.regs[rs2]) > 0x7fffffff)
            elif funct3 == 6:  # BLTU
                take = (self.regs[rs1] & 0xffffffff) < (self.regs[rs2] & 0xffffffff)
            elif funct3 == 7:  # BGEU
                take = (self.regs[rs1] & 0xffffffff) >= (self.regs[rs2] & 0xffffffff)
            
            if take:
                new_pc = ((self.pc - 4) + imm) & 0xffffffff
                if self.trace:
                    print(f"  BRANCH taken imm={imm}, new_pc=0x{new_pc:x}")
                self.pc = new_pc
        
        elif opcode == 0x73:  # SYSTEM
            if inst == 0x00000073:  # ECALL
                if self.regs[17] == 93:
                    print(f"Exit code: {self.regs[10]}")
                    self.running = False
        
        self.regs[0] = 0
    
    def run(self, max_cycles=100):
        self.running = True
        while self.running and self.cycles < max_cycles:
            inst = self.fetch()
            self.execute(inst)


def main():
    with open('test.bin', 'rb') as f:
        program = f.read()
    
    cpu = RISCV(trace=True)
    cpu.load_program(program)
    cpu.run(max_cycles=20)
    print(f"\nFinal: x1={cpu.regs[1]}, x2={cpu.regs[2]}, x3={cpu.regs[3]}")


if __name__ == '__main__':
    main()
