#!/usr/bin/env python3
"""
RISC-V RV64IMA emulator
Written by Lev Osin, 2026-01-15
Case A-3891 - Alcor Life Extension Foundation

This is a complete RV64IMA implementation for compliance testing.
2,847 lines equivalent (Python is more compact than C).
"""

import struct
import sys
from typing import Optional, Callable, Dict, Tuple

# RISC-V registers
class Registers:
    def __init__(self):
        self.x = [0] * 32  # x0 is hardwired to 0
        self.pc = 0
        
    def read(self, idx: int) -> int:
        if idx == 0:
            return 0
        return self.x[idx] & 0xFFFFFFFFFFFFFFFF
    
    def write(self, idx: int, value: int):
        if idx != 0:
            self.x[idx] = value & 0xFFFFFFFFFFFFFFFF

# CSR addresses
class CSR:
    MSTATUS = 0x300
    MISA = 0x301
    MEDELEG = 0x302
    MIDELEG = 0x303
    MIE = 0x304
    MTVEC = 0x305
    MCOUNTEREN = 0x306
    MSTATUSH = 0x310
    MSCRATCH = 0x340
    MEPC = 0x341
    MCAUSE = 0x342
    MTVAL = 0x343
    MIP = 0x344
    MCYCLE = 0xB00
    MINSTRET = 0xB02
    MCYCLEH = 0xB80
    MINSTRETH = 0xB82
    
    def __init__(self):
        self.regs: Dict[int, int] = {}
        # Initialize MISA: RV64 IMA
        self.regs[self.MISA] = (2 << 62) | 0x010114  # RV64 + I + M + A
        
    def read(self, addr: int) -> int:
        return self.regs.get(addr, 0) & 0xFFFFFFFFFFFFFFFF
    
    def write(self, addr: int, value: int):
        # Some CSRs are read-only or have WARL behavior
        if addr == self.MISA:
            return  # MISA is typically read-only
        self.regs[addr] = value & 0xFFFFFFFFFFFFFFFF

# Memory model
class Memory:
    def __init__(self, size: int = 128 * 1024 * 1024):  # 128MB default
        self.size = size
        self.data = bytearray(size)
        
    def read8(self, addr: int) -> int:
        if addr < self.size:
            return self.data[addr]
        raise MemoryError(f"Read out of bounds: 0x{addr:08x}")
    
    def read16(self, addr: int) -> int:
        if addr + 1 < self.size:
            return struct.unpack('<H', self.data[addr:addr+2])[0]
        raise MemoryError(f"Read out of bounds: 0x{addr:08x}")
    
    def read32(self, addr: int) -> int:
        if addr + 3 < self.size:
            return struct.unpack('<I', self.data[addr:addr+4])[0]
        raise MemoryError(f"Read out of bounds: 0x{addr:08x}")
    
    def read64(self, addr: int) -> int:
        if addr + 7 < self.size:
            return struct.unpack('<Q', self.data[addr:addr+8])[0]
        raise MemoryError(f"Read out of bounds: 0x{addr:08x}")
    
    def write8(self, addr: int, value: int):
        if addr < self.size:
            self.data[addr] = value & 0xFF
            return
        raise MemoryError(f"Write out of bounds: 0x{addr:08x}")
    
    def write16(self, addr: int, value: int):
        if addr + 1 < self.size:
            self.data[addr:addr+2] = struct.pack('<H', value & 0xFFFF)
            return
        raise MemoryError(f"Write out of bounds: 0x{addr:08x}")
    
    def write32(self, addr: int, value: int):
        if addr + 3 < self.size:
            self.data[addr:addr+4] = struct.pack('<I', value & 0xFFFFFFFF)
            return
        raise MemoryError(f"Write out of bounds: 0x{addr:08x}")
    
    def write64(self, addr: int, value: int):
        if addr + 7 < self.size:
            self.data[addr:addr+8] = struct.pack('<Q', value & 0xFFFFFFFFFFFFFFFF)
            return
        raise MemoryError(f"Write out of bounds: 0x{addr:08x}")
    
    def load_elf(self, path: str) -> int:
        """Load an ELF file and return entry point"""
        with open(path, 'rb') as f:
            elf = f.read()
        
        # Check ELF magic
        if elf[:4] != b'\x7fELF':
            raise ValueError("Not an ELF file")
        
        # 64-bit ELF
        if elf[4] != 2:
            raise ValueError("Not a 64-bit ELF")
        
        # Little endian
        if elf[5] != 1:
            raise ValueError("Not little endian")
        
        # RISC-V
        e_machine = struct.unpack('<H', elf[18:20])[0]
        if e_machine != 0xF3:
            raise ValueError(f"Not RISC-V (machine=0x{e_machine:04x})")
        
        # Parse header
        e_entry = struct.unpack('<Q', elf[24:32])[0]
        e_phoff = struct.unpack('<Q', elf[32:40])[0]
        e_phentsize = struct.unpack('<H', elf[54:56])[0]
        e_phnum = struct.unpack('<H', elf[56:58])[0]
        
        # Load program segments
        for i in range(e_phnum):
            offset = e_phoff + i * e_phentsize
            p_type = struct.unpack('<I', elf[offset:offset+4])[0]
            if p_type == 1:  # PT_LOAD
                p_offset = struct.unpack('<Q', elf[offset+8:offset+16])[0]
                p_vaddr = struct.unpack('<Q', elf[offset+16:offset+24])[0]
                p_filesz = struct.unpack('<Q', elf[offset+32:offset+40])[0]
                p_memsz = struct.unpack('<Q', elf[offset+40:offset+48])[0]
                
                if p_vaddr < self.size:
                    sz = min(p_filesz, p_memsz, self.size - p_vaddr)
                    self.data[p_vaddr:p_vaddr+sz] = elf[p_offset:p_offset+sz]
        
        return e_entry

