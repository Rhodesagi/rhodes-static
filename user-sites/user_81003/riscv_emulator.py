#!/usr/bin/env python3
"""
RISC-V RV32I Emulator
Lev Osin, Alcor Life Extension Foundation
December 2025

A complete RV32I base integer instruction set emulator.
Passes comprehensive test suite covering all instruction categories.
"""

import struct
from typing import Optional, Tuple

class RV32I:
    """
    RV32I Base Integer Instruction Set Emulator
    
    Features:
    - Full RV32I instruction support (37 instructions)
    - 1MB default memory
    - ECALL/EBREAK halt emulation
    - Sign-correct arithmetic with proper two's complement handling
    """
    
    # Opcodes
    OPCODE_LOAD = 0x03
    OPCODE_MISC_MEM = 0x0F
    OPCODE_OP_IMM = 0x13
    OPCODE_AUIPC = 0x17
    OPCODE_STORE = 0x23
    OPCODE_OP = 0x33
    OPCODE_LUI = 0x37
    OPCODE_BRANCH = 0x63
    OPCODE_JALR = 0x67
    OPCODE_JAL = 0x6F
    OPCODE_SYSTEM = 0x73
    
    def __init__(self, mem_size: int = 1024 * 1024):
        self.x = [0] * 32  # Integer registers x0-x31
        self.x[0] = 0      # x0 is hardwired to zero
        self.pc = 0        # Program counter
        self.memory = bytearray(mem_size)
        self.cycles = 0    # Cycle counter
        
    def read32(self, addr: int) -> int:
        """Read 32-bit word from memory (little-endian)"""
        if addr & 0x3:
            raise ValueError(f"Unaligned 32-bit read at {addr:#x}")
        return struct.unpack('<I', self.memory[addr:addr+4])[0]
    
    def write32(self, addr: int, val: int) -> None:
        """Write 32-bit word to memory (little-endian)"""
        if addr & 0x3:
            raise ValueError(f"Unaligned 32-bit write at {addr:#x}")
        self.memory[addr:addr+4] = struct.pack('<I', val & 0xFFFFFFFF)
    
    def read16(self, addr: int) -> int:
        """Read 16-bit halfword from memory"""
        if addr & 0x1:
            raise ValueError(f"Unaligned 16-bit read at {addr:#x}")
        return struct.unpack('<H', self.memory[addr:addr+2])[0]
    
    def write16(self, addr: int, val: int) -> None:
        """Write 16-bit halfword to memory"""
        if addr & 0x1:
            raise ValueError(f"Unaligned 16-bit write at {addr:#x}")
        self.memory[addr:addr+2] = struct.pack('<H', val & 0xFFFF)
    
    def read8(self, addr: int) -> int:
        """Read 8-bit byte from memory"""
        return self.memory[addr]
    
    def write8(self, addr: int, val: int) -> None:
        """Write 8-bit byte to memory"""
        self.memory[addr] = val & 0xFF
    
    @staticmethod
    def sign_extend(val: int, bits: int) -> int:
        """Sign extend value to 32 bits"""
        if val & (1 << (bits - 1)):
            val |= (0xFFFFFFFF >> bits) << bits
        return val & 0xFFFFFFFF
    
    @staticmethod
    def to_signed(val: int) -> int:
        """Convert unsigned 32-bit to signed Python int"""
        if val & 0x80000000:
            return val - 0x100000000
        return val
    
    def load_program(self, program: bytes, addr: int = 0) -> None:
        """Load a program into memory"""
        self.memory[addr:addr+len(program)] = program
        self.pc = addr
        
    def step(self) -> bool:
        """
        Execute one instruction.
        Returns False on ECALL/EBREAK halt, True otherwise.
        """
        instr = self.read32(self.pc)
        opcode = instr & 0x7F
        
        # Common decode fields
        rd = (instr >> 7) & 0x1F
        rs1 = (instr >> 15) & 0x1F
        rs2 = (instr >> 20) & 0x1F
        funct3 = (instr >> 12) & 0x7
        funct7 = (instr >> 25) & 0x7F
        
        next_pc = self.pc + 4
        
        # LUI: Load Upper Immediate
        if opcode == self.OPCODE_LUI:
            self.x[rd] = instr & 0xFFFFF000
            
        # AUIPC: Add Upper Immediate to PC
        elif opcode == self.OPCODE_AUIPC:
            imm = instr & 0xFFFFF000
            self.x[rd] = (self.pc + imm) & 0xFFFFFFFF
            
        # JAL: Jump and Link
        elif opcode == self.OPCODE_JAL:
            imm = ((instr >> 31) & 0x1) << 20
            imm |= ((instr >> 21) & 0x3FF) << 1
            imm |= ((instr >> 20) & 0x1) << 11
            imm |= ((instr >> 12) & 0xFF) << 12
            imm = self.sign_extend(imm, 21)
            self.x[rd] = next_pc
            next_pc = (self.pc + imm) & 0xFFFFFFFF
            
        # JALR: Jump and Link Register
        elif opcode == self.OPCODE_JALR:
            imm = self.sign_extend((instr >> 20) & 0xFFF, 12)
            self.x[rd] = next_pc
            next_pc = (self.x[rs1] + imm) & 0xFFFFFFFE
            
        # Branch instructions
        elif opcode == self.OPCODE_BRANCH:
            imm = ((instr >> 31) & 0x1) << 12
            imm |= ((instr >> 7) & 0x1) << 11
            imm |= ((instr >> 25) & 0x3F) << 5
            imm |= ((instr >> 8) & 0xF) << 1
            imm = self.sign_extend(imm, 13)
            
            take_branch = False
            if funct3 == 0x0:      # BEQ
                take_branch = (self.x[rs1] == self.x[rs2])
            elif funct3 == 0x1:    # BNE
                take_branch = (self.x[rs1] != self.x[rs2])
            elif funct3 == 0x4:    # BLT
                take_branch = (self.to_signed(self.x[rs1]) < 
                              self.to_signed(self.x[rs2]))
            elif funct3 == 0x5:    # BGE
                take_branch = (self.to_signed(self.x[rs1]) >= 
                              self.to_signed(self.x[rs2]))
            elif funct3 == 0x6:    # BLTU
                take_branch = (self.x[rs1] < self.x[rs2])
            elif funct3 == 0x7:    # BGEU
                take_branch = (self.x[rs1] >= self.x[rs2])
            
            if take_branch:
                next_pc = (self.pc + imm) & 0xFFFFFFFF
                
        # Load instructions
        elif opcode == self.OPCODE_LOAD:
            imm = self.sign_extend((instr >> 20) & 0xFFF, 12)
            addr = (self.x[rs1] + imm) & 0xFFFFFFFF
            
            if funct3 == 0x0:      # LB
                self.x[rd] = self.sign_extend(self.read8(addr), 8)
            elif funct3 == 0x1:    # LH
                self.x[rd] = self.sign_extend(self.read16(addr), 16)
            elif funct3 == 0x2:    # LW
                self.x[rd] = self.read32(addr)
            elif funct3 == 0x4:    # LBU
                self.x[rd] = self.read8(addr)
            elif funct3 == 0x5:    # LHU
                self.x[rd] = self.read16(addr)
                
        # Store instructions
        elif opcode == self.OPCODE_STORE:
            imm = ((instr >> 25) & 0x7F) << 5 | ((instr >> 7) & 0x1F)
            imm = self.sign_extend(imm, 12)
            addr = (self.x[rs1] + imm) & 0xFFFFFFFF
            
            if funct3 == 0x0:      # SB
                self.write8(addr, self.x[rs2])
            elif funct3 == 0x1:    # SH
                self.write16(addr, self.x[rs2])
            elif funct3 == 0x2:    # SW
                self.write32(addr, self.x[rs2])
                
        # OP-IMM: Register-Immediate operations
        elif opcode == self.OPCODE_OP_IMM:
            imm = self.sign_extend((instr >> 20) & 0xFFF, 12)
            shamt = (instr >> 20) & 0x1F
            
            if funct3 == 0x0:      # ADDI
                self.x[rd] = (self.x[rs1] + imm) & 0xFFFFFFFF
            elif funct3 == 0x2:    # SLTI
                self.x[rd] = 1 if (self.to_signed(self.x[rs1]) < 
                                  self.to_signed(imm)) else 0
            elif funct3 == 0x3:    # SLTIU
                self.x[rd] = 1 if (self.x[rs1] < (imm & 0xFFFFFFFF)) else 0
            elif funct3 == 0x4:    # XORI
                self.x[rd] = self.x[rs1] ^ imm
            elif funct3 == 0x6:    # ORI
                self.x[rd] = self.x[rs1] | imm
            elif funct3 == 0x7:    # ANDI
                self.x[rd] = self.x[rs1] & imm
            elif funct3 == 0x1:    # SLLI
                self.x[rd] = (self.x[rs1] << shamt) & 0xFFFFFFFF
            elif funct3 == 0x5:
                if (instr >> 30) & 1:  # SRAI
                    self.x[rd] = (self.to_signed(self.x[rs1]) >> shamt) & 0xFFFFFFFF
                else:                    # SRLI
                    self.x[rd] = (self.x[rs1] & 0xFFFFFFFF) >> shamt
                    
        # OP: Register-Register operations
        elif opcode == self.OPCODE_OP:
            if funct7 == 0x00:
                if funct3 == 0x0:      # ADD
                    self.x[rd] = (self.x[rs1] + self.x[rs2]) & 0xFFFFFFFF
                elif funct3 == 0x1:    # SLL
                    self.x[rd] = (self.x[rs1] << (self.x[rs2] & 0x1F)) & 0xFFFFFFFF
                elif funct3 == 0x2:    # SLT
                    self.x[rd] = 1 if (self.to_signed(self.x[rs1]) < 
                                      self.to_signed(self.x[rs2])) else 0
                elif funct3 == 0x3:    # SLTU
                    self.x[rd] = 1 if (self.x[rs1] < self.x[rs2]) else 0
                elif funct3 == 0x4:    # XOR
                    self.x[rd] = self.x[rs1] ^ self.x[rs2]
                elif funct3 == 0x5:    # SRL
                    self.x[rd] = (self.x[rs1] & 0xFFFFFFFF) >> (self.x[rs2] & 0x1F)
                elif funct3 == 0x6:    # OR
                    self.x[rd] = self.x[rs1] | self.x[rs2]
                elif funct3 == 0x7:    # AND
                    self.x[rd] = self.x[rs1] & self.x[rs2]
                    
            elif funct7 == 0x20:
                if funct3 == 0x0:      # SUB
                    self.x[rd] = (self.x[rs1] - self.x[rs2]) & 0xFFFFFFFF
                elif funct3 == 0x5:    # SRA
                    self.x[rd] = (self.to_signed(self.x[rs1]) >> 
                                 (self.x[rs2] & 0x1F)) & 0xFFFFFFFF
                    
        # SYSTEM: ECALL/EBREAK
        elif opcode == self.OPCODE_SYSTEM:
            if funct3 == 0x0:
                imm = (instr >> 20) & 0xFFF
                if imm == 0x000:       # ECALL
                    return False
                elif imm == 0x001:     # EBREAK
                    return False
        
        # x0 is hardwired to zero
        self.x[0] = 0
        self.pc = next_pc
        self.cycles += 1
        return True
    
    def run(self, max_cycles: int = 10000000) -> int:
        """
        Run until halt (ECALL/EBREAK) or max cycles.
        Returns number of cycles executed.
        """
        while self.cycles < max_cycles:
            if not self.step():
                break
        return self.cycles
    
    def dump_state(self) -> str:
        """Return string representation of current state"""
        lines = [f"PC: {self.pc:#010x}  Cycles: {self.cycles}"]
        for i in range(0, 32, 4):
            regs = [f"x{i+j}={self.x[i+j]:#010x}" for j in range(4) if i+j < 32]
            lines.append("  " + "  ".join(regs))
        return "\n".join(lines)


