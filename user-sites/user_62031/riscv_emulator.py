#!/usr/bin/env python3
"""
RISC-V RV32I Emulator
Lev Osin, Alcor case A-3891
"""

from typing import Optional
import struct

# Instruction encoding masks
OPCODE_MASK = 0x7F
FUNCT3_MASK = 0x7000
FUNCT7_MASK = 0xFE000000
RD_MASK = 0xF80
RS1_MASK = 0xF8000
RS2_MASK = 0x1F00000

# Opcodes
OP_LUI = 0x37
OP_AUIPC = 0x17
OP_JAL = 0x6F
OP_JALR = 0x67
OP_BRANCH = 0x63
OP_LOAD = 0x03
OP_STORE = 0x23
OP_IMM = 0x13
OP_OP = 0x33
OP_SYSTEM = 0x73

# Funct3 codes
F3_BEQ = 0; F3_BNE = 1; F3_BLT = 4; F3_BGE = 5
F3_BLTU = 6; F3_BGEU = 7
F3_LB = 0; F3_LH = 1; F3_LW = 2; F3_LBU = 4; F3_LHU = 5
F3_SB = 0; F3_SH = 1; F3_SW = 2
F3_ADD = 0; F3_SLL = 1; F3_SLT = 2; F3_SLTU = 3
F3_XOR = 4; F3_SR = 5; F3_OR = 6; F3_AND = 7

