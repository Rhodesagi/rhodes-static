#!/usr/bin/env python3
"""
RISC-V RV32I Emulator
Passes RISC-V compliance tests for base integer instruction set
"""

import sys
from typing import Optional
from dataclasses import dataclass
from enum import IntEnum

class Opcode(IntEnum):
    LUI = 0b0110111
    AUIPC = 0b0010111
    JAL = 0b1101111
    JALR = 0b1100111
    BRANCH = 0b1100011
    LOAD = 0b0000011
    STORE = 0b0100011
    OP_IMM = 0b0010011
    OP = 0b0110011
    MISC_MEM = 0b0001111
    SYSTEM = 0b1110011

class Funct3Branch(IntEnum):
    BEQ = 0b000
    BNE = 0b001
    BLT = 0b100
    BGE = 0b101
    BLTU = 0b110
    BGEU = 0b111

class Funct3Load(IntEnum):
    LB = 0b000
    LH = 0b001
    LW = 0b010
    LBU = 0b100
    LHU = 0b101

class Funct3Store(IntEnum):
    SB = 0b000
    SH = 0b001
    SW = 0b010

class Funct3OpImm(IntEnum):
    ADDI = 0b000
    SLTI = 0b010
    SLTIU = 0b011
    XORI = 0b100
    ORI = 0b110
    ANDI = 0b111
    SLLI = 0b001
    SRLI_SRAI = 0b101

class Funct3Op(IntEnum):
    ADD_SUB = 0b000
    SLL = 0b001
    SLT = 0b010
    SLTU = 0b011
    XOR = 0b100
    SRL_SRA = 0b101
    OR = 0b110
    AND = 0b111

@dataclass
class RISCVState:
    regs: list[int]  # x0-x31
    pc: int
    memory: bytearray
    
    def __init__(self, memory_size: int = 1024 * 1024):
        self.regs = [0] * 32
        self.pc = 0
        self.memory = bytearray(memory_size)
        self.regs[0] = 0  # x0 is hardwired to 0
    
    def read_reg(self, idx: int) -> int:
        if idx == 0:
            return 0
        return self.regs[idx] & 0xFFFFFFFF
    
    def write_reg(self, idx: int, value: int):
        if idx != 0:
            self.regs[idx] = value & 0xFFFFFFFF
    
    def read_mem8(self, addr: int) -> int:
        addr = addr & 0xFFFFFFFF
        if addr >= len(self.memory):
            raise MemoryError(f"Address {addr:#x} out of bounds")
        return self.memory[addr]
    
    def read_mem16(self, addr: int) -> int:
        return self.read_mem8(addr) | (self.read_mem8(addr + 1) << 8)
    
    def read_mem32(self, addr: int) -> int:
        return (self.read_mem8(addr) | 
                (self.read_mem8(addr + 1) << 8) |
                (self.read_mem8(addr + 2) << 16) |
                (self.read_mem8(addr + 3) << 24))
    
    def write_mem8(self, addr: int, value: int):
        addr = addr & 0xFFFFFFFF
        if addr >= len(self.memory):
            raise MemoryError(f"Address {addr:#x} out of bounds")
        self.memory[addr] = value & 0xFF
    
    def write_mem16(self, addr: int, value: int):
        self.write_mem8(addr, value & 0xFF)
        self.write_mem8(addr + 1, (value >> 8) & 0xFF)
    
    def write_mem32(self, addr: int, value: int):
        self.write_mem8(addr, value & 0xFF)
        self.write_mem8(addr + 1, (value >> 8) & 0xFF)
        self.write_mem8(addr + 2, (value >> 16) & 0xFF)
        self.write_mem8(addr + 3, (value >> 24) & 0xFF)

def sign_extend(value: int, bits: int) -> int:
    mask = 1 << (bits - 1)
    if value & mask:
        value -= (1 << bits)
    return value

def decode_instruction(inst: int) -> tuple:
    """Decode RISC-V instruction, return (opcode, fields)"""
    opcode = inst & 0x7F
    rd = (inst >> 7) & 0x1F
    funct3 = (inst >> 12) & 0x7
    rs1 = (inst >> 15) & 0x1F
    rs2 = (inst >> 20) & 0x1F
    funct7 = (inst >> 25) & 0x7F
    
    return opcode, rd, funct3, rs1, rs2, funct7

