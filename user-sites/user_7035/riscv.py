#!/usr/bin/env python3
"""RISC-V RV32I emulator in Python - for verification testing
Lev Osin, 2025"""

import struct
import sys
from enum import IntEnum

class Opcodes(IntEnum):
    LUI = 0x37
    AUIPC = 0x17
    JAL = 0x6f
    JALR = 0x67
    BRANCH = 0x63
    LOAD = 0x03
    STORE = 0x23
    OP_IMM = 0x13
    OP = 0x33
    SYSTEM = 0x73

class BranchFunct3(IntEnum):
    BEQ = 0
    BNE = 1
    BLT = 4
    BGE = 5
    BLTU = 6
    BGEU = 7

class LoadFunct3(IntEnum):
    LB = 0
    LH = 1
    LW = 2
    LBU = 4
    LHU = 5

class StoreFunct3(IntEnum):
    SB = 0
    SH = 1
    SW = 2

class ImmFunct3(IntEnum):
    ADDI = 0
    SLTI = 2
    SLTIU = 3
    XORI = 4
    ORI = 6
    ANDI = 7
    SLLI = 1
    SRLI_SRAI = 5

class OpFunct3(IntEnum):
    ADD_SUB = 0
    SLL = 1
    SLT = 2
    SLTU = 3
    XOR = 4
    SRL_SRA = 5
    OR = 6
    AND = 7