class RISCV32Emulator:
    """RV32I base integer instruction set emulator."""
    
    def __init__(self, memory_size: int = 1024 * 1024):
        self.pc = 0
        self.regs = [0] * 32
        self.memory = bytearray(memory_size)
        self.running = False
        self.instruction_count = 0
        self.ecall_handler = None
        
    def reset(self, entry_point: int = 0):
        self.pc = entry_point
        self.regs = [0] * 32
        self.regs[2] = len(self.memory)
        self.running = False
        self.instruction_count = 0
        
    def read_reg(self, reg: int) -> int:
        if reg == 0:
            return 0
        return self.regs[reg] & 0xFFFFFFFF
        
    def write_reg(self, reg: int, value: int):
        if reg != 0:
            self.regs[reg] = value & 0xFFFFFFFF
            
    def sign_extend(self, value: int, bits: int) -> int:
        if value & (1 << (bits - 1)):
            value -= (1 << bits)
        return value & 0xFFFFFFFF
        
    def read32(self, addr: int) -> int:
        if addr < 0 or addr + 4 > len(self.memory):
            raise RuntimeError(f"Memory read out of bounds: {addr}")
        return struct.unpack('<I', self.memory[addr:addr+4])[0]
        
    def read16(self, addr: int) -> int:
        if addr < 0 or addr + 2 > len(self.memory):
            raise RuntimeError(f"Memory read out of bounds: {addr}")
        return struct.unpack('<H', self.memory[addr:addr+2])[0]
        
    def read8(self, addr: int) -> int:
        if addr < 0 or addr >= len(self.memory):
            raise RuntimeError(f"Memory read out of bounds: {addr}")
        return self.memory[addr]
        
    def write32(self, addr: int, value: int):
        if addr < 0 or addr + 4 > len(self.memory):
            raise RuntimeError(f"Memory write out of bounds: {addr}")
        self.memory[addr:addr+4] = struct.pack('<I', value & 0xFFFFFFFF)
        
    def write16(self, addr: int, value: int):
        if addr < 0 or addr + 2 > len(self.memory):
            raise RuntimeError(f"Memory write out of bounds: {addr}")
        self.memory[addr:addr+2] = struct.pack('<H', value & 0xFFFF)
        
    def write8(self, addr: int, value: int):
        if addr < 0 or addr >= len(self.memory):
            raise RuntimeError(f"Memory write out of bounds: {addr}")
        self.memory[addr] = value & 0xFF
        
    def load_program(self, code: bytes, addr: int = 0):
        if addr + len(code) > len(self.memory):
            raise RuntimeError("Program too large")
        self.memory[addr:addr+len(code)] = code
        
    def get_imm_i(self, insn: int) -> int:
        return self.sign_extend((insn >> 20) & 0xFFF, 12)
        
    def get_imm_s(self, insn: int) -> int:
        imm = ((insn >> 25) & 0x7F) << 5 | ((insn >> 7) & 0x1F)
        return self.sign_extend(imm, 12)
        
    def get_imm_b(self, insn: int) -> int:
        imm = ((insn >> 31) & 1) << 12
        imm |= ((insn >> 7) & 1) << 11
        imm |= ((insn >> 25) & 0x3F) << 5
        imm |= ((insn >> 8) & 0xF) << 1
        return self.sign_extend(imm, 13)
        
    def get_imm_u(self, insn: int) -> int:
        return (insn >> 12) & 0xFFFFF
        
    def get_imm_j(self, insn: int) -> int:
        imm = ((insn >> 31) & 1) << 20
        imm |= ((insn >> 12) & 0xFF) << 12
        imm |= ((insn >> 20) & 1) << 11
        imm |= ((insn >> 21) & 0x3FF) << 1
        return self.sign_extend(imm, 21)
        
    def step(self) -> bool:
        if not self.running:
            return False
            
        insn = self.read32(self.pc)
        opcode = insn & OPCODE_MASK
        rd = (insn & RD_MASK) >> 7
        rs1 = (insn & RS1_MASK) >> 15
        rs2 = (insn & RS2_MASK) >> 20
        funct3 = (insn & FUNCT3_MASK) >> 12
        
        self.instruction_count += 1
        
        if opcode == OP_LUI:
            imm = self.get_imm_u(insn) << 12
            self.write_reg(rd, imm)
            self.pc += 4
            
        elif opcode == OP_AUIPC:
            imm = self.get_imm_u(insn) << 12
            self.write_reg(rd, (self.pc + imm) & 0xFFFFFFFF)
            self.pc += 4
            
        elif opcode == OP_JAL:
            imm = self.get_imm_j(insn)
            self.write_reg(rd, (self.pc + 4) & 0xFFFFFFFF)
            self.pc = (self.pc + imm) & 0xFFFFFFFF
            
        elif opcode == OP_JALR:
            imm = self.get_imm_i(insn)
            target = (self.read_reg(rs1) + imm) & 0xFFFFFFFE
            self.write_reg(rd, (self.pc + 4) & 0xFFFFFFFF)
            self.pc = target
            
        elif opcode == OP_BRANCH:
            imm = self.get_imm_b(insn)
            rs1_val = self.read_reg(rs1)
            rs2_val = self.read_reg(rs2)
            
            take_branch = False
            if funct3 == F3_BEQ:
                take_branch = (rs1_val == rs2_val)
            elif funct3 == F3_BNE:
                take_branch = (rs1_val != rs2_val)
            elif funct3 == F3_BLT:
                take_branch = (self.sign_extend(rs1_val, 32) < self.sign_extend(rs2_val, 32))
            elif funct3 == F3_BGE:
                take_branch = (self.sign_extend(rs1_val, 32) >= self.sign_extend(rs2_val, 32))
            elif funct3 == F3_BLTU:
                take_branch = (rs1_val < rs2_val)
            elif funct3 == F3_BGEU:
                take_branch = (rs1_val >= rs2_val)
            else:
                raise RuntimeError(f"Invalid branch funct3: {funct3}")
                
            if take_branch:
                self.pc = (self.pc + imm) & 0xFFFFFFFF
            else:
                self.pc += 4
                
        elif opcode == OP_LOAD:
            addr = (self.read_reg(rs1) + self.get_imm_i(insn)) & 0xFFFFFFFF
            
            if funct3 == F3_LB:
                val = self.sign_extend(self.read8(addr), 8)
            elif funct3 == F3_LH:
                val = self.sign_extend(self.read16(addr), 16)
            elif funct3 == F3_LW:
                val = self.read32(addr)
            elif funct3 == F3_LBU:
                val = self.read8(addr)
            elif funct3 == F3_LHU:
                val = self.read16(addr)
            else:
                raise RuntimeError(f"Invalid load funct3: {funct3}")
                
            self.write_reg(rd, val)
            self.pc += 4
            
        elif opcode == OP_STORE:
            addr = (self.read_reg(rs1) + self.get_imm_s(insn)) & 0xFFFFFFFF
            rs2_val = self.read_reg(rs2)
            
            if funct3 == F3_SB:
                self.write8(addr, rs2_val)
            elif funct3 == F3_SH:
                self.write16(addr, rs2_val)
            elif funct3 == F3_SW:
                self.write32(addr, rs2_val)
            else:
                raise RuntimeError(f"Invalid store funct3: {funct3}")
                
            self.pc += 4
            
        elif opcode == OP_IMM:
            rs1_val = self.read_reg(rs1)
            imm = self.get_imm_i(insn)
            
            if funct3 == F3_ADD:
                result = rs1_val + imm
            elif funct3 == F3_SLL:
                shamt = imm & 0x1F
                result = (rs1_val << shamt) & 0xFFFFFFFF
            elif funct3 == F3_SLT:
                result = 1 if self.sign_extend(rs1_val, 32) < self.sign_extend(imm, 12) else 0
            elif funct3 == F3_SLTU:
                result = 1 if rs1_val < (imm & 0xFFF) else 0
            elif funct3 == F3_XOR:
                result = rs1_val ^ imm
            elif funct3 == F3_SR:
                shamt = imm & 0x1F
                if (insn >> 30) & 1:
                    result = self.sign_extend(rs1_val, 32) >> shamt
                else:
                    result = rs1_val >> shamt
            elif funct3 == F3_OR:
                result = rs1_val | imm
            elif funct3 == F3_AND:
                result = rs1_val & imm
            else:
                raise RuntimeError(f"Invalid OP-IMM funct3: {funct3}")
                
            self.write_reg(rd, result)
            self.pc += 4
            
        elif opcode == OP_OP:
            rs1_val = self.read_reg(rs1)
            rs2_val = self.read_reg(rs2)
            
            if funct3 == F3_ADD:
                if (insn >> 30) & 1:
                    result = (rs1_val - rs2_val) & 0xFFFFFFFF
                else:
                    result = (rs1_val + rs2_val) & 0xFFFFFFFF
            elif funct3 == F3_SLL:
                shamt = rs2_val & 0x1F
                result = (rs1_val << shamt) & 0xFFFFFFFF
            elif funct3 == F3_SLT:
                result = 1 if self.sign_extend(rs1_val, 32) < self.sign_extend(rs2_val, 32) else 0
            elif funct3 == F3_SLTU:
                result = 1 if rs1_val < rs2_val else 0
            elif funct3 == F3_XOR:
                result = rs1_val ^ rs2_val
            elif funct3 == F3_SR:
                shamt = rs2_val & 0x1F
                if (insn >> 30) & 1:
                    result = self.sign_extend(rs1_val, 32) >> shamt
                else:
                    result = rs1_val >> shamt
            elif funct3 == F3_OR:
                result = rs1_val | rs2_val
            elif funct3 == F3_AND:
                result = rs1_val & rs2_val
            else:
                raise RuntimeError(f"Invalid OP funct3: {funct3}")
                
            self.write_reg(rd, result)
            self.pc += 4
            
        elif opcode == OP_SYSTEM:
            # ECALL/EBREAK - treat as halt
            self.running = False
            return False
            
        else:
            # Unknown opcode - halt gracefully
            self.running = False
            return False
            
        return True
        
    def run(self, max_instructions: Optional[int] = None):
        self.running = True
        while self.running:
            if max_instructions and self.instruction_count >= max_instructions:
                raise RuntimeError("Maximum instruction count exceeded")
            if not self.step():
                break


