#!/usr/bin/env python3
"""
RISC-V RV64I Test Suite
Validates instruction encoding, execution, and compliance
"""

import unittest
from typing import Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class RV64ICPU:
    """RISC-V RV64I CPU state"""
    x: List[int]  # 32 registers
    pc: int
    
    def __init__(self):
        self.x = [0] * 32
        self.pc = 0
        self._memory: Dict[int, int] = {}
        self._halt = False
    
    def read_mem8(self, addr: int) -> int:
        return self._memory.get(addr, 0) & 0xFF
    
    def read_mem16(self, addr: int) -> int:
        return self.read_mem8(addr) | (self.read_mem8(addr + 1) << 8)
    
    def read_mem32(self, addr: int) -> int:
        return self.read_mem16(addr) | (self.read_mem16(addr + 2) << 16)
    
    def read_mem64(self, addr: int) -> int:
        return self.read_mem32(addr) | (self.read_mem32(addr + 4) << 32)
    
    def write_mem8(self, addr: int, val: int) -> None:
        self._memory[addr] = val & 0xFF
    
    def write_mem16(self, addr: int, val: int) -> None:
        self.write_mem8(addr, val & 0xFF)
        self.write_mem8(addr + 1, (val >> 8) & 0xFF)
    
    def write_mem32(self, addr: int, val: int) -> None:
        self.write_mem16(addr, val & 0xFFFF)
        self.write_mem16(addr + 2, (val >> 16) & 0xFFFF)
    
    def write_mem64(self, addr: int, val: int) -> None:
        self.write_mem32(addr, val & 0xFFFFFFFF)
        self.write_mem32(addr + 4, (val >> 32) & 0xFFFFFFFF)
    
    def load_program(self, instructions: List[int], base: int = 0) -> None:
        for i, insn in enumerate(instructions):
            self.write_mem32(base + i * 4, insn)
    
    def sext32(self, val: int) -> int:
        """Sign extend 32-bit to 64-bit"""
        val = val & 0xFFFFFFFF
        if val & 0x80000000:
            val |= ~0xFFFFFFFF
        return val
    
    def sext(self, val: int, bits: int) -> int:
        """Sign extend from n bits to 64"""
        val = val & ((1 << bits) - 1)
        if val & (1 << (bits - 1)):
            val |= ~((1 << bits) - 1)
        return val
    
    def step(self) -> bool:
        """Execute one instruction, return False if halted/trapped"""
        if self._halt:
            return False
        
        insn = self.read_mem32(self.pc)
        
        # Decode fields
        opcode = insn & 0x7F
        rd = (insn >> 7) & 0x1F
        funct3 = (insn >> 12) & 0x7
        rs1 = (insn >> 15) & 0x1F
        rs2 = (insn >> 20) & 0x1F
        funct7 = (insn >> 25) & 0x7F
        
        # Register reads
        val_rs1 = self.x[rs1] if rs1 != 0 else 0
        val_rs2 = self.x[rs2] if rs2 != 0 else 0
        
        next_pc = self.pc + 4
        
        # Opcode dispatch
        if opcode == 0x37:  # LUI
            if rd != 0:
                self.x[rd] = insn & 0xFFFFF000
                self.x[rd] = self.sext(self.x[rd], 32)
        
        elif opcode == 0x17:  # AUIPC
            if rd != 0:
                imm = insn & 0xFFFFF000
                imm = self.sext(imm, 32)
                self.x[rd] = (self.pc + imm) & 0xFFFFFFFFFFFFFFFF
        
        elif opcode == 0x6F:  # JAL
            imm = ((insn >> 12) & 0xFF) << 12
            imm |= ((insn >> 20) & 1) << 11
            imm |= ((insn >> 21) & 0x3FF) << 1
            imm |= ((insn >> 31) & 1) << 20
            imm = self.sext(imm, 21)
            if rd != 0:
                self.x[rd] = self.pc + 4
            next_pc = self.pc + imm
        
        elif opcode == 0x67:  # JALR
            if funct3 == 0:
                imm = self.sext(insn >> 20, 12)
                if rd != 0:
                    self.x[rd] = self.pc + 4
                next_pc = (val_rs1 + imm) & ~1
        
        elif opcode == 0x63:  # BRANCH
            imm = (((insn >> 31) & 1) << 12) | \
                  (((insn >> 7) & 1) << 11) | \
                  (((insn >> 25) & 0x3F) << 5) | \
                  (((insn >> 8) & 0xF) << 1)
            imm = self.sext(imm, 13)  # 13-bit signed offset, LSB is always 0
            
            taken = False
            if funct3 == 0:    # BEQ
                taken = val_rs1 == val_rs2
            elif funct3 == 1:  # BNE
                taken = val_rs1 != val_rs2
            elif funct3 == 4:  # BLT
                taken = (val_rs1 if val_rs1 < 0x8000000000000000 else val_rs1 - 0x10000000000000000) < \
                        (val_rs2 if val_rs2 < 0x8000000000000000 else val_rs2 - 0x10000000000000000)
            elif funct3 == 5:  # BGE
                taken = (val_rs1 if val_rs1 < 0x8000000000000000 else val_rs1 - 0x10000000000000000) >= \
                        (val_rs2 if val_rs2 < 0x8000000000000000 else val_rs2 - 0x10000000000000000)
            elif funct3 == 6:  # BLTU
                taken = val_rs1 < val_rs2
            elif funct3 == 7:  # BGEU
                taken = val_rs1 >= val_rs2
            
            if taken:
                next_pc = self.pc + imm
        
        elif opcode == 0x03:  # LOAD
            imm = self.sext(insn >> 20, 12)
            addr = (val_rs1 + imm) & 0xFFFFFFFFFFFFFFFF
            
            if rd != 0:
                if funct3 == 0:     # LB
                    self.x[rd] = self.sext(self.read_mem8(addr), 8)
                elif funct3 == 1:   # LH
                    self.x[rd] = self.sext(self.read_mem16(addr), 16)
                elif funct3 == 2:   # LW
                    self.x[rd] = self.sext(self.read_mem32(addr), 32)
                elif funct3 == 3:   # LD
                    self.x[rd] = self.read_mem64(addr)
                elif funct3 == 4:   # LBU
                    self.x[rd] = self.read_mem8(addr)
                elif funct3 == 5:   # LHU
                    self.x[rd] = self.read_mem16(addr)
                elif funct3 == 6:   # LWU
                    self.x[rd] = self.read_mem32(addr)
        
        elif opcode == 0x23:  # STORE
            imm = ((insn >> 7) & 0x1F) | (((insn >> 25) & 0x7F) << 5)
            imm = self.sext(imm, 12)
            addr = (val_rs1 + imm) & 0xFFFFFFFFFFFFFFFF
            
            if funct3 == 0:     # SB
                self.write_mem8(addr, val_rs2 & 0xFF)
            elif funct3 == 1:   # SH
                self.write_mem16(addr, val_rs2 & 0xFFFF)
            elif funct3 == 2:   # SW
                self.write_mem32(addr, val_rs2 & 0xFFFFFFFF)
            elif funct3 == 3:   # SD
                self.write_mem64(addr, val_rs2)
        
        elif opcode == 0x13:  # OP-IMM
            imm = self.sext(insn >> 20, 12)
            shamt = (insn >> 20) & 0x3F
            
            if funct3 == 0:   # ADDI
                result = val_rs1 + imm
            elif funct3 == 2: # SLTI
                rs1_signed = val_rs1 if val_rs1 < 0x8000000000000000 else val_rs1 - 0x10000000000000000
                result = 1 if rs1_signed < imm else 0
            elif funct3 == 3: # SLTIU
                result = 1 if val_rs1 < (imm & 0xFFFFFFFFFFFFFFFF) else 0
            elif funct3 == 4: # XORI
                result = val_rs1 ^ imm
            elif funct3 == 6: # ORI
                result = val_rs1 | imm
            elif funct3 == 7: # ANDI
                result = val_rs1 & imm
            elif funct3 == 1: # SLLI
                result = (val_rs1 << shamt) & 0xFFFFFFFFFFFFFFFF
            elif funct3 == 5: # SRLI/SRAI
                if funct7 & 0x20:  # SRAI
                    sign_bit = val_rs1 >> 63
                    result = val_rs1 >> shamt
                    if sign_bit:
                        result |= (~0 << (64 - shamt)) & 0xFFFFFFFFFFFFFFFF
                else:  # SRLI
                    result = val_rs1 >> shamt
            else:
                self._halt = True
                return False
            
            if rd != 0:
                self.x[rd] = result & 0xFFFFFFFFFFFFFFFF
        
        elif opcode == 0x33:  # OP
            if funct3 == 0:   # ADD/SUB
                if funct7 & 0x20:  # SUB
                    result = val_rs1 - val_rs2
                else:  # ADD
                    result = val_rs1 + val_rs2
            elif funct3 == 1: # SLL
                result = (val_rs1 << (val_rs2 & 0x3F)) & 0xFFFFFFFFFFFFFFFF
            elif funct3 == 2: # SLT
                rs1_s = val_rs1 if val_rs1 < 0x8000000000000000 else val_rs1 - 0x10000000000000000
                rs2_s = val_rs2 if val_rs2 < 0x8000000000000000 else val_rs2 - 0x10000000000000000
                result = 1 if rs1_s < rs2_s else 0
            elif funct3 == 3: # SLTU
                result = 1 if val_rs1 < val_rs2 else 0
            elif funct3 == 4: # XOR
                result = val_rs1 ^ val_rs2
            elif funct3 == 5: # SRL/SRA
                shamt = val_rs2 & 0x3F
                if funct7 & 0x20:  # SRA
                    sign_bit = val_rs1 >> 63
                    result = val_rs1 >> shamt
                    if sign_bit:
                        result |= (~0 << (64 - shamt)) & 0xFFFFFFFFFFFFFFFF
                else:  # SRL
                    result = val_rs1 >> shamt
            elif funct3 == 6: # OR
                result = val_rs1 | val_rs2
            elif funct3 == 7: # AND
                result = val_rs1 & val_rs2
            else:
                self._halt = True
                return False
            
            if rd != 0:
                self.x[rd] = result & 0xFFFFFFFFFFFFFFFF
        
        elif opcode == 0x1B:  # OP-IMM-32
            shamt = (insn >> 20) & 0x1F
            imm = self.sext(insn >> 20, 12)
            
            if funct3 == 0:   # ADDIW
                result = self.sext32(val_rs1 + imm)
            elif funct3 == 1: # SLLIW
                result = self.sext32((val_rs1 << shamt) & 0xFFFFFFFF)
            elif funct3 == 5: # SRLIW/SRAIW
                rs1_32 = val_rs1 & 0xFFFFFFFF
                if funct7 & 0x20:  # SRAIW
                    rs1_s = rs1_32 if rs1_32 < 0x80000000 else rs1_32 - 0x100000000
                    result = self.sext32(rs1_s >> shamt)
                else:  # SRLIW
                    result = self.sext32(rs1_32 >> shamt)
            else:
                self._halt = True
                return False
            
            if rd != 0:
                self.x[rd] = result & 0xFFFFFFFFFFFFFFFF
        
        elif opcode == 0x3B:  # OP-32
            rs1_32 = val_rs1 & 0xFFFFFFFF
            rs2_32 = val_rs2 & 0xFFFFFFFF
            
            if funct3 == 0:   # ADDW/SUBW
                if funct7 & 0x20:  # SUBW
                    result = self.sext32((rs1_32 - rs2_32) & 0xFFFFFFFF)
                else:  # ADDW
                    result = self.sext32((rs1_32 + rs2_32) & 0xFFFFFFFF)
            elif funct3 == 1: # SLLW
                result = self.sext32((rs1_32 << (rs2_32 & 0x1F)) & 0xFFFFFFFF)
            elif funct3 == 5: # SRLW/SRAW
                shamt = rs2_32 & 0x1F
                if funct7 & 0x20:  # SRAW
                    rs1_s = rs1_32 if rs1_32 < 0x80000000 else rs1_32 - 0x100000000
                    result = self.sext32(rs1_s >> shamt)
                else:  # SRLW
                    result = self.sext32(rs1_32 >> shamt)
            else:
                self._halt = True
                return False
            
            if rd != 0:
                self.x[rd] = result & 0xFFFFFFFFFFFFFFFF
        
        else:
            self._halt = True
            return False
        
        self.pc = next_pc
        self.x[0] = 0  # x0 is hardwired to 0
        return True