class RISCV:
    MEM_SIZE = 1 << 20  # 1MB
    
    def __init__(self):
        self.regs = [0] * 32
        self.pc = 0
        self.mem = bytearray(self.MEM_SIZE)
        self.running = False
        self.regs[2] = self.MEM_SIZE  # SP at top of memory
        self.cycles = 0
    
    def load_program(self, data, offset=0):
        for i, b in enumerate(data):
            if offset + i < self.MEM_SIZE:
                self.mem[offset + i] = b
    
    def fetch(self):
        if self.pc + 4 > self.MEM_SIZE:
            raise RuntimeError(f"Fetch out of bounds: PC=0x{self.pc:x}")
        inst = struct.unpack('<I', self.mem[self.pc:self.pc+4])[0]
        self.pc += 4
        self.cycles += 1
        return inst
    
    def read_mem32(self, addr):
        if addr + 4 > self.MEM_SIZE:
            raise RuntimeError(f"Read out of bounds: 0x{addr:x}")
        return struct.unpack('<I', self.mem[addr:addr+4])[0]
    
    def read_mem16(self, addr):
        if addr + 2 > self.MEM_SIZE:
            raise RuntimeError(f"Read out of bounds: 0x{addr:x}")
        val = self.mem[addr] | (self.mem[addr + 1] << 8)
        return val if val < 0x8000 else val - 0x10000  # Sign extend
    
    def read_mem8(self, addr):
        if addr >= self.MEM_SIZE:
            raise RuntimeError(f"Read out of bounds: 0x{addr:x}")
        val = self.mem[addr]
        return val if val < 0x80 else val - 0x100  # Sign extend
    
    def read_mem16u(self, addr):
        if addr + 2 > self.MEM_SIZE:
            raise RuntimeError(f"Read out of bounds: 0x{addr:x}")
        return self.mem[addr] | (self.mem[addr + 1] << 8)
    
    def read_mem8u(self, addr):
        if addr >= self.MEM_SIZE:
            raise RuntimeError(f"Read out of bounds: 0x{addr:x}")
        return self.mem[addr]
    
    def write_mem32(self, addr, val):
        if addr + 4 > self.MEM_SIZE:
            raise RuntimeError(f"Write out of bounds: 0x{addr:x}")
        self.mem[addr] = val & 0xff
        self.mem[addr + 1] = (val >> 8) & 0xff
        self.mem[addr + 2] = (val >> 16) & 0xff
        self.mem[addr + 3] = (val >> 24) & 0xff
    
    def write_mem16(self, addr, val):
        if addr + 2 > self.MEM_SIZE:
            raise RuntimeError(f"Write out of bounds: 0x{addr:x}")
        self.mem[addr] = val & 0xff
        self.mem[addr + 1] = (val >> 8) & 0xff
    
    def write_mem8(self, addr, val):
        if addr >= self.MEM_SIZE:
            raise RuntimeError(f"Write out of bounds: 0x{addr:x}")
        self.mem[addr] = val & 0xff
    
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
    
    def decode_u_imm(self, inst):
        return inst & 0xfffff000
    
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
        
        # x0 is hardwired to 0
        
        if opcode == Opcodes.OP_IMM:
            imm = self.decode_i_imm(inst)
            if funct3 == ImmFunct3.ADDI:
                self.regs[rd] = (self.regs[rs1] + imm) & 0xffffffff
            elif funct3 == ImmFunct3.SLTI:
                self.regs[rd] = 1 if (self.regs[rs1] - imm) > 0x7fffffff else 0
            elif funct3 == ImmFunct3.SLTIU:
                self.regs[rd] = 1 if (self.regs[rs1] & 0xffffffff) < (imm & 0xffffffff) else 0
            elif funct3 == ImmFunct3.XORI:
                self.regs[rd] = self.regs[rs1] ^ imm
            elif funct3 == ImmFunct3.ORI:
                self.regs[rd] = self.regs[rs1] | imm
            elif funct3 == ImmFunct3.ANDI:
                self.regs[rd] = self.regs[rs1] & imm
            elif funct3 == ImmFunct3.SLLI:
                shamt = imm & 0x1f
                self.regs[rd] = (self.regs[rs1] << shamt) & 0xffffffff
            elif funct3 == ImmFunct3.SRLI_SRAI:
                shamt = imm & 0x1f
                if (inst >> 30) & 1:  # SRAI
                    self.regs[rd] = self.regs[rs1] >> shamt if (self.regs[rs1] >> 31) == 0 else (0xffffffff00000000 | (self.regs[rs1] >> shamt))
                    self.regs[rd] &= 0xffffffff
                else:  # SRLI
                    self.regs[rd] = (self.regs[rs1] & 0xffffffff) >> shamt
        
        elif opcode == Opcodes.LUI:
            self.regs[rd] = self.decode_u_imm(inst)
        
        elif opcode == Opcodes.AUIPC:
            self.regs[rd] = ((self.pc - 4) + self.decode_u_imm(inst)) & 0xffffffff
        
        elif opcode == Opcodes.OP:
            if funct3 == OpFunct3.ADD_SUB:
                if (inst >> 30) & 1:  # SUB
                    self.regs[rd] = (self.regs[rs1] - self.regs[rs2]) & 0xffffffff
                else:  # ADD
                    self.regs[rd] = (self.regs[rs1] + self.regs[rs2]) & 0xffffffff
            elif funct3 == OpFunct3.SLL:
                shamt = self.regs[rs2] & 0x1f
                self.regs[rd] = (self.regs[rs1] << shamt) & 0xffffffff
            elif funct3 == OpFunct3.SLT:
                self.regs[rd] = 1 if (self.regs[rs1] - self.regs[rs2]) > 0x7fffffff else 0
            elif funct3 == OpFunct3.SLTU:
                self.regs[rd] = 1 if (self.regs[rs1] & 0xffffffff) < (self.regs[rs2] & 0xffffffff) else 0
            elif funct3 == OpFunct3.XOR:
                self.regs[rd] = self.regs[rs1] ^ self.regs[rs2]
            elif funct3 == OpFunct3.SRL_SRA:
                shamt = self.regs[rs2] & 0x1f
                if (inst >> 30) & 1:  # SRA
                    self.regs[rd] = self.regs[rs1] >> shamt if (self.regs[rs1] >> 31) == 0 else (0xffffffff00000000 | (self.regs[rs1] >> shamt))
                    self.regs[rd] &= 0xffffffff
                else:  # SRL
                    self.regs[rd] = (self.regs[rs1] & 0xffffffff) >> shamt
            elif funct3 == OpFunct3.OR:
                self.regs[rd] = self.regs[rs1] | self.regs[rs2]
            elif funct3 == OpFunct3.AND:
                self.regs[rd] = self.regs[rs1] & self.regs[rs2]
        
        elif opcode == Opcodes.JAL:
            imm = self.decode_j_imm(inst)
            self.regs[rd] = self.pc
            self.pc = ((self.pc - 4) + imm) & 0xffffffff
        
        elif opcode == Opcodes.JALR:
            imm = self.decode_i_imm(inst)
            tmp = self.pc
            self.pc = (self.regs[rs1] + imm) & ~1
            self.regs[rd] = tmp
        
        elif opcode == Opcodes.BRANCH:
            imm = self.decode_b_imm(inst)
            take = False
            if funct3 == BranchFunct3.BEQ:
                take = self.regs[rs1] == self.regs[rs2]
            elif funct3 == BranchFunct3.BNE:
                take = self.regs[rs1] != self.regs[rs2]
            elif funct3 == BranchFunct3.BLT:
                take = (self.regs[rs1] - self.regs[rs2]) > 0x7fffffff
            elif funct3 == BranchFunct3.BGE:
                take = not ((self.regs[rs1] - self.regs[rs2]) > 0x7fffffff)
            elif funct3 == BranchFunct3.BLTU:
                take = (self.regs[rs1] & 0xffffffff) < (self.regs[rs2] & 0xffffffff)
            elif funct3 == BranchFunct3.BGEU:
                take = (self.regs[rs1] & 0xffffffff) >= (self.regs[rs2] & 0xffffffff)
            if take:
                self.pc = ((self.pc - 4) + imm) & 0xffffffff
        
        elif opcode == Opcodes.LOAD:
            addr = (self.regs[rs1] + self.decode_i_imm(inst)) & 0xffffffff
            if funct3 == LoadFunct3.LB:
                self.regs[rd] = self.read_mem8(addr) & 0xffffffff
            elif funct3 == LoadFunct3.LH:
                self.regs[rd] = self.read_mem16(addr) & 0xffffffff
            elif funct3 == LoadFunct3.LW:
                self.regs[rd] = self.read_mem32(addr)
            elif funct3 == LoadFunct3.LBU:
                self.regs[rd] = self.read_mem8u(addr)
            elif funct3 == LoadFunct3.LHU:
                self.regs[rd] = self.read_mem16u(addr)
        
        elif opcode == Opcodes.STORE:
            addr = (self.regs[rs1] + self.decode_s_imm(inst)) & 0xffffffff
            if funct3 == StoreFunct3.SB:
                self.write_mem8(addr, self.regs[rs2])
            elif funct3 == StoreFunct3.SH:
                self.write_mem16(addr, self.regs[rs2])
            elif funct3 == StoreFunct3.SW:
                self.write_mem32(addr, self.regs[rs2])
        
        elif opcode == Opcodes.SYSTEM:
            if inst == 0x00000073:  # ECALL
                if self.regs[17] == 93:  # exit syscall
                    print(f"Exit code: {self.regs[10]}")
                    self.running = False
                elif self.regs[17] == 64:  # write syscall
                    fd = self.regs[10]
                    buf = self.regs[11]
                    count = self.regs[12]
                    if fd == 1:  # stdout
                        data = bytes(self.mem[buf:buf+count])
                        sys.stdout.buffer.write(data)
                    self.regs[10] = count  # return bytes written
            elif inst == 0x00100073:  # EBREAK
                print(f"EBREAK at PC=0x{self.pc-4:x}")
                self.running = False
        
        else:
            print(f"Unknown opcode: 0x{opcode:02x} at PC=0x{self.pc-4:x}")
            self.running = False
        
        self.regs[0] = 0  # x0 always 0
    
    def run(self, max_cycles=10000000):
        self.running = True
        try:
            while self.running and self.cycles < max_cycles:
                inst = self.fetch()
                self.execute(inst)
        except Exception as e:
            print(f"Exception: {e}")
            print(f"PC: 0x{self.pc:x}, Cycles: {self.cycles}")
            raise


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <program.bin>", file=sys.stderr)
        sys.exit(1)
    
    with open(sys.argv[1], 'rb') as f:
        program = f.read()
    
    cpu = RISCV()
    cpu.load_program(program)
    print(f"Loaded {len(program)} bytes")
    
    cpu.run()
    print(f"Cycles: {cpu.cycles}")


if __name__ == '__main__':
    main()