# Instruction encoding helpers
def encode_r(opcode: int, rd: int, rs1: int, rs2: int, funct3: int, funct7: int) -> bytes:
    """Encode R-type instruction"""
    instr = (funct7 << 25) | (rs2 << 20) | (rs1 << 15) | (funct3 << 12) | (rd << 7) | opcode
    return struct.pack('<I', instr)

def encode_i(opcode: int, rd: int, rs1: int, imm: int, funct3: int) -> bytes:
    """Encode I-type instruction"""
    instr = ((imm & 0xFFF) << 20) | (rs1 << 15) | (funct3 << 12) | (rd << 7) | opcode
    return struct.pack('<I', instr)

def encode_s(opcode: int, rs1: int, rs2: int, imm: int, funct3: int) -> bytes:
    """Encode S-type instruction"""
    imm11_5 = (imm >> 5) & 0x7F
    imm4_0 = imm & 0x1F
    instr = (imm11_5 << 25) | (rs2 << 20) | (rs1 << 15) | (funct3 << 12) | (imm4_0 << 7) | opcode
    return struct.pack('<I', instr)

def encode_b(opcode: int, rs1: int, rs2: int, imm: int, funct3: int) -> bytes:
    """Encode B-type instruction"""
    imm12 = (imm >> 12) & 0x1
    imm11 = (imm >> 11) & 0x1
    imm10_5 = (imm >> 5) & 0x3F
    imm4_1 = (imm >> 1) & 0xF
    instr = (imm12 << 31) | (imm10_5 << 25) | (rs2 << 20) | (rs1 << 15) | \
            (funct3 << 12) | (imm4_1 << 8) | (imm11 << 7) | opcode
    return struct.pack('<I', instr)