def assemble_riscv(asm: str, add_halt: bool = True) -> bytes:
    REG_NAMES = {
        'zero': 0, 'ra': 1, 'sp': 2, 'gp': 3, 'tp': 4,
        't0': 5, 't1': 6, 't2': 7, 's0': 8, 's1': 9,
        'a0': 10, 'a1': 11, 'a2': 12, 'a3': 13, 'a4': 14,
        'a5': 15, 'a6': 16, 'a7': 17, 's2': 18, 's3': 19,
        's4': 20, 's5': 21, 's6': 22, 's7': 23, 's8': 24,
        's9': 25, 's10': 26, 's11': 27, 't3': 28, 't4': 29,
        't5': 30, 't6': 31,
    }
    
    def parse_reg(r):
        r = r.strip().replace(',', '')
        if r.startswith('x'):
            return int(r[1:])
        return REG_NAMES[r]
    
    def encode_i_type(opcode, funct3, rd, rs1, imm):
        return opcode | (rd << 7) | (funct3 << 12) | (rs1 << 15) | ((imm & 0xFFF) << 20)
    
    def encode_r_type(opcode, funct3, funct7, rd, rs1, rs2):
        return opcode | (rd << 7) | (funct3 << 12) | (rs1 << 15) | (rs2 << 20) | (funct7 << 25)
    
    def encode_s_type(opcode, funct3, rs1, rs2, imm):
        imm_lo = imm & 0x1F
        imm_hi = (imm >> 5) & 0x7F
        return opcode | (imm_lo << 7) | (funct3 << 12) | (rs1 << 15) | (rs2 << 20) | (imm_hi << 25)
    
    def encode_b_type(opcode, funct3, rs1, rs2, imm):
        imm_11 = (imm >> 11) & 1
        imm_4_1 = (imm >> 1) & 0xF
        imm_10_5 = (imm >> 5) & 0x3F
        imm_12 = (imm >> 12) & 1
        return (opcode | (imm_11 << 7) | (imm_4_1 << 8) | (funct3 << 12) |
                (rs1 << 15) | (rs2 << 20) | (imm_10_5 << 25) | (imm_12 << 31))
    
    def encode_j_type(opcode, rd, imm):
        imm_20 = (imm >> 20) & 1
        imm_10_1 = (imm >> 1) & 0x3FF
        imm_11 = (imm >> 11) & 1
        imm_19_12 = (imm >> 12) & 0xFF
        return (opcode | (rd << 7) | (imm_19_12 << 12) | (imm_11 << 20) |
                (imm_10_1 << 21) | (imm_20 << 31))
    
    def encode_u_type(opcode, rd, imm):
        return opcode | (rd << 7) | ((imm & 0xFFFFF) << 12)
    
    instructions = []
    labels = {}
    
    addr = 0
    for line in asm.strip().split('\n'):
        line = line.strip()
        if ':' in line and not line.startswith('.'):
            label = line.split(':')[0].strip()
            labels[label] = addr
        if line and not line.endswith(':'):
            addr += 4
    
    addr = 0
    for line in asm.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('#') or line.endswith(':'):
            continue
        if '#' in line:
            line = line.split('#')[0].strip()
            
        parts = line.replace(',', ' ').split()
        op = parts[0].lower()
        insn = 0
        
        if op == 'addi':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            imm = int(parts[3])
            insn = encode_i_type(0x13, 0, rd, rs1, imm)
        elif op == 'slti':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            imm = int(parts[3])
            insn = encode_i_type(0x13, 2, rd, rs1, imm)
        elif op == 'sltiu':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            imm = int(parts[3])
            insn = encode_i_type(0x13, 3, rd, rs1, imm)
        elif op == 'xori':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            imm = int(parts[3])
            insn = encode_i_type(0x13, 4, rd, rs1, imm)
        elif op == 'ori':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            imm = int(parts[3])
            insn = encode_i_type(0x13, 6, rd, rs1, imm)
        elif op == 'andi':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            imm = int(parts[3])
            insn = encode_i_type(0x13, 7, rd, rs1, imm)
        elif op == 'slli':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            shamt = int(parts[3]) & 0x1F
            insn = encode_i_type(0x13, 1, rd, rs1, shamt)
        elif op == 'srli':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            shamt = int(parts[3]) & 0x1F
            insn = encode_i_type(0x13, 5, rd, rs1, shamt)
        elif op == 'srai':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            imm = 0x400 | (int(parts[3]) & 0x1F)
            insn = encode_i_type(0x13, 5, rd, rs1, imm)
        elif op == 'lui':
            rd = parse_reg(parts[1])
            imm = int(parts[2]) & 0xFFFFF
            insn = encode_u_type(0x37, rd, imm)
        elif op == 'auipc':
            rd = parse_reg(parts[1])
            imm = int(parts[2]) & 0xFFFFF
            insn = encode_u_type(0x17, rd, imm)
        elif op == 'add':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            rs2 = parse_reg(parts[3])
            insn = encode_r_type(0x33, 0, 0, rd, rs1, rs2)
        elif op == 'sub':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            rs2 = parse_reg(parts[3])
            insn = encode_r_type(0x33, 0, 0x20, rd, rs1, rs2)
        elif op == 'sll':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            rs2 = parse_reg(parts[3])
            insn = encode_r_type(0x33, 1, 0, rd, rs1, rs2)
        elif op == 'slt':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            rs2 = parse_reg(parts[3])
            insn = encode_r_type(0x33, 2, 0, rd, rs1, rs2)
        elif op == 'sltu':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            rs2 = parse_reg(parts[3])
            insn = encode_r_type(0x33, 3, 0, rd, rs1, rs2)
        elif op == 'xor':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            rs2 = parse_reg(parts[3])
            insn = encode_r_type(0x33, 4, 0, rd, rs1, rs2)
        elif op == 'srl':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            rs2 = parse_reg(parts[3])
            insn = encode_r_type(0x33, 5, 0, rd, rs1, rs2)
        elif op == 'sra':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            rs2 = parse_reg(parts[3])
            insn = encode_r_type(0x33, 5, 0x20, rd, rs1, rs2)
        elif op == 'or':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            rs2 = parse_reg(parts[3])
            insn = encode_r_type(0x33, 6, 0, rd, rs1, rs2)
        elif op == 'and':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            rs2 = parse_reg(parts[3])
            insn = encode_r_type(0x33, 7, 0, rd, rs1, rs2)
        elif op == 'lb':
            rd = parse_reg(parts[1])
            rest = ' '.join(parts[2:])
            offset, rest = rest.split('(')
            rs1 = parse_reg(rest.rstrip(')'))
            imm = int(offset)
            insn = encode_i_type(0x03, 0, rd, rs1, imm)
        elif op == 'lh':
            rd = parse_reg(parts[1])
            rest = ' '.join(parts[2:])
            offset, rest = rest.split('(')
            rs1 = parse_reg(rest.rstrip(')'))
            imm = int(offset)
            insn = encode_i_type(0x03, 1, rd, rs1, imm)
        elif op == 'lw':
            rd = parse_reg(parts[1])
            rest = ' '.join(parts[2:])
            offset, rest = rest.split('(')
            rs1 = parse_reg(rest.rstrip(')'))
            imm = int(offset)
            insn = encode_i_type(0x03, 2, rd, rs1, imm)
        elif op == 'lbu':
            rd = parse_reg(parts[1])
            rest = ' '.join(parts[2:])
            offset, rest = rest.split('(')
            rs1 = parse_reg(rest.rstrip(')'))
            imm = int(offset)
            insn = encode_i_type(0x03, 4, rd, rs1, imm)
        elif op == 'lhu':
            rd = parse_reg(parts[1])
            rest = ' '.join(parts[2:])
            offset, rest = rest.split('(')
            rs1 = parse_reg(rest.rstrip(')'))
            imm = int(offset)
            insn = encode_i_type(0x03, 5, rd, rs1, imm)
        elif op == 'sb':
            rs2 = parse_reg(parts[1])
            rest = ' '.join(parts[2:])
            offset, rest = rest.split('(')
            rs1 = parse_reg(rest.rstrip(')'))
            imm = int(offset)
            insn = encode_s_type(0x23, 0, rs1, rs2, imm)
        elif op == 'sh':
            rs2 = parse_reg(parts[1])
            rest = ' '.join(parts[2:])
            offset, rest = rest.split('(')
            rs1 = parse_reg(rest.rstrip(')'))
            imm = int(offset)
            insn = encode_s_type(0x23, 1, rs1, rs2, imm)
        elif op == 'sw':
            rs2 = parse_reg(parts[1])
            rest = ' '.join(parts[2:])
            offset, rest = rest.split('(')
            rs1 = parse_reg(rest.rstrip(')'))
            imm = int(offset)
            insn = encode_s_type(0x23, 2, rs1, rs2, imm)
        elif op == 'beq':
            rs1 = parse_reg(parts[1])
            rs2 = parse_reg(parts[2])
            target = labels[parts[3]] - addr if parts[3] in labels else int(parts[3])
            insn = encode_b_type(0x63, 0, rs1, rs2, target)
        elif op == 'bne':
            rs1 = parse_reg(parts[1])
            rs2 = parse_reg(parts[2])
            target = labels[parts[3]] - addr if parts[3] in labels else int(parts[3])
            insn = encode_b_type(0x63, 1, rs1, rs2, target)
        elif op == 'blt':
            rs1 = parse_reg(parts[1])
            rs2 = parse_reg(parts[2])
            target = labels[parts[3]] - addr if parts[3] in labels else int(parts[3])
            insn = encode_b_type(0x63, 4, rs1, rs2, target)
        elif op == 'bge':
            rs1 = parse_reg(parts[1])
            rs2 = parse_reg(parts[2])
            target = labels[parts[3]] - addr if parts[3] in labels else int(parts[3])
            insn = encode_b_type(0x63, 5, rs1, rs2, target)
        elif op == 'bltu':
            rs1 = parse_reg(parts[1])
            rs2 = parse_reg(parts[2])
            target = labels[parts[3]] - addr if parts[3] in labels else int(parts[3])
            insn = encode_b_type(0x63, 6, rs1, rs2, target)
        elif op == 'bgeu':
            rs1 = parse_reg(parts[1])
            rs2 = parse_reg(parts[2])
            target = labels[parts[3]] - addr if parts[3] in labels else int(parts[3])
            insn = encode_b_type(0x63, 7, rs1, rs2, target)
        elif op == 'jal':
            rd = parse_reg(parts[1])
            target = labels[parts[2]] - addr if parts[2] in labels else int(parts[2])
            insn = encode_j_type(0x6F, rd, target)
        elif op == 'jalr':
            rd = parse_reg(parts[1])
            rs1 = parse_reg(parts[2])
            imm = int(parts[3])
            insn = encode_i_type(0x67, 0, rd, rs1, imm)
        elif op == 'ecall':
            insn = 0x00000073
        else:
            raise ValueError(f"Unknown instruction: {op}")
            
        instructions.append(struct.pack('<I', insn))
        addr += 4
    
    if add_halt:
        # Add ECALL for clean halt
        instructions.append(struct.pack('<I', 0x00000073))
        
    return b''.join(instructions)


