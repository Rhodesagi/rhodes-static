#!/usr/bin/env python3
"""RISC-V with trace"""
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
    
    def run(self, max_cycles=50):
        for cycle in range(max_cycles):
            inst = self.fetch()
            opcode = inst & 0x7f
            rd = (inst >> 7) & 0x1f
            rs1 = (inst >> 15) & 0x1f
            rs2 = (inst >> 20) & 0x1f
            funct3 = (inst >> 12) & 0x7
            
            print(f"C{cycle:02d} PC=0x{self.pc-4:04x} op=0x{opcode:02x} x1={self.regs[1]} x2={self.regs[2]} x3={self.regs[3]}", end='')
            
            if opcode == 0x13:  # OP-IMM
                imm = (inst >> 20) if (inst >> 31) == 0 else ((inst >> 20) - 0x1000)
                if funct3 == 0:
                    self.regs[rd] = (self.regs[rs1] + imm) & 0xffffffff
                    print(f" ADDI x{rd}={self.regs[rd]}")
            elif opcode == 0x33:  # OP
                if funct3 == 0:
                    if (inst >> 30) & 1:
                        self.regs[rd] = (self.regs[rs1] - self.regs[rs2]) & 0xffffffff
                        print(f" SUB")
                    else:
                        old = self.regs[rd]
                        self.regs[rd] = (self.regs[rs1] + self.regs[rs2]) & 0xffffffff
                        print(f" ADD x{rd}:{old}+{self.regs[rs2]}={self.regs[rd]}")
            elif opcode == 0x6f:  # JAL
                imm = self.decode_j_imm(inst)
                self.regs[rd] = self.pc
                self.pc = (self.pc - 4 + imm) & 0xffffffff
                print(f" JAL ->PC=0x{self.pc:04x}")
            elif opcode == 0x63:  # BRANCH
                imm = self.decode_b_imm(inst)
                v1 = self.regs[rs1] & 0xffffffff
                v2 = self.regs[rs2] & 0xffffffff
                diff = (v1 - v2) & 0xffffffff
                take = False
                if funct3 == 5:
                    take = not (diff > 0x7fffffff)
                    print(f" BGE x{rs1}={v1} x{rs2}={v2} {'Y' if take else 'N'}", end='')
                if take:
                    self.pc = (self.pc - 4 + imm) & 0xffffffff
                    print(f"->0x{self.pc:04x}")
                else:
                    print()
            elif opcode == 0x73:
                if inst == 0x00000073:
                    print(f" ECALL x10={self.regs[10]} x17={self.regs[17]}")
                    if self.regs[17] == 93:
                        return self.regs[10]
            else:
                print(f" Unknown")
                return None
            self.regs[0] = 0

with open(sys.argv[1], 'rb') as f:
    prog = f.read()
cpu = RISCV()
cpu.load_program(prog)
print(f"Loaded {len(prog)} bytes")
result = cpu.run()
print(f"Result: {result}")