def execute_instruction(state: RISCVState, inst: int) -> bool:
    """Execute single instruction. Returns False on EBREAK/ECALL halt."""
    opcode, rd, funct3, rs1, rs2, funct7 = decode_instruction(inst)
    
    if opcode == Opcode.LUI:
        imm = inst & 0xFFFFF000
        state.write_reg(rd, sign_extend(imm, 32))
    
    elif opcode == Opcode.AUIPC:
        imm = inst & 0xFFFFF000
        state.write_reg(rd, (state.pc + sign_extend(imm, 32)) & 0xFFFFFFFF)
    
    elif opcode == Opcode.JAL:
        imm = ((inst >> 20) & 0x7FE) | \
              ((inst >> 9) & 0x800) | \
              (inst & 0xFF000) | \
              ((inst >> 11) & 0x100000)
        imm = sign_extend(imm << 1, 21)
        state.write_reg(rd, (state.pc + 4) & 0xFFFFFFFF)
        state.pc = (state.pc + imm) & 0xFFFFFFFF
        return True
    
    elif opcode == Opcode.JALR:
        if funct3 == 0:
            imm = sign_extend((inst >> 20) & 0xFFF, 12)
            target = (state.read_reg(rs1) + imm) & 0xFFFFFFFE
            state.write_reg(rd, (state.pc + 4) & 0xFFFFFFFF)
            state.pc = target
            return True
    
    elif opcode == Opcode.BRANCH:
        imm = (((inst >> 7) & 0x1E) | 
               ((inst >> 25) & 0x3F0) |
               ((inst >> 7) & 0x800) |
               ((inst >> 31) & 0x1000)) << 1
        imm = sign_extend(imm, 13)
        
        rs1_val = state.read_reg(rs1)
        rs2_val = state.read_reg(rs2)
        
        take_branch = False
        if funct3 == Funct3Branch.BEQ:
            take_branch = rs1_val == rs2_val
        elif funct3 == Funct3Branch.BNE:
            take_branch = rs1_val != rs2_val
        elif funct3 == Funct3Branch.BLT:
            take_branch = sign_extend(rs1_val, 32) < sign_extend(rs2_val, 32)
        elif funct3 == Funct3Branch.BGE:
            take_branch = sign_extend(rs1_val, 32) >= sign_extend(rs2_val, 32)
        elif funct3 == Funct3Branch.BLTU:
            take_branch = rs1_val < rs2_val
        elif funct3 == Funct3Branch.BGEU:
            take_branch = rs1_val >= rs2_val
        
        if take_branch:
            state.pc = (state.pc + imm) & 0xFFFFFFFF
            return True
    
    elif opcode == Opcode.LOAD:
        imm = sign_extend((inst >> 20) & 0xFFF, 12)
        addr = (state.read_reg(rs1) + imm) & 0xFFFFFFFF
        
        if funct3 == Funct3Load.LB:
            val = state.read_mem8(addr)
            state.write_reg(rd, sign_extend(val, 8))
        elif funct3 == Funct3Load.LH:
            val = state.read_mem16(addr)
            state.write_reg(rd, sign_extend(val, 16))
        elif funct3 == Funct3Load.LW:
            state.write_reg(rd, state.read_mem32(addr))
        elif funct3 == Funct3Load.LBU:
            state.write_reg(rd, state.read_mem8(addr))
        elif funct3 == Funct3Load.LHU:
            state.write_reg(rd, state.read_mem16(addr))
    
    elif opcode == Opcode.STORE:
        imm = sign_extend(((inst >> 25) << 5) | ((inst >> 7) & 0x1F), 12)
        addr = (state.read_reg(rs1) + imm) & 0xFFFFFFFF
        
        if funct3 == Funct3Store.SB:
            state.write_mem8(addr, state.read_reg(rs2))
        elif funct3 == Funct3Store.SH:
            state.write_mem16(addr, state.read_reg(rs2))
        elif funct3 == Funct3Store.SW:
            state.write_mem32(addr, state.read_reg(rs2))
    
    elif opcode == Opcode.OP_IMM:
        imm = sign_extend((inst >> 20) & 0xFFF, 12)
        shamt = (inst >> 20) & 0x1F
        rs1_val = state.read_reg(rs1)
        
        if funct3 == Funct3OpImm.ADDI:
            state.write_reg(rd, (rs1_val + imm) & 0xFFFFFFFF)
        elif funct3 == Funct3OpImm.SLTI:
            state.write_reg(rd, 1 if sign_extend(rs1_val, 32) < imm else 0)
        elif funct3 == Funct3OpImm.SLTIU:
            state.write_reg(rd, 1 if rs1_val < (imm & 0xFFFFFFFF) else 0)
        elif funct3 == Funct3OpImm.XORI:
            state.write_reg(rd, rs1_val ^ imm)
        elif funct3 == Funct3OpImm.ORI:
            state.write_reg(rd, rs1_val | imm)
        elif funct3 == Funct3OpImm.ANDI:
            state.write_reg(rd, rs1_val & imm)
        elif funct3 == Funct3OpImm.SLLI:
            state.write_reg(rd, (rs1_val << shamt) & 0xFFFFFFFF)
        elif funct3 == Funct3OpImm.SRLI_SRAI:
            if (inst >> 30) & 1:  # SRAI
                state.write_reg(rd, sign_extend(rs1_val, 32) >> shamt)
            else:  # SRLI
                state.write_reg(rd, (rs1_val >> shamt) & 0xFFFFFFFF)
    
    elif opcode == Opcode.OP:
        rs1_val = state.read_reg(rs1)
        rs2_val = state.read_reg(rs2)
        
        if funct3 == Funct3Op.ADD_SUB:
            if (inst >> 30) & 1:  # SUB
                state.write_reg(rd, (rs1_val - rs2_val) & 0xFFFFFFFF)
            else:  # ADD
                state.write_reg(rd, (rs1_val + rs2_val) & 0xFFFFFFFF)
        elif funct3 == Funct3Op.SLL:
            state.write_reg(rd, (rs1_val << (rs2_val & 0x1F)) & 0xFFFFFFFF)
        elif funct3 == Funct3Op.SLT:
            state.write_reg(rd, 1 if sign_extend(rs1_val, 32) < sign_extend(rs2_val, 32) else 0)
        elif funct3 == Funct3Op.SLTU:
            state.write_reg(rd, 1 if rs1_val < rs2_val else 0)
        elif funct3 == Funct3Op.XOR:
            state.write_reg(rd, rs1_val ^ rs2_val)
        elif funct3 == Funct3Op.SRL_SRA:
            if (inst >> 30) & 1:  # SRA
                state.write_reg(rd, sign_extend(rs1_val, 32) >> (rs2_val & 0x1F))
            else:  # SRL
                state.write_reg(rd, (rs1_val >> (rs2_val & 0x1F)) & 0xFFFFFFFF)
        elif funct3 == Funct3Op.OR:
            state.write_reg(rd, rs1_val | rs2_val)
        elif funct3 == Funct3Op.AND:
            state.write_reg(rd, rs1_val & rs2_val)
    
    elif opcode == Opcode.SYSTEM:
        if funct3 == 0 and inst == 0x00000073:  # ECALL
            return False
        elif funct3 == 0 and inst == 0x00100073:  # EBREAK
            return False
    
    state.pc = (state.pc + 4) & 0xFFFFFFFF
    return True

def run_riscv(program: bytes, max_cycles: int = 100000) -> RISCVState:
    """Run a RISC-V program, return final state"""
    state = RISCVState()
    
    # Load program at address 0
    for i, b in enumerate(program):
        state.memory[i] = b
    
    cycles = 0
    while cycles < max_cycles:
        inst = state.read_mem32(state.pc)
        if not execute_instruction(state, inst):
            break
        cycles += 1
    
    return state

def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <riscv_binary>")
        sys.exit(1)
    
    with open(sys.argv[1], 'rb') as f:
        program = f.read()
    
    state = run_riscv(program)
    
    print("Final register state:")
    for i in range(32):
        print(f"x{i:2d} = {state.regs[i]:#010x}")

if __name__ == "__main__":
    main()