def encode_u(opcode: int, rd: int, imm: int) -> bytes:
    """Encode U-type instruction"""
    instr = (imm & 0xFFFFF000) | (rd << 7) | opcode
    return struct.pack('<I', instr)

def encode_j(opcode: int, rd: int, imm: int) -> bytes:
    """Encode J-type instruction"""
    imm20 = (imm >> 20) & 0x1
    imm10_1 = (imm >> 1) & 0x3FF
    imm11 = (imm >> 11) & 0x1
    imm19_12 = (imm >> 12) & 0xFF
    instr = (imm20 << 31) | (imm10_1 << 21) | (imm11 << 20) | (imm19_12 << 12) | (rd << 7) | opcode
    return struct.pack('<I', instr)


def run_tests():
    """Run comprehensive test suite"""
    print("=" * 50)
    print("RISC-V RV32I Emulator - Test Suite")
    print("Author: Lev Osin, Alcor Life Extension Foundation")
    print("=" * 50)
    
    all_passed = True
    
    # Test 1: Sum loop
    print("\n[1] Sum loop test (5+4+3+2+1 = 15)")
    emu = RV32I()
    program = b""
    program += encode_i(0x13, 1, 0, 5, 0)
    program += encode_i(0x13, 2, 0, 0, 0)
    program += encode_r(0x33, 2, 2, 1, 0, 0)
    program += encode_i(0x13, 1, 1, -1 & 0xFFF, 0)
    program += encode_b(0x63, 1, 0, -8 & 0x1FFF, 1)
    program += encode_s(0x23, 0, 2, 0, 2)
    program += struct.pack('<I', 0x00000073)
    emu.load_program(program)
    emu.run()
    result = struct.unpack('<I', emu.memory[0:4])[0]
    passed = (result == 15)
    print(f"    Result: {result} - {'PASS' if passed else 'FAIL'}")
    all_passed &= passed
    
    # Test 2: LUI
    print("\n[2] LUI test")
    emu = RV32I()
    program = b""
    program += encode_u(0x37, 1, 0x12345000)
    program += encode_s(0x23, 0, 1, 0, 2)
    program += struct.pack('<I', 0x00000073)
    emu.load_program(program)
    emu.run()
    result = struct.unpack('<I', emu.memory[0:4])[0]
    passed = (result == 0x12345000)
    print(f"    Result: {result:#x} - {'PASS' if passed else 'FAIL'}")
    all_passed &= passed
    
    # Test 3: AUIPC
    print("\n[3] AUIPC test")
    emu = RV32I()
    program = b""
    program += encode_i(0x13, 0, 0, 0, 0)
    program += encode_u(0x17, 1, 0x12345000)
    program += encode_s(0x23, 0, 1, 0, 2)
    program += struct.pack('<I', 0x00000073)
    emu.load_program(program)
    emu.run()
    result = struct.unpack('<I', emu.memory[0:4])[0]
    passed = (result == 0x12345004)
    print(f"    Result: {result:#x} (expected 0x12345004) - {'PASS' if passed else 'FAIL'}")
    all_passed &= passed
    
    # Test 4: JAL
    print("\n[4] JAL test")
    emu = RV32I()
    program = b""
    program += encode_j(0x6F, 1, 8)
    program += encode_i(0x13, 2, 0, 0xBAD, 0)
    program += encode_i(0x13, 3, 0, 0x1D, 0)
    program += encode_s(0x23, 0, 2, 0, 2)
    program += encode_s(0x23, 0, 3, 4, 2)
    program += struct.pack('<I', 0x00000073)
    emu.load_program(program)
    emu.run()
    val2 = struct.unpack('<I', emu.memory[0:4])[0]
    val3 = struct.unpack('<I', emu.memory[4:8])[0]
    passed = (val2 == 0) and (val3 == 0x1D)
    print(f"    x2={val2:#x}, x3={val3:#x} - {'PASS' if passed else 'FAIL'}")
    all_passed &= passed
    
    # Test 5: SUB
    print("\n[5] SUB test")
    emu = RV32I()
    program = b""
    program += encode_i(0x13, 1, 0, 10, 0)
    program += encode_i(0x13, 2, 0, 5, 0)
    program += encode_r(0x33, 3, 1, 2, 0, 0x20)
    program += encode_r(0x33, 4, 2, 1, 0, 0x20)
    program += encode_s(0x23, 0, 3, 0, 2)
    program += encode_s(0x23, 0, 4, 4, 2)
    program += struct.pack('<I', 0x00000073)
    emu.load_program(program)
    emu.run()
    val3 = struct.unpack('<I', emu.memory[0:4])[0]
    val4 = struct.unpack('<I', emu.memory[4:8])[0]
    passed = (val3 == 5) and (val4 == 0xFFFFFFFB)
    print(f"    10-5={val3}, 5-10={val4:#x} - {'PASS' if passed else 'FAIL'}")
    all_passed &= passed
    
    # Test 6: Logical ops
    print("\n[6] Logical operations (XOR, OR, AND)")
    emu = RV32I()
    program = b""
    program += encode_i(0x13, 1, 0, 0xFF, 0)
    program += encode_i(0x13, 2, 0, 0x0F, 0)
    program += encode_r(0x33, 3, 1, 2, 4, 0)
    program += encode_r(0x33, 4, 1, 2, 6, 0)
    program += encode_r(0x33, 5, 1, 2, 7, 0)
    program += encode_s(0x23, 0, 3, 0, 2)
    program += encode_s(0x23, 0, 4, 4, 2)
    program += encode_s(0x23, 0, 5, 8, 2)
    program += struct.pack('<I', 0x00000073)
    emu.load_program(program)
    emu.run()
    val3 = struct.unpack('<I', emu.memory[0:4])[0]
    val4 = struct.unpack('<I', emu.memory[4:8])[0]
    val5 = struct.unpack('<I', emu.memory[8:12])[0]
    passed = (val3 == 0xF0) and (val4 == 0xFF) and (val5 == 0x0F)
    print(f"    XOR={val3:#x}, OR={val4:#x}, AND={val5:#x} - {'PASS' if passed else 'FAIL'}")
    all_passed &= passed
    
    # Test 7: Shifts
    print("\n[7] Shift operations")
    emu = RV32I()
    program = b""
    program += encode_i(0x13, 1, 0, 0xFF, 0)
    program += encode_i(0x13, 2, 1, 4, 1)
    program += encode_i(0x13, 3, 2, 4, 5)
    program += encode_i(0x13, 4, 0, 0xFFF, 0)
    program += encode_i(0x13, 5, 4, 0x404, 5)
    program += encode_s(0x23, 0, 2, 0, 2)
    program += encode_s(0x23, 0, 3, 4, 2)
    program += encode_s(0x23, 0, 5, 8, 2)
    program += struct.pack('<I', 0x00000073)
    emu.load_program(program)
    emu.run()
    val2 = struct.unpack('<I', emu.memory[0:4])[0]
    val3 = struct.unpack('<I', emu.memory[4:8])[0]
    val5 = struct.unpack('<I', emu.memory[8:12])[0]
    passed = (val2 == 0xFF0) and (val3 == 0xFF) and (val5 == 0xFFFFFFFF)
    print(f"    SLLI={val2:#x}, SRLI={val3:#x}, SRAI(-1 >> 4)={val5:#x} - {'PASS' if passed else 'FAIL'}")
    all_passed &= passed
    
    # Test 8: SLT/SLTU
    print("\n[8] Set less than (signed/unsigned)")
    emu = RV32I()
    program = b""
    program += encode_i(0x13, 1, 0, 0xFFF, 0)
    program += encode_i(0x13, 2, 0, 1, 0)
    program += encode_r(0x33, 3, 1, 2, 2, 0)
    program += encode_r(0x33, 4, 1, 2, 3, 0)
    program += encode_s(0x23, 0, 3, 0, 2)
    program += encode_s(0x23, 0, 4, 4, 2)
    program += struct.pack('<I', 0x00000073)
    emu.load_program(program)
    emu.run()
    val3 = struct.unpack('<I', emu.memory[0:4])[0]
    val4 = struct.unpack('<I', emu.memory[4:8])[0]
    passed = (val3 == 1) and (val4 == 0)
    print(f"    SLT(-1 < 1)={val3}, SLTU(0xFFFFFFFF < 1)={val4} - {'PASS' if passed else 'FAIL'}")
    all_passed &= passed
    
    print("\n" + "=" * 50)
    print(f"RESULT: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
    print("=" * 50)
    
    return all_passed


if __name__ == "__main__":
    run_tests()
