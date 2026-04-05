#!/usr/bin/env python3
"""
RISC-V RV64IMA Emulator
Lev Osin - Alcor facility, Scottsdale
Target: Pass RISC-V compliance tests

Architecture: 64-bit RISC-V with M (multiply/divide) and A (atomic) extensions
Memory: 128MB starting at 0x80000000 (typical DTB location)
"""

import struct
from enum import IntEnum
from typing import Optional, Callable

class Opcode(IntEnum):
    LOAD = 0x03
    LOAD_FP = 0x07
    MISC_MEM = 0x0F
    OP_IMM = 0x13
    AUIPC = 0x17
    OP_IMM_32 = 0x1B
    STORE = 0x23
    STORE_FP = 0x27
    AMO = 0x2F
    OP = 0x33
    LUI = 0x37
    OP_32 = 0x3B
    BRANCH = 0x63
    JALR = 0x67
    JAL = 0x6F
    SYSTEM = 0x73

class Funct3(IntEnum):
    # Loads
    LB = 0x0
    LH = 0x1
    LW = 0x2
    LD = 0x3
    LBU = 0x4
    LHU = 0x5
    LWU = 0x6
    # Stores
    SB = 0x0
    SH = 0x1
    SW = 0x2
    SD = 0x3
    # Branches
    BEQ = 0x0
    BNE = 0x1
    BLT = 0x4
    BGE = 0x5
    BLTU = 0x6
    BGEU = 0x7
    # ALU
    ADD_SUB = 0x0
    SLL = 0x1
    SLT = 0x2
    SLTU = 0x3
    XOR = 0x4
    SRL_SRA = 0x5
    OR = 0x6
    AND = 0x7

class CSR(IntEnum):
    FFLAGS = 0x001
    FRM = 0x002
    FCSR = 0x003
    CYCLE = 0xC00
    TIME = 0xC01
    INSTRET = 0xC02
    CYCLEH = 0xC80
    TIMEH = 0xC81
    INSTRETH = 0xC82
    MVENDORID = 0xF11
    MARCHID = 0xF12
    MIMPID = 0xF13
    MHARTID = 0xF14
    MSTATUS = 0x300
    MISA = 0x301
    MEDELEG = 0x302
    MIDELEG = 0x303
    MIE = 0x304
    MTVEC = 0x305
    MCOUNTEREN = 0x306
    MSCRATCH = 0x340
    MEPC = 0x341
    MCAUSE = 0x342
    MTVAL = 0x343
    MIP = 0x344

