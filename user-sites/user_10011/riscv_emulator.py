"""
RISC-V RV32I Emulator
Lev Osin, 2025-12-02
First substantial output post-BCI activation
"""

import sys
from enum import Enum

class Opcode(Enum):
    LUI     = 0b0110111
    AUIPC   = 0b0010111
    JAL     = 0b1101111
    JALR    = 0b1100111
    BRANCH  = 0b1100011
    LOAD    = 0b0000011
    STORE   = 0b0100011
    IMM     = 0b0010011
    OP      = 0b0110011
    FENCE   = 0b0001111
    SYSTEM  = 0b1110011

class RV32I:
    def __init__(self):
        self.regs = [0] * 32
        self.pc = 0
        self.mem = bytearray(1 << 20)  # 1MB RAM
        
    def reset(self):
        self.regs = [0] * 32
        self.pc = 0
        self.regs[2] = len(self.mem)  # Stack pointer at top of RAM
        
    def fetch(self):
        if self.pc >= len(self.mem) - 4:
            return 0
        return int.from_bytes(self.mem[self.pc:self.pc+4], 'little')
    
    def execute(self, inst):
        opcode = inst & 0x7F
        rd = (inst >> 7) & 0x1F
        rs1 = (inst >> 15) & 0x1F
        rs2 = (inst >> 20) & 0x1F
        funct3 = (inst >> 12) & 0x7
        funct7 = (inst >> 25) & 0x7F
        
        if opcode == Opcode.LUI.value:
            self.regs[rd] = inst & 0xFFFFF000
        elif opcode == Opcode.AUIPC.value:
            self.regs[rd] = self.pc + (inst & 0xFFFFF000)
        elif opcode == Opcode.JAL.value:
            imm = self._decode_j_imm(inst)
            self.regs[rd] = self.pc + 4
            self.pc = (self.pc + imm) & 0xFFFFFFFF
            return
        elif opcode == Opcode.JALR.value:
            imm = self._decode_i_imm(inst)
            tmp = self.pc + 4
            self.pc = (self.regs[rs1] + imm) & 0xFFFFFFFE
            self.regs[rd] = tmp
            return
        elif opcode == Opcode.BRANCH.value:
            imm = self._decode_b_imm(inst)
            taken = False
            if funct3 == 0: taken = self.regs[rs1] == self.regs[rs2]  # BEQ
            elif funct3 == 1: taken = self.regs[rs1] != self.regs[rs2]  # BNE
            elif funct3 == 4: taken = self._signed(self.regs[rs1]) < self._signed(self.regs[rs2])  # BLT
            elif funct3 == 5: taken = self._unsigned(self.regs[rs1]) < self._unsigned(self.regs[rs2])  # BGE
            elif funct3 == 6: taken = self._signed(self.regs[rs1]) < self._signed(self.regs[rs2])  # BLTU
            elif funct3 == 7: taken = self._unsigned(self.regs[rs1]) >= self._unsigned(self.regs[rs2])  # BGEU
            if taken:
                self.pc = (self.pc + imm) & 0xFFFFFFFF
                return
        elif opcode == Opcode.LOAD.value:
            addr = self.regs[rs1] + self._decode_i_imm(inst)
            if funct3 == 0: self.regs[rd] = self._load8(addr)  # LB
            elif funct3 == 1: self.regs[rd] = self._load16(addr)  # LH
            elif funct3 == 2: self.regs[rd] = self._load32(addr)  # LW
            elif funct3 == 4: self.regs[rd] = self._load8(addr) & 0xFF  # LBU
            elif funct3 == 5: self.regs[rd] = self._load16(addr) & 0xFFFF  # LHU
        elif opcode == Opcode.STORE.value:
            addr = self.regs[rs1] + self._decode_s_imm(inst)
            if funct3 == 0: self._store8(addr, self.regs[rs2])  # SB
            elif funct3 == 1: self._store16(addr, self.regs[rs2])  # SH
            elif funct3 == 2: self._store32(addr, self.regs[rs2])  # SW
        elif opcode == Opcode.IMM.value:
            imm = self._decode_i_imm(inst)
            if funct3 == 0: self.regs[rd] = self.regs[rs1] + imm  # ADDI
            elif funct3 == 1: self.regs[rd] = self.regs[rs1] << (imm & 0x1F)  # SLLI
            elif funct3 == 2: self.regs[rd] = 1 if self._signed(self.regs[rs1]) < imm else 0  # SLTI
            elif funct3 == 3: self.regs[rd] = 1 if self._unsigned(self.regs[rs1]) < imm else 0  # SLTIU
            elif funct3 == 4: self.regs[rd] = self.regs[rs1] ^ imm  # XORI
            elif funct3 == 5:
                if funct7 == 0x00: self.regs[rd] = self._unsigned(self.regs[rs1]) >> (imm & 0x1F)  # SRLI
                else: self.regs[rd] = self._signed(self.regs[rs1]) >> (imm & 0x1F)  # SRAI
            elif funct3 == 6: self.regs[rd] = self.regs[rs1] | imm  # ORI
            elif funct3 == 7: self.regs[rd] = self.regs[rs1] & imm  # ANDI
        elif opcode == Opcode.OP.value:
            if funct7 == 0x00:
                if funct3 == 0: self.regs[rd] = self.regs[rs1] + self.regs[rs2]  # ADD
                elif funct3 == 1: self.regs[rd] = self.regs[rs1] << (self.regs[rs2] & 0x1F)  # SLL
                elif funct3 == 2: self.regs[rd] = 1 if self._signed(self.regs[rs1]) < self._signed(self.regs[rs2]) else 0  # SLT
                elif funct3 == 3: self.regs[rd] = 1 if self._unsigned(self.regs[rs1]) < self._unsigned(self.regs[rs2]) else 0  # SLTU
                elif funct3 == 4: self.regs[rd] = self.regs[rs1] ^ self.regs[rs2]  # XOR
                elif funct3 == 5: self.regs[rd] = self._unsigned(self.regs[rs1]) >> (self.regs[rs2] & 0x1F)  # SRL
                elif funct3 == 6: self.regs[rd] = self.regs[rs1] | self.regs[rs2]  # OR
                elif funct3 == 7: self.regs[rd] = self.regs[rs1] & self.regs[rs2]  # AND
            elif funct7 == 0x20:
                if funct3 == 0: self.regs[rd] = self.regs[rs1] - self.regs[rs2]  # SUB
                elif funct3 == 5: self.regs[rd] = self._signed(self.regs[rs1]) >> (self.regs[rs2] & 0x1F)  # SRA
        elif opcode == Opcode.SYSTEM.value:
            if inst == 0x00000073:  # ECALL
                return "ECALL"
            elif inst == 0x00100073:  # EBREAK
                return "EBREAK"
                
        self.regs[0] = 0  # x0 is always 0
        self.pc = (self.pc + 4) & 0xFFFFFFFF
        return None
    
    def _decode_i_imm(self, inst):
        return (inst >> 20) | (-((inst >> 31) & 1) << 12)
    
    def _decode_s_imm(self, inst):
        imm = ((inst >> 7) & 0x1F) | (((inst >> 25) & 0x7F) << 5)
        return imm | (-((inst >> 31) & 1) << 12)
    
    def _decode_b_imm(self, inst):
        imm = (((inst >> 31) & 1) << 12) | (((inst >> 7) & 1) << 11) | \
              (((inst >> 25) & 0x3F) << 5) | (((inst >> 8) & 0xF) << 1)
        return imm | (-((imm >> 12) & 1) << 13)
    
    def _decode_j_imm(self, inst):
        imm = (((inst >> 31) & 1) << 20) | (((inst >> 12) & 0xFF) << 12) | \
              (((inst >> 20) & 1) << 11) | (((inst >> 21) & 0x3FF) << 1)
        return imm | (-((imm >> 20) & 1) << 21)
    
    def _signed(self, val):
        return val if val < 0x80000000 else val - 0x100000000
    
    def _unsigned(self, val):
        return val & 0xFFFFFFFF
    
    def _load8(self, addr):
        return int.from_bytes(self.mem[addr:addr+1], 'little', signed=True)
    
    def _load16(self, addr):
        return int.from_bytes(self.mem[addr:addr+2], 'little', signed=True)
    
    def _load32(self, addr):
        return int.from_bytes(self.mem[addr:addr+4], 'little', signed=True)
    
    def _store8(self, addr, val):
        self.mem[addr:addr+1] = (val & 0xFF).to_bytes(1, 'little')
    
    def _store16(self, addr, val):
        self.mem[addr:addr+2] = (val & 0xFFFF).to_bytes(2, 'little')
    
    def _store32(self, addr, val):
        self.mem[addr:addr+4] = (val & 0xFFFFFFFF).to_bytes(4, 'little')
    
    def run(self, max_cycles=1000000):
        cycles = 0
        while cycles < max_cycles:
            inst = self.fetch()
            if inst == 0:
                break
            result = self.execute(inst)
            cycles += 1
            if result == "EBREAK":
                break
        return cycles

if __name__ == "__main__":
    # Simple test: load and execute a small program
    cpu = RV32I()
    cpu.reset()
    
    # Test program: addi x1, x0, 42
    test_prog = [
        0x02A00093,  # addi x1, x0, 42
        0x00100113,  # addi x2, x0, 1
        0x002181B3,  # add x3, x3, x2
        0x00100073,  # ebreak
    ]
    
    for i, inst in enumerate(test_prog):
        cpu.mem[i*4:(i+1)*4] = inst.to_bytes(4, 'little')
    
    cycles = cpu.run()
    print(f"Executed {cycles} cycles")
    print(f"x1 = {cpu.regs[1]}")
    print(f"x2 = {cpu.regs[2]}")
    print(f"x3 = {cpu.regs[3]}")
    assert cpu.regs[1] == 42, "ADDI failed"
    print("Basic tests passed")
