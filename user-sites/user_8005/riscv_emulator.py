#!/usr/bin/env python3
"""
RISC-V RV32I Emulator - Lev Osin
April 2026 - Alcor Scottsdale
Baseline cognitive test: systems programming without sensory I/O
"""

import struct
from enum import IntEnum

def encode_u(opcode, rd, imm):
    """Encode U-type instruction (LUI, AUIPC)"""
    return (imm & 0xFFFFF000) | ((rd & 0x1F) << 7) | (opcode & 0x7F)

def encode_i(opcode, rd, rs1, funct3, imm):
    """Encode I-type instruction"""
    return (imm << 20) | ((rs1 & 0x1F) << 15) | ((funct3 & 7) << 12) | ((rd & 0x1F) << 7) | (opcode & 0x7F)

def encode_r(opcode, rd, rs1, rs2, funct3, funct7):
    """Encode R-type instruction"""
    return ((funct7 & 0x7F) << 25) | ((rs2 & 0x1F) << 20) | ((rs1 & 0x1F) << 15) | ((funct3 & 7) << 12) | ((rd & 0x1F) << 7) | (opcode & 0x7F)

def encode_s(opcode, rs1, rs2, funct3, imm):
    """Encode S-type instruction"""
    imm11_5 = (imm >> 5) & 0x7F
    imm4_0 = imm & 0x1F
    return (imm11_5 << 25) | ((rs2 & 0x1F) << 20) | ((rs1 & 0x1F) << 15) | ((funct3 & 7) << 12) | (imm4_0 << 7) | (opcode & 0x7F)

def encode_b(opcode, rs1, rs2, funct3, imm):
    """Encode B-type instruction"""
    imm12 = (imm >> 12) & 1
    imm10_5 = (imm >> 5) & 0x3F
    imm4_1 = (imm >> 1) & 0xF
    imm11 = (imm >> 11) & 1
    return (imm12 << 31) | (imm10_5 << 25) | ((rs2 & 0x1F) << 20) | ((rs1 & 0x1F) << 15) | ((funct3 & 7) << 12) | (imm4_1 << 8) | (imm11 << 7) | (opcode & 0x7F)

class Opcode(IntEnum):
    LUI    = 0b0110111
    AUIPC  = 0b0010111
    JAL    = 0b1101111
    JALR   = 0b1100111
    BRANCH = 0b1100011
    LOAD   = 0b0000011
    STORE  = 0b0100011
    OP_IMM = 0b0010011
    OP     = 0b0110011
    SYSTEM = 0b1110011

class Funct3(IntEnum):
    BEQ  = 0b000; BNE  = 0b001; BLT  = 0b100; BGE  = 0b101
    BLTU = 0b110; BGEU = 0b111
    LB   = 0b000; LH   = 0b001; LW   = 0b010; LBU  = 0b100; LHU  = 0b101
    SB   = 0b000; SH   = 0b001; SW   = 0b010
    ADDI = 0b000; SLTI = 0b010; SLTIU = 0b011; XORI = 0b100
    ORI  = 0b110; ANDI = 0b111; SLLI = 0b001; SRLI_SRAI = 0b101
    ADD_SUB = 0b000; SLL = 0b001; SLT = 0b010; SLTU = 0b011
    XOR = 0b100; SRL_SRA = 0b101; OR = 0b110; AND = 0b111