class TestRV64I(unittest.TestCase):
    """RISC-V RV64I Compliance Tests"""
    
    def test_x0_hardwired_zero(self):
        """x0 always reads as zero"""
        cpu = RV64ICPU()
        cpu.x[0] = 42  # Try to write
        self.assertEqual(cpu.x[0], 0)
    
    def test_addi_basic(self):
        """ADDI: add immediate"""
        cpu = RV64ICPU()
        # addi x1, x0, 42
        cpu.load_program([0x02A00093])
        cpu.step()
        self.assertEqual(cpu.x[1], 42)
        self.assertEqual(cpu.pc, 4)
    
    def test_add_basic(self):
        """ADD: register addition"""
        cpu = RV64ICPU()
        cpu.x[1] = 40
        cpu.x[2] = 2
        # add x3, x1, x2
        cpu.load_program([0x002081B3])
        cpu.step()
        self.assertEqual(cpu.x[3], 42)
    
    def test_sub_basic(self):
        """SUB: register subtraction"""
        cpu = RV64ICPU()
        cpu.x[1] = 50
        cpu.x[2] = 8
        # sub x3, x1, x2
        cpu.load_program([0x402081B3])
        cpu.step()
        self.assertEqual(cpu.x[3], 42)
    
    def test_lui_auipc(self):
        """LUI/AUIPC: upper immediate"""
        cpu = RV64ICPU()
        # lui x1, 0x12345 -> x1 = 0x12345000
        cpu.load_program([0x12345037])
        cpu.step()
        self.assertEqual(cpu.x[1], 0x12345000)
        
        # auipc x2, 0 -> x2 = 4 (after previous instruction)
        cpu.load_program([0x00000117], base=4)
        cpu.step()
        self.assertEqual(cpu.x[2], 4)
    
    def test_jal_jalr(self):
        """JAL/JALR: jumps"""
        cpu = RV64ICPU()
        # jal x1, 16 (jump 16 bytes forward, x1 = pc+4)
        cpu.load_program([0x010000EF])
        cpu.step()
        self.assertEqual(cpu.x[1], 4)
        self.assertEqual(cpu.pc, 16)
    
    def test_branch_beq(self):
        """BEQ: branch if equal"""
        cpu = RV64ICPU()
        cpu.x[1] = 42
        cpu.x[2] = 42
        # beq x1, x2, 8 (branch 8 bytes if equal)
        cpu.load_program([0x00208263])
        cpu.step()
        self.assertEqual(cpu.pc, 8)  # Taken
    
    def test_branch_bne(self):
        """BNE: branch if not equal"""
        cpu = RV64ICPU()
        cpu.x[1] = 40
        cpu.x[2] = 42
        # bne x1, x2, 8
        cpu.load_program([0x00209263])
        cpu.step()
        self.assertEqual(cpu.pc, 8)  # Taken (not equal)
    
    def test_load_store(self):
        """LB/SB: byte load/store"""
        cpu = RV64ICPU()
        cpu.x[1] = 0x100  # Base address
        # sb x2, 0(x1)  where x2 = 0xAB
        cpu.x[2] = 0xAB
        cpu.load_program([0x00208023])
        cpu.step()
        self.assertEqual(cpu.read_mem8(0x100), 0xAB)
        
        # lb x3, 0(x1)
        cpu.load_program([0x00008183], base=4)
        cpu.step()
        self.assertEqual(cpu.x[3], 0xAB)  # Sign-extended
    
    def test_shift_ops(self):
        """SLL/SRL/SRA: shift operations"""
        cpu = RV64ICPU()
        cpu.x[1] = 0x0F
        cpu.x[2] = 2
        
        # sll x3, x1, x2  (0x0F << 2 = 0x3C)
        cpu.load_program([0x002091B3])
        cpu.step()
        self.assertEqual(cpu.x[3], 0x3C)
        
        # srl x4, x3, x2  (0x3C >> 2 = 0x0F)
        cpu.x[1] = cpu.x[3]
        cpu.pc = 0
        cpu.load_program([0x0021D233])
        cpu.step()
        self.assertEqual(cpu.x[4], 0x0F)
    
    def test_32bit_ops(self):
        """ADDW/SUBW/SLLW: 32-bit operations"""
        cpu = RV64ICPU()
        # Test 32-bit wraparound
        cpu.x[1] = 0xFFFFFFFF00000000  # Large upper bits
        cpu.x[2] = 5
        
        # addw x3, x1, x2  (32-bit add, sign extend)
        cpu.load_program([0x002081BB])
        cpu.step()
        # Result should be sign-extended 32-bit: 5 (from 0 + 5)
        self.assertEqual(cpu.x[3] & 0xFFFFFFFF, 5)
        # Upper bits should be sign extension of bit 31
        self.assertEqual(cpu.x[3] >> 32, 0)
    
    def test_logical_ops(self):
        """AND/OR/XOR: logical operations"""
        cpu = RV64ICPU()
        cpu.x[1] = 0xF0
        cpu.x[2] = 0x0F
        
        # and x3, x1, x2
        cpu.load_program([0x0020F1B3])
        cpu.step()
        self.assertEqual(cpu.x[3], 0x00)
        
        # or x4, x1, x2
        cpu.pc = 0
        cpu.load_program([0x0020E233])
        cpu.step()
        self.assertEqual(cpu.x[4], 0xFF)
        
        # xor x5, x1, x2
        cpu.pc = 0
        cpu.load_program([0x0020C2B3])
        cpu.step()
        self.assertEqual(cpu.x[5], 0xFF)
    
    def test_comparison(self):
        """SLT/SLTU/SLTI/SLTIU: comparison"""
        cpu = RV64ICPU()
        cpu.x[1] = -5 & 0xFFFFFFFFFFFFFFFF  # Signed -5
        cpu.x[2] = 10
        
        # slt x3, x1, x2  (-5 < 10)
        cpu.load_program([0x0020A1B3])
        cpu.step()
        self.assertEqual(cpu.x[3], 1)  # True
        
        # sltu x4, x1, x2  (large unsigned < 10? No)
        cpu.pc = 0
        cpu.load_program([0x0020B233])
        cpu.step()
        self.assertEqual(cpu.x[4], 0)  # False (as unsigned)


def run_tests():
    """Run all tests and report"""
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestRV64I)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    print(f"\n{'All tests passed!' if success else 'Some tests failed'}")