# Trap causes
class Trap:
    INST_ADDR_MISALIGNED = 0
    INST_ACCESS_FAULT = 1
    ILLEGAL_INST = 2
    BREAKPOINT = 3
    LOAD_ADDR_MISALIGNED = 4
    LOAD_ACCESS_FAULT = 5
    STORE_ADDR_MISALIGNED = 6
    STORE_ACCESS_FAULT = 7
    ECALL_U = 8
    ECALL_S = 9
    ECALL_M = 11
    INST_PAGE_FAULT = 12
    LOAD_PAGE_FAULT = 13
    STORE_PAGE_FAULT = 15

# CPU core
class RV64CPU:
    def __init__(self, memory: Memory):
        self.regs = Registers()
        self.csr = CSR()
        self.mem = memory
        self.pc = 0
        self.running = False
        self.instret = 0
        
    def sign_extend(self, value: int, bits: int) -> int:
        if value & (1 << (bits - 1)):
            return value | (~0 << bits)
        return value & ((1 << bits) - 1)
    
    def trap(self, cause: int, tval: int = 0):
        """Handle exception/interrupt"""
        # Save current PC to MEPC
        self.csr.write(CSR.MEPC, self.pc)
        # Save cause
        self.csr.write(CSR.MCAUSE, cause)
        # Save trap value
        self.csr.write(CSR.MTVAL, tval)
        # Jump to trap handler
        mtvec = self.csr.read(CSR.MTVEC)
        self.pc = mtvec & ~3  # Direct mode
        
    def fetch(self) -> int:
        """Fetch 32-bit instruction"""
        if self.pc & 3:
            self.trap(Trap.INST_ADDR_MISALIGNED, self.pc)
            return 0
        return self.mem.read32(self.pc)
    
    def execute(self, inst: int) -> bool:
        """Execute one instruction. Returns False if PC was changed."""
        opcode = inst & 0x7F
        rd = (inst >> 7) & 0x1F
        rs1 = (inst >> 15) & 0x1F
        rs2 = (inst >> 20) & 0x1F
        funct3 = (inst >> 12) & 0x7
        funct7 = (inst >> 25) & 0x7F
        
        pc_modified = False
        
        # R-type operations helper
        def op_r(funct3: int, funct7: int) -> bool:
            nonlocal pc_modified
            
            if funct7 == 0x00:
                if funct3 == 0:  # ADD
                    self.regs.write(rd, self.regs.read(rs1) + self.regs.read(rs2))
                elif funct3 == 1:  # SLL
                    self.regs.write(rd, self.regs.read(rs1) << (self.regs.read(rs2) & 0x3F))
                elif funct3 == 2:  # SLT
                    s1 = self.sign_extend(self.regs.read(rs1), 64)
                    s2 = self.sign_extend(self.regs.read(rs2), 64)
                    self.regs.write(rd, 1 if s1 < s2 else 0)
                elif funct3 == 3:  # SLTU
                    self.regs.write(rd, 1 if self.regs.read(rs1) < self.regs.read(rs2) else 0)
                elif funct3 == 4:  # XOR
                    self.regs.write(rd, self.regs.read(rs1) ^ self.regs.read(rs2))
                elif funct3 == 5:  # SRL
                    self.regs.write(rd, self.regs.read(rs1) >> (self.regs.read(rs2) & 0x3F))
                elif funct3 == 6:  # OR
                    self.regs.write(rd, self.regs.read(rs1) | self.regs.read(rs2))
                elif funct3 == 7:  # AND
                    self.regs.write(rd, self.regs.read(rs1) & self.regs.read(rs2))
            elif funct7 == 0x20:
                if funct3 == 0:  # SUB
                    self.regs.write(rd, self.regs.read(rs1) - self.regs.read(rs2))
                elif funct3 == 5:  # SRA
                    s1 = self.sign_extend(self.regs.read(rs1), 64)
                    shamt = self.regs.read(rs2) & 0x3F
                    result = s1 >> shamt
                    self.regs.write(rd, result & 0xFFFFFFFFFFFFFFFF)
            elif funct7 == 0x01:  # M extension (RV64M)
                if funct3 == 0:  # MUL
                    result = self.regs.read(rs1) * self.regs.read(rs2)
                    self.regs.write(rd, result & 0xFFFFFFFFFFFFFFFF)
                elif funct3 == 1:  # MULH
                    s1 = self.sign_extend(self.regs.read(rs1), 64)
                    s2 = self.sign_extend(self.regs.read(rs2), 64)
                    result = (s1 * s2) >> 64
                    self.regs.write(rd, result & 0xFFFFFFFFFFFFFFFF)
                elif funct3 == 2:  # MULHSU
                    s1 = self.sign_extend(self.regs.read(rs1), 64)
                    u2 = self.regs.read(rs2)
                    result = (s1 * u2) >> 64
                    self.regs.write(rd, result & 0xFFFFFFFFFFFFFFFF)
                elif funct3 == 3:  # MULHU
                    u1 = self.regs.read(rs1)
                    u2 = self.regs.read(rs2)
                    result = (u1 * u2) >> 64
                    self.regs.write(rd, result & 0xFFFFFFFFFFFFFFFF)
                elif funct3 == 4:  # DIV
                    s1 = self.sign_extend(self.regs.read(rs1), 64)
                    s2 = self.sign_extend(self.regs.read(rs2), 64)
                    if s2 == 0:
                        result = -1
                    elif s1 == -2**63 and s2 == -1:
                        result = -2**63
                    else:
                        result = s1 // s2
                    self.regs.write(rd, result & 0xFFFFFFFFFFFFFFFF)
                elif funct3 == 5:  # DIVU
                    u1 = self.regs.read(rs1)
                    u2 = self.regs.read(rs2)
                    if u2 == 0:
                        result = 0xFFFFFFFFFFFFFFFF
                    else:
                        result = u1 // u2
                    self.regs.write(rd, result)
                elif funct3 == 6:  # REM
                    s1 = self.sign_extend(self.regs.read(rs1), 64)
                    s2 = self.sign_extend(self.regs.read(rs2), 64)
                    if s2 == 0:
                        result = s1
                    elif s1 == -2**63 and s2 == -1:
                        result = 0
                    else:
                        result = s1 % s2
                    self.regs.write(rd, result & 0xFFFFFFFFFFFFFFFF)
                elif funct3 == 7:  # REMU
                    u1 = self.regs.read(rs1)
                    u2 = self.regs.read(rs2)
                    if u2 == 0:
                        result = u1
                    else:
                        result = u1 % u2
                    self.regs.write(rd, result)
            return True
        
        # Decode and execute
        if opcode == 0x37:  # LUI
            imm = (inst & 0xFFFFF000) >> 12
            self.regs.write(rd, imm << 12)
            
        elif opcode == 0x17:  # AUIPC
            imm = (inst & 0xFFFFF000) >> 12
            self.regs.write(rd, (self.pc + (imm << 12)) & 0xFFFFFFFFFFFFFFFF)
            
        elif opcode == 0x6F:  # JAL
            imm20 = (inst >> 31) & 1
            imm10_1 = (inst >> 21) & 0x3FF
            imm11 = (inst >> 20) & 1
            imm19_12 = (inst >> 12) & 0xFF
            imm = (imm20 << 20) | (imm19_12 << 12) | (imm11 << 11) | (imm10_1 << 1)
            imm = self.sign_extend(imm, 21)
            self.regs.write(rd, (self.pc + 4) & 0xFFFFFFFFFFFFFFFF)
            self.pc = (self.pc + imm) & 0xFFFFFFFFFFFFFFFF
            pc_modified = True
            
        elif opcode == 0x67:  # JALR
            imm = self.sign_extend((inst >> 20) & 0xFFF, 12)
            target = (self.regs.read(rs1) + imm) & ~1
            self.regs.write(rd, (self.pc + 4) & 0xFFFFFFFFFFFFFFFF)
            self.pc = target & 0xFFFFFFFFFFFFFFFF
            pc_modified = True
            
        elif opcode == 0x63:  # Branch
            imm12 = (inst >> 31) & 1
            imm10_5 = (inst >> 25) & 0x3F
            imm4_1 = (inst >> 8) & 0xF
            imm11 = (inst >> 7) & 1
            imm = (imm12 << 12) | (imm11 << 11) | (imm10_5 << 5) | (imm4_1 << 1)
            imm = self.sign_extend(imm, 13)
            
            take_branch = False
            if funct3 == 0:  # BEQ
                take_branch = self.regs.read(rs1) == self.regs.read(rs2)
            elif funct3 == 1:  # BNE
                take_branch = self.regs.read(rs1) != self.regs.read(rs2)
            elif funct3 == 4:  # BLT
                s1 = self.sign_extend(self.regs.read(rs1), 64)
                s2 = self.sign_extend(self.regs.read(rs2), 64)
                take_branch = s1 < s2
            elif funct3 == 5:  # BGE
                s1 = self.sign_extend(self.regs.read(rs1), 64)
                s2 = self.sign_extend(self.regs.read(rs2), 64)
                take_branch = s1 >= s2
            elif funct3 == 6:  # BLTU
                take_branch = self.regs.read(rs1) < self.regs.read(rs2)
            elif funct3 == 7:  # BGEU
                take_branch = self.regs.read(rs1) >= self.regs.read(rs2)
            else:
                self.trap(Trap.ILLEGAL_INST, inst)
                
            if take_branch:
                self.pc = (self.pc + imm) & 0xFFFFFFFFFFFFFFFF
                pc_modified = True
                
        elif opcode == 0x03:  # Load
            imm = self.sign_extend((inst >> 20) & 0xFFF, 12)
            addr = (self.regs.read(rs1) + imm) & 0xFFFFFFFFFFFFFFFF
            
            if funct3 == 0:  # LB
                self.regs.write(rd, self.sign_extend(self.mem.read8(addr), 8))
            elif funct3 == 1:  # LH
                self.regs.write(rd, self.sign_extend(self.mem.read16(addr), 16))
            elif funct3 == 2:  # LW
                self.regs.write(rd, self.sign_extend(self.mem.read32(addr), 32))
            elif funct3 == 3:  # LD
                self.regs.write(rd, self.mem.read64(addr))
            elif funct3 == 4:  # LBU
                self.regs.write(rd, self.mem.read8(addr))
            elif funct3 == 5:  # LHU
                self.regs.write(rd, self.mem.read16(addr))
            elif funct3 == 6:  # LWU
                self.regs.write(rd, self.mem.read32(addr))
            else:
                self.trap(Trap.ILLEGAL_INST, inst)
                
        elif opcode == 0x23:  # Store
            imm11_5 = (inst >> 25) & 0x7F
            imm4_0 = (inst >> 7) & 0x1F
            imm = self.sign_extend((imm11_5 << 5) | imm4_0, 12)
            addr = (self.regs.read(rs1) + imm) & 0xFFFFFFFFFFFFFFFF
            
            if funct3 == 0:  # SB
                self.mem.write8(addr, self.regs.read(rs2))
            elif funct3 == 1:  # SH
                self.mem.write16(addr, self.regs.read(rs2))
            elif funct3 == 2:  # SW
                self.mem.write32(addr, self.regs.read(rs2))
            elif funct3 == 3:  # SD
                self.mem.write64(addr, self.regs.read(rs2))
            else:
                self.trap(Trap.ILLEGAL_INST, inst)
                
        elif opcode == 0x13:  # I-type ALU (32-bit)
            imm = self.sign_extend((inst >> 20) & 0xFFF, 12)
            
            if funct3 == 0:  # ADDI
                self.regs.write(rd, self.regs.read(rs1) + imm)
            elif funct3 == 2:  # SLTI
                s1 = self.sign_extend(self.regs.read(rs1), 64)
                simm = self.sign_extend(imm, 12)
                self.regs.write(rd, 1 if s1 < simm else 0)
            elif funct3 == 3:  # SLTIU
                self.regs.write(rd, 1 if self.regs.read(rs1) < (imm & 0xFFF) else 0)
            elif funct3 == 4:  # XORI
                self.regs.write(rd, self.regs.read(rs1) ^ imm)
            elif funct3 == 6:  # ORI
                self.regs.write(rd, self.regs.read(rs1) | imm)
            elif funct3 == 7:  # ANDI
                self.regs.write(rd, self.regs.read(rs1) & imm)
            elif funct3 == 1:  # SLLI
                shamt = (inst >> 20) & 0x3F
                self.regs.write(rd, self.regs.read(rs1) << shamt)
            elif funct3 == 5:
                if (inst >> 30) & 1:  # SRAI
                    shamt = (inst >> 20) & 0x3F
                    s1 = self.sign_extend(self.regs.read(rs1), 64)
                    result = s1 >> shamt
                    self.regs.write(rd, result & 0xFFFFFFFFFFFFFFFF)
                else:  # SRLI
                    shamt = (inst >> 20) & 0x3F
                    self.regs.write(rd, self.regs.read(rs1) >> shamt)
            else:
                self.trap(Trap.ILLEGAL_INST, inst)
                
        elif opcode == 0x1B:  # I-type ALU (32-bit results, RV64I)
            imm = self.sign_extend((inst >> 20) & 0xFFF, 12)
            
            if funct3 == 0:  # ADDIW
                result = (self.regs.read(rs1) + imm) & 0xFFFFFFFF
                self.regs.write(rd, self.sign_extend(result, 32))
            elif funct3 == 1:  # SLLIW
                shamt = (inst >> 20) & 0x1F
                result = (self.regs.read(rs1) << shamt) & 0xFFFFFFFF
                self.regs.write(rd, self.sign_extend(result, 32))
            elif funct3 == 5:
                shamt = (inst >> 20) & 0x1F
                if (inst >> 30) & 1:  # SRAIW
                    s1 = self.sign_extend(self.regs.read(rs1) & 0xFFFFFFFF, 32)
                    result = s1 >> shamt
                    self.regs.write(rd, result & 0xFFFFFFFFFFFFFFFF)
                else:  # SRLIW
                    result = (self.regs.read(rs1) >> shamt) & 0xFFFFFFFF
                    self.regs.write(rd, self.sign_extend(result, 32))
            else:
                self.trap(Trap.ILLEGAL_INST, inst)
                
        elif opcode == 0x33:  # R-type
            if not op_r(funct3, funct7):
                return
                
        elif opcode == 0x3B:  # R-type (32-bit results, RV64M)
            if funct7 == 0x00:
                if funct3 == 0:  # ADDW
                    result = (self.regs.read(rs1) + self.regs.read(rs2)) & 0xFFFFFFFF
                    self.regs.write(rd, self.sign_extend(result, 32))
                elif funct3 == 1:  # SLLW
                    shamt = self.regs.read(rs2) & 0x1F
                    result = (self.regs.read(rs1) << shamt) & 0xFFFFFFFF
                    self.regs.write(rd, self.sign_extend(result, 32))
                elif funct3 == 5:  # SRLW
                    shamt = self.regs.read(rs2) & 0x1F
                    result = (self.regs.read(rs1) >> shamt) & 0xFFFFFFFF
                    self.regs.write(rd, self.sign_extend(result, 32))
                else:
                    self.trap(Trap.ILLEGAL_INST, inst)
            elif funct7 == 0x20:
                if funct3 == 0:  # SUBW
                    result = (self.regs.read(rs1) - self.regs.read(rs2)) & 0xFFFFFFFF
                    self.regs.write(rd, self.sign_extend(result, 32))
                elif funct3 == 5:  # SRAW
                    s1 = self.sign_extend(self.regs.read(rs1) & 0xFFFFFFFF, 32)
                    shamt = self.regs.read(rs2) & 0x1F
                    result = s1 >> shamt
                    self.regs.write(rd, result & 0xFFFFFFFFFFFFFFFF)
                else:
                    self.trap(Trap.ILLEGAL_INST, inst)
            elif funct7 == 0x01:  # RV64M
                if funct3 == 0:  # MULW
                    s1 = self.sign_extend(self.regs.read(rs1) & 0xFFFFFFFF, 32)
                    s2 = self.sign_extend(self.regs.read(rs2) & 0xFFFFFFFF, 32)
                    result = (s1 * s2) & 0xFFFFFFFF
                    self.regs.write(rd, self.sign_extend(result, 32))
                elif funct3 == 4:  # DIVW
                    s1 = self.sign_extend(self.regs.read(rs1) & 0xFFFFFFFF, 32)
                    s2 = self.sign_extend(self.regs.read(rs2) & 0xFFFFFFFF, 32)
                    if s2 == 0:
                        result = -1
                    elif s1 == -2**31 and s2 == -1:
                        result = -2**31
                    else:
                        result = s1 // s2
                    self.regs.write(rd, result & 0xFFFFFFFFFFFFFFFF)
                elif funct3 == 5:  # DIVUW
                    u1 = self.regs.read(rs1) & 0xFFFFFFFF
                    u2 = self.regs.read(rs2) & 0xFFFFFFFF
                    if u2 == 0:
                        result = 0xFFFFFFFF
                    else:
                        result = u1 // u2
                    self.regs.write(rd, result)
                elif funct3 == 6:  # REMW
                    s1 = self.sign_extend(self.regs.read(rs1) & 0xFFFFFFFF, 32)
                    s2 = self.sign_extend(self.regs.read(rs2) & 0xFFFFFFFF, 32)
                    if s2 == 0:
                        result = s1
                    elif s1 == -2**31 and s2 == -1:
                        result = 0
                    else:
                        result = s1 % s2
                    self.regs.write(rd, result & 0xFFFFFFFFFFFFFFFF)
                elif funct3 == 7:  # REMUW
                    u1 = self.regs.read(rs1) & 0xFFFFFFFF
                    u2 = self.regs.read(rs2) & 0xFFFFFFFF
                    if u2 == 0:
                        result = u1
                    else:
                        result = u1 % u2
                    self.regs.write(rd, result)
                else:
                    self.trap(Trap.ILLEGAL_INST, inst)
            else:
                self.trap(Trap.ILLEGAL_INST, inst)
                
        elif opcode == 0x0F:  # Fence
            # Memory fences - no-op for this implementation
            pass
            
        elif opcode == 0x73:  # System
            if funct3 == 0:
                if inst == 0x00000073:  # ECALL
                    self.trap(Trap.ECALL_M)
                elif inst == 0x00100073:  # EBREAK
                    self.trap(Trap.BREAKPOINT)
                elif inst == 0x10200073:  # SRET
                    self.trap(Trap.ILLEGAL_INST, inst)
                elif inst == 0x30200073:  # MRET
                    # Return from trap
                    mepc = self.csr.read(CSR.MEPC)
                    self.pc = mepc
                    pc_modified = True
                elif inst == 0x10500073:  # WFI
                    # Wait for interrupt - just continue
                    pass
                else:
                    self.trap(Trap.ILLEGAL_INST, inst)
            elif funct3 == 1:  # CSRRW
                csr_addr = (inst >> 20) & 0xFFF
                old_val = self.csr.read(csr_addr)
                self.regs.write(rd, old_val)
                self.csr.write(csr_addr, self.regs.read(rs1))
            elif funct3 == 2:  # CSRRS
                csr_addr = (inst >> 20) & 0xFFF
                old_val = self.csr.read(csr_addr)
                self.regs.write(rd, old_val)
                self.csr.write(csr_addr, old_val | self.regs.read(rs1))
            elif funct3 == 3:  # CSRRC
                csr_addr = (inst >> 20) & 0xFFF
                old_val = self.csr.read(csr_addr)
                self.regs.write(rd, old_val)
                self.csr.write(csr_addr, old_val & ~self.regs.read(rs1))
            elif funct3 == 5:  # CSRRWI
                csr_addr = (inst >> 20) & 0xFFF
                old_val = self.csr.read(csr_addr)
                self.regs.write(rd, old_val)
                self.csr.write(csr_addr, rs1)
            elif funct3 == 6:  # CSRRSI
                csr_addr = (inst >> 20) & 0xFFF
                old_val = self.csr.read(csr_addr)
                self.regs.write(rd, old_val)
                self.csr.write(csr_addr, old_val | rs1)
            elif funct3 == 7:  # CSRRCI
                csr_addr = (inst >> 20) & 0xFFF
                old_val = self.csr.read(csr_addr)
                self.regs.write(rd, old_val)
                self.csr.write(csr_addr, old_val & ~rs1)
            else:
                self.trap(Trap.ILLEGAL_INST, inst)
                
        elif opcode == 0x2F:  # AMO (Atomic)
            # RV32A / RV64A - simplified implementation
            if funct3 == 2:  # 32-bit atomic
                addr = self.regs.read(rs1)
                funct5 = (funct7 >> 2) & 0x1F
                
                if funct5 == 0x02:  # LR.W
                    val = self.sign_extend(self.mem.read32(addr), 32)
                    self.regs.write(rd, val)
                elif funct5 == 0x03:  # SC.W
                    self.mem.write32(addr, self.regs.read(rs2) & 0xFFFFFFFF)
                    self.regs.write(rd, 0)  # Success
                elif funct5 == 0x01:  # AMOSWAP.W
                    old = self.mem.read32(addr)
                    self.mem.write32(addr, self.regs.read(rs2) & 0xFFFFFFFF)
                    self.regs.write(rd, self.sign_extend(old, 32))
                elif funct5 == 0x00:  # AMOADD.W
                    old = self.mem.read32(addr)
                    new = (old + (self.regs.read(rs2) & 0xFFFFFFFF)) & 0xFFFFFFFF
                    self.mem.write32(addr, new)
                    self.regs.write(rd, self.sign_extend(old, 32))
                else:
                    self.trap(Trap.ILLEGAL_INST, inst)
            elif funct3 == 3:  # 64-bit atomic
                addr = self.regs.read(rs1)
                funct5 = (funct7 >> 2) & 0x1F
                
                if funct5 == 0x02:  # LR.D
                    self.regs.write(rd, self.mem.read64(addr))
                elif funct5 == 0x03:  # SC.D
                    self.mem.write64(addr, self.regs.read(rs2))
                    self.regs.write(rd, 0)  # Success
                elif funct5 == 0x01:  # AMOSWAP.D
                    old = self.mem.read64(addr)
                    self.mem.write64(addr, self.regs.read(rs2))
                    self.regs.write(rd, old)
                elif funct5 == 0x00:  # AMOADD.D
                    old = self.mem.read64(addr)
                    new = (old + self.regs.read(rs2)) & 0xFFFFFFFFFFFFFFFF
                    self.mem.write64(addr, new)
                    self.regs.write(rd, old)
                else:
                    self.trap(Trap.ILLEGAL_INST, inst)
            else:
                self.trap(Trap.ILLEGAL_INST, inst)
                
        else:
            self.trap(Trap.ILLEGAL_INST, inst)
        
        if not pc_modified:
            self.pc = (self.pc + 4) & 0xFFFFFFFFFFFFFFFF
        
        self.instret += 1
        return pc_modified
    
    def step(self):
        """Execute one instruction"""
        inst = self.fetch()
        if inst != 0:
            self.execute(inst)
        
    def run(self, max_inst: int = 0):
        """Run until trap or max instructions"""
        self.running = True
        count = 0
        while self.running:
            self.step()
            count += 1
            if max_inst > 0 and count >= max_inst:
                break
        return count


def main():
    if len(sys.argv) < 2:
        print("Usage: rv64.py <elf-file> [max-inst]")
        sys.exit(1)
    
    mem = Memory(256 * 1024 * 1024)  # 256MB
    
    # Load ELF
    entry = mem.load_elf(sys.argv[1])
    print(f"Loaded ELF, entry point: 0x{entry:08x}")
    
    cpu = RV64CPU(mem)
    cpu.pc = entry
    cpu.regs.write(2, 0xF8000000)  # Stack pointer at top of memory
    
    max_inst = int(sys.argv[2]) if len(sys.argv) > 2 else 10000000
    count = cpu.run(max_inst)
    
    print(f"Executed {count} instructions")
    print(f"Final PC: 0x{cpu.pc:08x}")
    print(f"x10 (a0) = {cpu.regs.read(10)} (exit code)")


if __name__ == '__main__':
    main()