class RISCVEmu:
    def __init__(self, mem_size: int = 128 * 1024 * 1024):
        # 32 registers (x0 is hardwired to 0)
        self.regs = [0] * 32
        self.pc = 0x80000000  # Default entry point
        
        # Memory - byte array
        self.memory = bytearray(mem_size)
        self.mem_base = 0x80000000
        
        # CSRs
        self.csrs = {}
        
        # Privilege mode (M=3, S=1, U=0)
        self.priv = 3  # Start in machine mode
        
        # Execution state
        self.running = False
        self.instruction_count = 0
        
        # Tohost/fromhost for riscv-tests
        self.tohost = 0
        self.fromhost = 0
    
    def read_mem(self, addr: int, size: int) -> int:
        """Read size bytes from memory, little-endian."""
        offset = addr - self.mem_base
        if offset < 0 or offset + size > len(self.memory):
            raise MemoryError(f"Memory access out of bounds: 0x{addr:08x}")
        
        value = 0
        for i in range(size):
            value |= self.memory[offset + i] << (8 * i)
        return value
    
    def write_mem(self, addr: int, size: int, value: int) -> None:
        """Write size bytes to memory, little-endian."""
        offset = addr - self.mem_base
        if offset < 0 or offset + size > len(self.memory):
            raise MemoryError(f"Memory access out of bounds: 0x{addr:08x}")
        
        for i in range(size):
            self.memory[offset + i] = (value >> (8 * i)) & 0xFF
    
    def read_csr(self, csr: int) -> int:
        """Read CSR value."""
        if csr == CSR.MVENDORID:
            return 0  # Non-commercial
        elif csr == CSR.MARCHID:
            return 0  # No open-source ID yet
        elif csr == CSR.MIMPID:
            return 0
        elif csr == CSR.MHARTID:
            return 0  # Single hart
        elif csr == CSR.MISA:
            # RV64IMA: I=bit 8, M=bit 12, A=bit 0 (shifted)
            # misa[62:0] encodes extensions
            return (2 << 62) | 0x0101  # 64-bit, I + M + A
        elif csr in (CSR.CYCLE, CSR.TIME, CSR.INSTRET):
            return self.instruction_count & 0xFFFFFFFF
        elif csr in (CSR.CYCLEH, CSR.TIMEH, CSR.INSTRETH):
            return (self.instruction_count >> 32) & 0xFFFFFFFF
        else:
            return self.csrs.get(csr, 0)
    
    def write_csr(self, csr: int, value: int) -> None:
        """Write CSR value."""
        if csr == CSR.MTOHOST:
            self.tohost = value
        elif csr == CSR.MFROMHOST:
            self.fromhost = value
        else:
            self.csrs[csr] = value & 0xFFFFFFFFFFFFFFFF
    
    def step(self) -> bool:
        """Execute one instruction. Returns False on ebreak/ecall or halt."""
        try:
            instr = self.read_mem(self.pc, 4)
        except MemoryError:
            raise Exception(f"PC out of bounds: 0x{self.pc:016x}")
        
        opcode = instr & 0x7F
        rd = (instr >> 7) & 0x1F
        rs1 = (instr >> 15) & 0x1F
        rs2 = (instr >> 20) & 0x1F
        funct3 = (instr >> 12) & 0x7
        funct7 = (instr >> 25) & 0x7F
        funct6 = (instr >> 26) & 0x3F
        
        # Sign extension helpers
        def sext12(val: int) -> int:
            return val if val < 2048 else val - 4096
        
        def sext13(val: int) -> int:
            return val if val < 4096 else val - 8192
        
        def sext21(val: int) -> int:
            return val if val < 1048576 else val - 2097152
        
        def sext32(val: int) -> int:
            return val if val < 2147483648 else val - 4294967296
        
        # 32-bit operation result handling
        def result32(val: int) -> int:
            return sext32(val & 0xFFFFFFFF)
        
        # Execute
        if opcode == Opcode.OP_IMM:
            # I-type
            imm = sext12(instr >> 20)
            
            if funct3 == Funct3.ADD_SUB:  # ADDI
                result = (self.regs[rs1] + imm) & 0xFFFFFFFFFFFFFFFF
            elif funct3 == Funct3.SLT:  # SLTI
                result = 1 if (self.regs[rs1] & 0xFFFFFFFFFFFFFFFF) < (imm & 0xFFFFFFFFFFFFFFFF) else 0
            elif funct3 == Funct3.SLTU:  # SLTIU
                result = 1 if (self.regs[rs1] & 0xFFFFFFFFFFFFFFFF) < (imm & 0xFFFFFFFFFFFFFFFF) else 0
            elif funct3 == Funct3.XOR:  # XORI
                result = self.regs[rs1] ^ imm
            elif funct3 == Funct3.OR:  # ORI
                result = self.regs[rs1] | imm
            elif funct3 == Funct3.AND:  # ANDI
                result = self.regs[rs1] & imm
            elif funct3 == Funct3.SLL:  # SLLI
                shamt = (instr >> 20) & 0x3F
                result = (self.regs[rs1] << shamt) & 0xFFFFFFFFFFFFFFFF
            elif funct3 == Funct3.SRL_SRA:
                shamt = (instr >> 20) & 0x3F
                if funct6 == 0x10:  # SRAI
                    # Arithmetic right shift - sign extend
                    val = self.regs[rs1]
                    sign = val >> 63
                    result = (val >> shamt) | ((sign * ((1 << shamt) - 1)) << (64 - shamt))
                    result &= 0xFFFFFFFFFFFFFFFF
                else:  # SRLI
                    result = (self.regs[rs1] & 0xFFFFFFFFFFFFFFFF) >> shamt
            else:
                raise Exception(f"Unknown OP_IMM funct3: {funct3}")
            
            self.regs[rd] = result
            self.pc += 4
            
        elif opcode == Opcode.OP_IMM_32:
            # 32-bit I-type
            imm = sext12(instr >> 20)
            
            if funct3 == Funct3.ADD_SUB:  # ADDIW
                result = result32(self.regs[rs1] + imm)
            elif funct3 == Funct3.SLL:  # SLLIW
                shamt = (instr >> 20) & 0x1F
                result = result32(self.regs[rs1] << shamt)
            elif funct3 == Funct3.SRL_SRA:
                shamt = (instr >> 20) & 0x1F
                val32 = self.regs[rs1] & 0xFFFFFFFF
                if funct7 == 0x20:  # SRAIW
                    sign = val32 >> 31
                    result = (val32 >> shamt) | ((sign * ((1 << shamt) - 1)) << (32 - shamt))
                    result = sext32(result & 0xFFFFFFFF)
                else:  # SRLIW
                    result = sext32(val32 >> shamt)
            else:
                raise Exception(f"Unknown OP_IMM_32 funct3: {funct3}")
            
            self.regs[rd] = result
            self.pc += 4
            
        elif opcode == Opcode.LUI:
            # U-type
            imm = ((instr >> 12) & 0xFFFFF) << 12
            if imm >= 0x80000000:  # Sign extend from bit 31
                imm -= 0x100000000
            self.regs[rd] = (imm << 32) >> 32  # Proper sign extension to 64 bits
            self.pc += 4
            
        elif opcode == Opcode.AUIPC:
            # U-type
            imm = ((instr >> 12) & 0xFFFFF) << 12
            if imm >= 0x80000000:
                imm -= 0x100000000
            result = self.pc + ((imm << 32) >> 32)
            self.regs[rd] = result & 0xFFFFFFFFFFFFFFFF
            self.pc += 4
            
        elif opcode == Opcode.OP:
            # R-type
            rs1_val = self.regs[rs1] & 0xFFFFFFFFFFFFFFFF
            rs2_val = self.regs[rs2] & 0xFFFFFFFFFFFFFFFF
            
            if funct7 == 0x00:
                if funct3 == Funct3.ADD_SUB:
                    result = (rs1_val + rs2_val) & 0xFFFFFFFFFFFFFFFF
                elif funct3 == Funct3.SLL:
                    result = (rs1_val << (rs2_val & 0x3F)) & 0xFFFFFFFFFFFFFFFF
                elif funct3 == Funct3.SLT:
                    # Signed comparison
                    s1 = rs1_val if rs1_val < 0x8000000000000000 else rs1_val - 0x10000000000000000
                    s2 = rs2_val if rs2_val < 0x8000000000000000 else rs2_val - 0x10000000000000000
                    result = 1 if s1 < s2 else 0
                elif funct3 == Funct3.SLTU:
                    result = 1 if rs1_val < rs2_val else 0
                elif funct3 == Funct3.XOR:
                    result = rs1_val ^ rs2_val
                elif funct3 == Funct3.SRL_SRA:
                    result = rs1_val >> (rs2_val & 0x3F)
                elif funct3 == Funct3.OR:
                    result = rs1_val | rs2_val
                elif funct3 == Funct3.AND:
                    result = rs1_val & rs2_val
                else:
                    raise Exception(f"Unknown OP funct3: {funct3}")
            elif funct7 == 0x20:
                if funct3 == Funct3.ADD_SUB:  # SUB
                    result = (rs1_val - rs2_val) & 0xFFFFFFFFFFFFFFFF
                elif funct3 == Funct3.SRL_SRA:  # SRA
                    shamt = rs2_val & 0x3F
                    sign = rs1_val >> 63
                    result = (rs1_val >> shamt) | ((sign * ((1 << shamt) - 1)) << (64 - shamt))
                    result &= 0xFFFFFFFFFFFFFFFF
                else:
                    raise Exception(f"Unknown OP funct3 with funct7=0x20: {funct3}")
            elif funct7 == 0x01:  # M extension
                if funct3 == 0x0:  # MUL
                    result = ((rs1_val * rs2_val) & 0xFFFFFFFFFFFFFFFF)
                elif funct3 == 0x1:  # MULH
                    # Signed high multiply
                    s1 = rs1_val if rs1_val < 0x8000000000000000 else rs1_val - 0x10000000000000000
                    s2 = rs2_val if rs2_val < 0x8000000000000000 else rs2_val - 0x10000000000000000
                    result = ((s1 * s2) >> 64) & 0xFFFFFFFFFFFFFFFF
                elif funct3 == 0x2:  # MULHSU
                    s1 = rs1_val if rs1_val < 0x8000000000000000 else rs1_val - 0x10000000000000000
                    result = ((s1 * rs2_val) >> 64) & 0xFFFFFFFFFFFFFFFF
                elif funct3 == 0x3:  # MULHU
                    result = ((rs1_val * rs2_val) >> 64) & 0xFFFFFFFFFFFFFFFF
                elif funct3 == 0x4:  # DIV
                    s1 = rs1_val if rs1_val < 0x8000000000000000 else rs1_val - 0x10000000000000000
                    s2 = rs2_val if rs2_val < 0x8000000000000000 else rs2_val - 0x10000000000000000
                    if s2 == 0:
                        result = 0xFFFFFFFFFFFFFFFF
                    elif s1 == -0x8000000000000000 and s2 == -1:
                        result = -0x8000000000000000
                    else:
                        result = (s1 // s2) & 0xFFFFFFFFFFFFFFFF
                elif funct3 == 0x5:  # DIVU
                    if rs2_val == 0:
                        result = 0xFFFFFFFFFFFFFFFF
                    else:
                        result = (rs1_val // rs2_val) & 0xFFFFFFFFFFFFFFFF
                elif funct3 == 0x6:  # REM
                    s1 = rs1_val if rs1_val < 0x8000000000000000 else rs1_val - 0x10000000000000000
                    s2 = rs2_val if rs2_val < 0x8000000000000000 else rs2_val - 0x10000000000000000
                    if s2 == 0:
                        result = s1 & 0xFFFFFFFFFFFFFFFF
                    elif s1 == -0x8000000000000000 and s2 == -1:
                        result = 0
                    else:
                        result = (s1 % s2) & 0xFFFFFFFFFFFFFFFF
                elif funct3 == 0x7:  # REMU
                    if rs2_val == 0:
                        result = rs1_val
                    else:
                        result = (rs1_val % rs2_val) & 0xFFFFFFFFFFFFFFFF
                else:
                    raise Exception(f"Unknown M-extension funct3: {funct3}")
            else:
                raise Exception(f"Unknown OP funct7: {funct7}")
            
            self.regs[rd] = result
            self.pc += 4
            
        elif opcode == Opcode.OP_32:
            # 32-bit R-type
            rs1_val = self.regs[rs1] & 0xFFFFFFFF
            rs2_val = self.regs[rs2] & 0xFFFFFFFF
            
            if funct7 == 0x00:
                if funct3 == Funct3.ADD_SUB:
                    result = result32(rs1_val + rs2_val)
                elif funct3 == Funct3.SLL:
                    result = result32(rs1_val << (rs2_val & 0x1F))
                elif funct3 == Funct3.SRL_SRA:
                    result = result32(rs1_val >> (rs2_val & 0x1F))
                else:
                    raise Exception(f"Unknown OP_32 funct3: {funct3}")
            elif funct7 == 0x20:
                if funct3 == Funct3.ADD_SUB:
                    result = result32(rs1_val - rs2_val)
                elif funct3 == Funct3.SRL_SRA:
                    shamt = rs2_val & 0x1F
                    sign = rs1_val >> 31
                    result = (rs1_val >> shamt) | ((sign * ((1 << shamt) - 1)) << (32 - shamt))
                    result = sext32(result & 0xFFFFFFFF)
                else:
                    raise Exception(f"Unknown OP_32 funct3 with funct7=0x20: {funct3}")
            elif funct7 == 0x01:  # M extension 32-bit
                if funct3 == 0x0:  # MULW
                    result = result32((rs1_val * rs2_val) & 0xFFFFFFFF)
                elif funct3 == 0x4:  # DIVW
                    s1 = sext32(rs1_val)
                    s2 = sext32(rs2_val)
                    if s2 == 0:
                        result = 0xFFFFFFFFFFFFFFFF
                    elif s1 == -0x80000000 and s2 == -1:
                        result = -0x80000000
                    else:
                        result = result32(s1 // s2)
                elif funct3 == 0x5:  # DIVUW
                    if rs2_val == 0:
                        result = 0xFFFFFFFFFFFFFFFF
                    else:
                        result = result32(rs1_val // rs2_val)
                elif funct3 == 0x6:  # REMW
                    s1 = sext32(rs1_val)
                    s2 = sext32(rs2_val)
                    if s2 == 0:
                        result = sext32(s1)
                    elif s1 == -0x80000000 and s2 == -1:
                        result = 0
                    else:
                        result = result32(s1 % s2)
                elif funct3 == 0x7:  # REMUW
                    if rs2_val == 0:
                        result = rs1_val
                    else:
                        result = result32(rs1_val % rs2_val)
                else:
                    raise Exception(f"Unknown OP_32 M-extension funct3: {funct3}")
            else:
                raise Exception(f"Unknown OP_32 funct7: {funct7}")
            
            self.regs[rd] = result
            self.pc += 4
            
        elif opcode == Opcode.BRANCH:
            # B-type
            imm_4_1 = (instr >> 7) & 0x1E
            imm_10_5 = (instr >> 25) & 0x3F
            imm_11 = (instr >> 7) & 0x1
            imm_12 = (instr >> 31) & 0x1
            
            imm = (imm_4_1 >> 1) | (imm_10_5 << 4) | (imm_11 << 10) | (imm_12 << 11)
            imm = sext13(imm) << 1
            
            rs1_val = self.regs[rs1] & 0xFFFFFFFFFFFFFFFF
            rs2_val = self.regs[rs2] & 0xFFFFFFFFFFFFFFFF
            
            s1 = rs1_val if rs1_val < 0x8000000000000000 else rs1_val - 0x10000000000000000
            s2 = rs2_val if rs2_val < 0x8000000000000000 else rs2_val - 0x10000000000000000
            
            take_branch = False
            if funct3 == Funct3.BEQ:
                take_branch = rs1_val == rs2_val
            elif funct3 == Funct3.BNE:
                take_branch = rs1_val != rs2_val
            elif funct3 == Funct3.BLT:
                take_branch = s1 < s2
            elif funct3 == Funct3.BGE:
                take_branch = s1 >= s2
            elif funct3 == Funct3.BLTU:
                take_branch = rs1_val < rs2_val
            elif funct3 == Funct3.BGEU:
                take_branch = rs1_val >= rs2_val
            else:
                raise Exception(f"Unknown BRANCH funct3: {funct3}")
            
            if take_branch:
                self.pc = (self.pc + imm) & 0xFFFFFFFFFFFFFFFF
            else:
                self.pc += 4
                
        elif opcode == Opcode.JAL:
            # J-type
            imm_19_12 = (instr >> 12) & 0xFF
            imm_11 = (instr >> 20) & 0x1
            imm_10_1 = (instr >> 21) & 0x3FF
            imm_20 = (instr >> 31) & 0x1
            
            imm = (imm_10_1 << 1) | (imm_11 << 11) | (imm_19_12 << 12) | (imm_20 << 20)
            imm = sext21(imm) << 1
            
            self.regs[rd] = (self.pc + 4) & 0xFFFFFFFFFFFFFFFF
            self.pc = (self.pc + imm) & 0xFFFFFFFFFFFFFFFF
            
        elif opcode == Opcode.JALR:
            # I-type
            imm = sext12(instr >> 20)
            
            target = (self.regs[rs1] + imm) & ~1  # Clear LSB
            self.regs[rd] = (self.pc + 4) & 0xFFFFFFFFFFFFFFFF
            self.pc = target & 0xFFFFFFFFFFFFFFFF
            
        elif opcode == Opcode.LOAD:
            # I-type
            imm = sext12(instr >> 20)
            addr = (self.regs[rs1] + imm) & 0xFFFFFFFFFFFFFFFF
            
            if funct3 == Funct3.LB:
                val = self.read_mem(addr, 1)
                if val >= 0x80:
                    val |= 0xFFFFFFFFFFFFFF00
                self.regs[rd] = val
            elif funct3 == Funct3.LH:
                val = self.read_mem(addr, 2)
                if val >= 0x8000:
                    val |= 0xFFFFFFFFFFFF0000
                self.regs[rd] = val
            elif funct3 == Funct3.LW:
                val = self.read_mem(addr, 4)
                if val >= 0x80000000:
                    val |= 0xFFFFFFFF00000000
                self.regs[rd] = val
            elif funct3 == Funct3.LD:
                self.regs[rd] = self.read_mem(addr, 8)
            elif funct3 == Funct3.LBU:
                self.regs[rd] = self.read_mem(addr, 1)
            elif funct3 == Funct3.LHU:
                self.regs[rd] = self.read_mem(addr, 2)
            elif funct3 == Funct3.LWU:
                self.regs[rd] = self.read_mem(addr, 4)
            else:
                raise Exception(f"Unknown LOAD funct3: {funct3}")
            
            self.pc += 4
            
        elif opcode == Opcode.STORE:
            # S-type
            imm_4_0 = (instr >> 7) & 0x1F
            imm_11_5 = (instr >> 25) & 0x7F
            imm = sext12((imm_11_5 << 5) | imm_4_0)
            
            addr = (self.regs[rs1] + imm) & 0xFFFFFFFFFFFFFFFF
            
            if funct3 == Funct3.SB:
                self.write_mem(addr, 1, self.regs[rs2] & 0xFF)
            elif funct3 == Funct3.SH:
                self.write_mem(addr, 2, self.regs[rs2] & 0xFFFF)
            elif funct3 == Funct3.SW:
                self.write_mem(addr, 4, self.regs[rs2] & 0xFFFFFFFF)
            elif funct3 == Funct3.SD:
                self.write_mem(addr, 8, self.regs[rs2] & 0xFFFFFFFFFFFFFFFF)
            else:
                raise Exception(f"Unknown STORE funct3: {funct3}")
            
            self.pc += 4
            
        elif opcode == Opcode.SYSTEM:
            if funct3 == 0x0:
                if instr == 0x00000073:  # ECALL
                    if self.tohost != 0:
                        # riscv-tests termination protocol
                        if self.tohost & 1:
                            # Test passed
                            return False
                        else:
                            # Test failed
                            return False
                    # Otherwise, environment call not implemented
                    raise Exception(f"ECALL not implemented (a7={self.regs[17]})")
                elif instr == 0x00100073:  # EBREAK
                    return False  # Halt on EBREAK
                else:
                    raise Exception(f"Unknown SYSTEM funct3=0 instruction: 0x{instr:08x}")
            elif funct3 == 0x1:  # CSRRW
                csr = (instr >> 20) & 0xFFF
                old_val = self.read_csr(csr)
                self.write_csr(csr, self.regs[rs1])
                self.regs[rd] = old_val
                self.pc += 4
            elif funct3 == 0x2:  # CSRRS
                csr = (instr >> 20) & 0xFFF
                old_val = self.read_csr(csr)
                self.write_csr(csr, old_val | self.regs[rs1])
                self.regs[rd] = old_val
                self.pc += 4
            elif funct3 == 0x3:  # CSRRC
                csr = (instr >> 20) & 0xFFF
                old_val = self.read_csr(csr)
                self.write_csr(csr, old_val & ~self.regs[rs1])
                self.regs[rd] = old_val
                self.pc += 4
            elif funct3 == 0x5:  # CSRRWI
                csr = (instr >> 20) & 0xFFF
                old_val = self.read_csr(csr)
                zimm = rs1
                self.write_csr(csr, zimm)
                self.regs[rd] = old_val
                self.pc += 4
            elif funct3 == 0x6:  # CSRRSI
                csr = (instr >> 20) & 0xFFF
                old_val = self.read_csr(csr)
                zimm = rs1
                self.write_csr(csr, old_val | zimm)
                self.regs[rd] = old_val
                self.pc += 4
            elif funct3 == 0x7:  # CSRRCI
                csr = (instr >> 20) & 0xFFF
                old_val = self.read_csr(csr)
                zimm = rs1
                self.write_csr(csr, old_val & ~zimm)
                self.regs[rd] = old_val
                self.pc += 4
            else:
                raise Exception(f"Unknown SYSTEM funct3: {funct3}")
        
        elif opcode == Opcode.MISC_MEM:
            # FENCE - just a NOP for this single-threaded emulator
            self.pc += 4
            
        else:
            raise Exception(f"Unknown opcode: 0x{opcode:02x} at PC=0x{self.pc:08x}")
        
        # x0 is always 0
        self.regs[0] = 0
        
        self.instruction_count += 1
        return True
    
    def load_elf(self, data: bytes) -> None:
        """Load an ELF file into memory."""
        # Minimal ELF64 loader
        if len(data) < 64:
            raise Exception("File too small for ELF header")
        
        # Check magic
        if data[:4] != b'\x7fELF':
            raise Exception("Not an ELF file")
        
        # 64-bit check
        if data[4] != 2:
            raise Exception("Not 64-bit ELF")
        
        # Little-endian check
        if data[5] != 1:
            raise Exception("Not little-endian ELF")
        
        # Machine type (RISC-V = 243)
        machine = int.from_bytes(data[18:20], 'little')
        if machine != 243:
            raise Exception(f"Not RISC-V ELF (machine={machine})")
        
        # Parse program headers
        phoff = int.from_bytes(data[32:40], 'little')
        phentsize = int.from_bytes(data[54:56], 'little')
        phnum = int.from_bytes(data[56:58], 'little')
        
        entry = int.from_bytes(data[24:32], 'little')
        
        for i in range(phnum):
            phdr_start = phoff + i * phentsize
            p_type = int.from_bytes(data[phdr_start:phdr_start+4], 'little')
            
            if p_type != 1:  # PT_LOAD
                continue
            
            p_offset = int.from_bytes(data[phdr_start+8:phdr_start+16], 'little')
            p_vaddr = int.from_bytes(data[phdr_start+16:phdr_start+24], 'little')
            p_filesz = int.from_bytes(data[phdr_start+32:phdr_start+40], 'little')
            p_memsz = int.from_bytes(data[phdr_start+40:phdr_start+48], 'little')
            
            # Load segment
            for j in range(p_memsz):
                addr = p_vaddr + j
                if j < p_filesz:
                    val = data[p_offset + j]
                else:
                    val = 0  # BSS
                
                mem_addr = addr - self.mem_base
                if 0 <= mem_addr < len(self.memory):
                    self.memory[mem_addr] = val
        
        self.pc = entry
    
    def run(self, max_steps: int = 10000000) -> None:
        """Run the emulator until halt or max steps."""
        self.running = True
        for _ in range(max_steps):
            if not self.step():
                break
        
    def dump_regs(self) -> str:
        """Dump register state."""
        names = ['zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2', 's0/fp', 's1', 
                 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 
                 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11',
                 't3', 't4', 't5', 't6']
        
        lines = []
        for i in range(0, 32, 4):
            line = []
            for j in range(4):
                if i + j < 32:
                    r = i + j
                    line.append(f"x{r:02d}({names[r]:5s})=0x{self.regs[r]:016x}")
            lines.append(' '.join(line))
        return '\n'.join(lines)


def run_test():
    """Run a simple test to verify the emulator works."""
    emu = RISCVEmu()
    
    # Simple test: addi x1, x0, 42; addi x2, x1, 8
    # addi x1, x0, 42 = 0x02a00093
    # addi x2, x1, 8 = 0x00808093
    
    # Write instructions to memory at default PC
    emu.write_mem(0x80000000, 4, 0x02a00093)  # addi x1, x0, 42
    emu.write_mem(0x80000004, 4, 0x00808093)  # addi x2, x1, 8
    emu.write_mem(0x80000008, 4, 0x00100073)  # ebreak
    
    emu.run()
    
    print("Register dump after test:")
    print(emu.dump_regs())
    
    assert emu.regs[1] == 42, f"Expected x1=42, got {emu.regs[1]}"
    assert emu.regs[2] == 50, f"Expected x2=50, got {emu.regs[2]}"
    
    print("\nBasic test passed!")
    return emu


if __name__ == "__main__":
    run_test()