def run_tests():
    tests = [
        # Test 1: Simple addition
        ("""
addi x1, x0, 5
addi x2, x0, 3
add x3, x1, x2
ecall
        """, {'x3': 8}),
        
        # Test 2: Memory load/store
        ("""
addi x1, x0, 100
sw x1, 0(x0)
lw x2, 0(x0)
ecall
        """, {'x2': 100}),
        
        # Test 3: Branch
        ("""
addi x1, x0, 5
addi x2, x0, 5
beq x1, x2, equal
addi x3, x0, 0
jal x0, done
equal:
addi x3, x0, 1
done:
ecall
        """, {'x3': 1}),
        
        # Test 4: Fibonacci (10th = 55)
        ("""
addi x1, x0, 10
addi x2, x0, 0
addi x3, x0, 1
addi x4, x0, 0
loop:
beq x1, x0, done
add x4, x2, x3
add x2, x0, x3
add x3, x0, x4
addi x1, x1, -1
jal x0, loop
done:
add x10, x0, x4
ecall
        """, {'x10': 89}),
    ]
    
    print("=== RISC-V RV32I Emulator Test Suite ===")
    print("Lev Osin, Alcor A-3891")
    print()
    
    emu = RISCV32Emulator()
    all_passed = True
    
    for i, (code, expected) in enumerate(tests, 1):
        try:
            code_bytes = assemble_riscv(code, add_halt=False)  # ECALL already in code
            emu.reset()
            emu.load_program(code_bytes)
            emu.run(max_instructions=10000)
            
            passed = True
            for reg, exp_val in expected.items():
                reg_num = int(reg[1:]) if reg.startswith('x') else 0
                actual = emu.read_reg(reg_num)
                if actual != exp_val:
                    passed = False
                    print(f"Test {i}: FAIL")
                    print(f"  {reg}: expected {exp_val}, got {actual}")
                    all_passed = False
                    
            if passed:
                print(f"Test {i}: PASS ({emu.instruction_count} instructions)")
                
        except Exception as e:
            print(f"Test {i}: ERROR - {e}")
            import traceback
            traceback.print_exc()
            all_passed = False
            
    print()
    if all_passed:
        print("Clean build. All tests passed.")
    else:
        print("Some tests failed.")
    print()


if __name__ == "__main__":
    run_tests()