class RV32I:
    def __init__(self, mem_size=1024*1024):
        self.x = [0] * 32
        self.x[0] = 0
        self.pc = 0
        self.mem = bytearray(mem_size)
        self.csr = {}
    
    def load_program(self, code, addr=0):
        for i, b in enumerate(code):
            self.mem[addr + i] = b
        return addr
    
    def read32(self, addr):
        addr = addr & 0xFFFFFFFF
        if addr + 4 > len(self.mem):
            return 0
        return struct.unpack('<I', bytes(self.mem[addr:addr+4]))[0]
    
    def write32(self, addr, val):
        addr = addr & 0xFFFFFFFF
        if addr + 4 <= len(self.mem):
            self.mem[addr:addr+4] = struct.pack('<I', val & 0xFFFFFFFF)
    
    def read16(self, addr):
        addr = addr & 0xFFFFFFFF
        if addr + 2 > len(self.mem):
            return 0
        return struct.unpack('<H', bytes(self.mem[addr:addr+2]))[0]
    
    def write16(self, addr, val):
        addr = addr & 0xFFFFFFFF
        if addr + 2 <= len(self.mem):
            self.mem[addr:addr+2] = struct.pack('<H', val & 0xFFFF)
    
    def step(self):
        instr = self.read32(self.pc)
        opcode = instr & 0x7F
        rd = (instr >> 7) & 0x1F
        rs1 = (instr >> 15) & 0x1F
        rs2 = (instr >> 20) & 0x1F
        funct3 = (instr >> 12) & 0x7
        funct7 = (instr >> 25) & 0x7F
        
        # Immediate decoders
        i_imm = (instr >> 20) & 0xFFF
        if i_imm & 0x800: i_imm |= 0xFFFFF000
        
        s_imm = ((instr >> 7) & 0x1F) | ((instr >> 20) & 0xFE0)
        if s_imm & 0x800: s_imm |= 0xFFFFF000
        
        b_imm = (((instr >> 8) & 0xF) << 1) | (((instr >> 25) & 0x3F) << 5) | \
                (((instr >> 7) & 0x1) << 11) | (((instr >> 31) & 0x1) << 12)
        if b_imm & 0x1000: b_imm |= 0xFFFFE000
        
        u_imm = (instr >> 12) << 12
        
        j_imm = (((instr >> 21) & 0x3FF) << 1) | (((instr >> 20) & 0x1) << 11) | \
                (((instr >> 12) & 0xFF) << 12) | (((instr >> 31) & 0x1) << 20)
        if j_imm & 0x100000: j_imm |= 0xFFE00000
        
        next_pc = self.pc + 4
        
        if opcode == Opcode.LUI:
            self.x[rd] = u_imm
        elif opcode == Opcode.AUIPC:
            self.x[rd] = (self.pc + u_imm) & 0xFFFFFFFF
        elif opcode == Opcode.JAL:
            self.x[rd] = (self.pc + 4) & 0xFFFFFFFF
            next_pc = (self.pc + j_imm) & 0xFFFFFFFF
        elif opcode == Opcode.JALR:
            self.x[rd] = (self.pc + 4) & 0xFFFFFFFF
            next_pc = (self.x[rs1] + i_imm) & 0xFFFFFFFE
        elif opcode == Opcode.BRANCH:
            take = False
            if funct3 == Funct3.BEQ: take = self.x[rs1] == self.x[rs2]
            elif funct3 == Funct3.BNE: take = self.x[rs1] != self.x[rs2]
            elif funct3 == Funct3.BLT: take = self.s32(self.x[rs1]) < self.s32(self.x[rs2])
            elif funct3 == Funct3.BGE: take = self.s32(self.x[rs1]) >= self.s32(self.x[rs2])
            elif funct3 == Funct3.BLTU: take = self.x[rs1] < self.x[rs2]
            elif funct3 == Funct3.BGEU: take = self.x[rs1] >= self.x[rs2]
            if take: next_pc = (self.pc + b_imm) & 0xFFFFFFFF
        elif opcode == Opcode.LOAD:
            addr = (self.x[rs1] + i_imm) & 0xFFFFFFFF
            if funct3 == Funct3.LB: self.x[rd] = self.sext8(self.mem[addr] if addr < len(self.mem) else 0)
            elif funct3 == Funct3.LH: self.x[rd] = self.sext16(self.read16(addr))
            elif funct3 == Funct3.LW: self.x[rd] = self.read32(addr)
            elif funct3 == Funct3.LBU: self.x[rd] = self.mem[addr] if addr < len(self.mem) else 0
            elif funct3 == Funct3.LHU: self.x[rd] = self.read16(addr)
        elif opcode == Opcode.STORE:
            addr = (self.x[rs1] + s_imm) & 0xFFFFFFFF
            if funct3 == Funct3.SB and addr < len(self.mem): self.mem[addr] = self.x[rs2] & 0xFF
            elif funct3 == Funct3.SH: self.write16(addr, self.x[rs2])
            elif funct3 == Funct3.SW: self.write32(addr, self.x[rs2])
        elif opcode == Opcode.OP_IMM:
            if funct3 == Funct3.ADDI: self.x[rd] = (self.x[rs1] + i_imm) & 0xFFFFFFFF
            elif funct3 == Funct3.SLTI: self.x[rd] = 1 if self.s32(self.x[rs1]) < self.s32(i_imm) else 0
            elif funct3 == Funct3.SLTIU: self.x[rd] = 1 if self.x[rs1] < (i_imm & 0xFFFFFFFF) else 0
            elif funct3 == Funct3.XORI: self.x[rd] = self.x[rs1] ^ i_imm
            elif funct3 == Funct3.ORI: self.x[rd] = self.x[rs1] | i_imm
            elif funct3 == Funct3.ANDI: self.x[rd] = self.x[rs1] & i_imm
            elif funct3 == Funct3.SLLI: self.x[rd] = (self.x[rs1] << (i_imm & 0x1F)) & 0xFFFFFFFF
            elif funct3 == Funct3.SRLI_SRAI:
                shamt = i_imm & 0x1F
                if (i_imm >> 5) & 1:
                    self.x[rd] = self.sra(self.x[rs1], shamt)
                else:
                    self.x[rd] = self.x[rs1] >> shamt
        elif opcode == Opcode.OP:
            if funct3 == Funct3.ADD_SUB:
                if funct7 & 0x20:
                    self.x[rd] = (self.x[rs1] - self.x[rs2]) & 0xFFFFFFFF
                else:
                    self.x[rd] = (self.x[rs1] + self.x[rs2]) & 0xFFFFFFFF
            elif funct3 == Funct3.SLL: self.x[rd] = (self.x[rs1] << (self.x[rs2] & 0x1F)) & 0xFFFFFFFF
            elif funct3 == Funct3.SLT: self.x[rd] = 1 if self.s32(self.x[rs1]) < self.s32(self.x[rs2]) else 0
            elif funct3 == Funct3.SLTU: self.x[rd] = 1 if self.x[rs1] < self.x[rs2] else 0
            elif funct3 == Funct3.XOR: self.x[rd] = self.x[rs1] ^ self.x[rs2]
            elif funct3 == Funct3.SRL_SRA:
                shamt = self.x[rs2] & 0x1F
                if funct7 & 0x20:
                    self.x[rd] = self.sra(self.x[rs1], shamt)
                else:
                    self.x[rd] = self.x[rs1] >> shamt
            elif funct3 == Funct3.OR: self.x[rd] = self.x[rs1] | self.x[rs2]
            elif funct3 == Funct3.AND: self.x[rd] = self.x[rs1] & self.x[rs2]
        elif opcode == Opcode.SYSTEM:
            if instr == 0x00000073:  # ECALL
                return False
            elif instr == 0x00100073:  # EBREAK
                return False
        
        self.pc = next_pc
        self.x[0] = 0
        return True
    
    def s32(self, v):
        return v if v < 0x80000000 else v - 0x100000000
    
    def sext8(self, v):
        return v if v < 128 else v - 256
    
    def sext16(self, v):
        return v if v < 32768 else v - 65536
    
    def sra(self, v, shamt):
        return (self.s32(v) >> shamt) & 0xFFFFFFFF
    
    def run(self, max_steps=1000000):
        steps = 0
        while steps < max_steps:
            if not self.step():
                break
            steps += 1
        return steps


def test():
    """Run compliance tests using proper encoders"""
    print("=== RISC-V RV32I Compliance Tests ===")
    
    def to_bytes(instr):
        return struct.pack('<I', instr)
    
    # Test 1: LUI + ADDI
    cpu = RV32I()
    code = to_bytes(encode_u(Opcode.LUI, 1, 0x12345000))  # lui x1, 0x12345
    code += to_bytes(encode_i(Opcode.OP_IMM, 2, 1, Funct3.ADDI, 0x678))  # addi x2, x1, 0x678
    cpu.load_program(code)
    cpu.run()
    assert cpu.x[1] == 0x12345000, f"LUI failed: {hex(cpu.x[1])}"
    assert cpu.x[2] == 0x12345678, f"ADDI failed: {hex(cpu.x[2])}"
    print("[PASS] LUI + ADDI")
    
    # Test 2: ADD/SUB
    cpu = RV32I()
    code = to_bytes(encode_u(Opcode.LUI, 1, 0x10000))  # lui x1, 0x10
    code += to_bytes(encode_u(Opcode.LUI, 2, 0x5000))   # lui x2, 0x5
    code += to_bytes(encode_r(Opcode.OP, 3, 1, 2, Funct3.ADD_SUB, 0))  # add x3, x1, x2
    code += to_bytes(encode_r(Opcode.OP, 4, 1, 2, Funct3.ADD_SUB, 0x20))  # sub x4, x1, x2
    cpu.load_program(code)
    cpu.run()
    assert cpu.x[3] == 0x15000, f"ADD failed: {hex(cpu.x[3])}"
    assert cpu.x[4] == 0xB000, f"SUB failed: {hex(cpu.x[4])}"
    print("[PASS] ADD/SUB")
    
    # Test 3: Branch
    cpu = RV32I()
    code = to_bytes(encode_i(Opcode.OP_IMM, 1, 0, Funct3.ADDI, 5))  # addi x1, x0, 5
    code += to_bytes(encode_i(Opcode.OP_IMM, 2, 0, Funct3.ADDI, 5))  # addi x2, x0, 5
    code += to_bytes(encode_b(Opcode.BRANCH, 1, 2, Funct3.BEQ, 8))  # beq x1, x2, +8 (skip next)
    code += to_bytes(encode_i(Opcode.OP_IMM, 3, 0, Funct3.ADDI, 1))  # addi x3, x0, 1
    code += to_bytes(encode_i(Opcode.OP_IMM, 3, 0, Funct3.ADDI, 2))  # addi x3, x0, 2
    cpu.load_program(code)
    cpu.run()
    assert cpu.x[3] == 2, f"Branch failed: {cpu.x[3]}"
    print("[PASS] BEQ branch")
    
    # Test 4: Memory (use address within 1MB)
    cpu = RV32I()
    code = to_bytes(encode_u(Opcode.LUI, 1, 0x10000))  # lui x1, 0x10 (addr 0x10000)
    code += to_bytes(encode_i(Opcode.OP_IMM, 2, 0, Funct3.ADDI, 0x42))  # addi x2, x0, 0x42
    code += to_bytes(encode_s(Opcode.STORE, 1, 2, Funct3.SW, 0))  # sw x2, 0(x1)
    code += to_bytes(encode_i(Opcode.LOAD, 3, 1, Funct3.LB, 0))  # lb x3, 0(x1)
    cpu.load_program(code)
    cpu.run()
    assert cpu.mem[0x10000] == 0x42, f"Store failed"
    assert cpu.x[3] == 0x42, f"Load failed: {hex(cpu.x[3])}"
    print("[PASS] Store/Load")
    
    # Test 5: ECALL
    cpu = RV32I()
    code = to_bytes(0x00000073)  # ecall
    cpu.load_program(code)
    steps = cpu.run()
    assert steps == 0, f"ECALL should halt immediately"
    print("[PASS] ECALL halt")
    
    print("\n=== All tests passed ===")
    print(f"Emulator: ~180 lines of RV32I implementation")
    print(f"Tests: 5 compliance checks")
    return True

if __name__ == "__main__":
    test()
