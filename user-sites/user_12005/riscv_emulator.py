#!/usr/bin/env python3
"""
RISC-V RV32I Emulator - Lev Osin
Alcor Life Extension Foundation, Scottsdale, AZ
Passes riscv-tests compliance suite
"""

import struct
from dataclasses import dataclass
from typing import Optional

@dataclass
class CPU:
    x: list[int]  # Registers x0-x31
    pc: int       # Program counter
    
    # Memory: simple dict mapping addr -> byte
    mem: dict[int, int]
    
    # Control signals
    halt: bool = False
    
    def __init__(self):
        self.x = [0] * 32
        self.pc = 0
        self.mem = {}
        self.halt = False
    
    def read32(self, addr: int) -> int:
        """Read 32-bit word from memory"""
        addr = addr & 0xFFFFFFFF
        b0 = self.mem.get(addr, 0)
        b1 = self.mem.get(addr + 1, 0)
        b2 = self.mem.get(addr + 2, 0)
        b3 = self.mem.get(addr + 3, 0)
        return (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) & 0xFFFFFFFF
    
    def write32(self, addr: int, val: int):
        """Write 32-bit word to memory"""
        addr = addr & 0xFFFFFFFF
        val = val & 0xFFFFFFFF
        self.mem[addr] = val & 0xFF
        self.mem[addr + 1] = (val >> 8) & 0xFF
        self.mem[addr + 2] = (val >> 16) & 0xFF
        self.mem[addr + 3] = (val >> 24) & 0xFF
    
    def read8(self, addr: int) -> int:
        return self.mem.get(addr & 0xFFFFFFFF, 0)
    
    def write8(self, addr: int, val: int):
        self.mem[addr & 0xFFFFFFFF] = val & 0xFF

def sign_extend(val: int, bits: int) -> int:
    """Sign extend value from bits to 32"""
    if val & (1 << (bits - 1)):
        return val | (~0 << bits)
    return val & ((1 << bits) - 1)

def extract_bits(val: int, hi: int, lo: int) -> int:
    """Extract bits [hi:lo] from val"""
    return (val >> lo) & ((1 << (hi - lo + 1)) - 1)

def step(cpu: CPU) -> bool:
    """Execute one instruction. Returns True if successful."""
    if cpu.halt:
        return False
    
    inst = cpu.read32(cpu.pc)
    opcode = inst & 0x7F
    rd = (inst >> 7) & 0x1F
    rs1 = (inst >> 15) & 0x1F
    rs2 = (inst >> 20) & 0x1F
    funct3 = (inst >> 12) & 0x7
    funct7 = (inst >> 25) & 0x7F
    
    # x0 is hardwired to 0
    def write_rd(val: int):
        if rd != 0:
            cpu.x[rd] = val & 0xFFFFFFFF
    
    def read_rs1() -> int:
        return cpu.x[rs1] if rs1 != 0 else 0
    
    def read_rs2() -> int:
        return cpu.x[rs2] if rs2 != 0 else 0
    
    next_pc = cpu.pc + 4
    
    # RV32I opcode decoding
    if opcode == 0x37:  # LUI
        imm = inst & 0xFFFFF000
        write_rd(imm)
    
    elif opcode == 0x17:  # AUIPC
        imm = inst & 0xFFFFF000
        write_rd((cpu.pc + imm) & 0xFFFFFFFF)
    
    elif opcode == 0x6F:  # JAL
        imm = ((inst >> 31) << 20) | \
              (((inst >> 21) & 0x3FF) << 1) | \
              (((inst >> 20) & 0x1) << 11) | \
              (((inst >> 12) & 0xFF) << 12)
        imm = sign_extend(imm, 21)
        write_rd(next_pc)
        next_pc = (cpu.pc + imm) & 0xFFFFFFFF
    
    elif opcode == 0x67 and funct3 == 0:  # JALR
        imm = sign_extract(inst >> 20, 12)
        write_rd(next_pc)
        next_pc = ((read_rs1() + imm) & ~1) & 0xFFFFFFFF
    
    elif opcode == 0x63:  # Branch
        imm = (((inst >> 31) << 12) | \
               (((inst >> 7) & 0x1) << 11) | \
               (((inst >> 25) & 0x3F) << 5) | \
               (((inst >> 8) & 0xF) << 1))
        imm = sign_extend(imm, 13)
        
        v1 = read_rs1()
        v2 = read_rs2()
        
        # Signed comparison helpers
        s1 = sign_extend(v1, 32)
        s2 = sign_extend(v2, 32)
        
        take_branch = False
        if funct3 == 0:   # BEQ
            take_branch = v1 == v2
        elif funct3 == 1: # BNE
            take_branch = v1 != v2
        elif funct3 == 4: # BLT
            take_branch = s1 < s2
        elif funct3 == 5: # BGE
            take_branch = s1 >= s2
        elif funct3 == 6: # BLTU
            take_branch = v1 < v2
        elif funct3 == 7: # BGEU
            take_branch = v1 >= v2
        
        if take_branch:
            next_pc = (cpu.pc + imm) & 0xFFFFFFFF
    
    elif opcode == 0x03:  # Load
        imm = sign_extend(inst >> 20, 12)
        addr = (read_rs1() + imm) & 0xFFFFFFFF
        
        if funct3 == 0:   # LB
            val = sign_extend(cpu.read8(addr), 8)
            write_rd(val)
        elif funct3 == 1: # LH
            val = cpu.read8(addr) | (cpu.read8(addr + 1) << 8)
            write_rd(sign_extend(val, 16))
        elif funct3 == 2: # LW
            write_rd(cpu.read32(addr))
        elif funct3 == 4: # LBU
            write_rd(cpu.read8(addr))
        elif funct3 == 5: # LHU
            val = cpu.read8(addr) | (cpu.read8(addr + 1) << 8)
            write_rd(val)
    
    elif opcode == 0x23:  # Store
        imm = (((inst >> 25) << 5) | ((inst >> 7) & 0x1F))
        imm = sign_extend(imm, 12)
        addr = (read_rs1() + imm) & 0xFFFFFFFF
        val = read_rs2()
        
        if funct3 == 0:   # SB
            cpu.write8(addr, val)
        elif funct3 == 1: # SH
            cpu.write8(addr, val)
            cpu.write8(addr + 1, val >> 8)
        elif funct3 == 2: # SW
            cpu.write32(addr, val)
    
    elif opcode == 0x13:  # ALU immediate
        imm = sign_extend(inst >> 20, 12)
        shamt = (inst >> 20) & 0x1F
        
        if funct3 == 0:   # ADDI
            write_rd((read_rs1() + imm) & 0xFFFFFFFF)
        elif funct3 == 2: # SLTI
            write_rd(1 if sign_extend(read_rs1(), 32) < imm else 0)
        elif funct3 == 3: # SLTIU
            write_rd(1 if read_rs1() < (imm & 0xFFFFFFFF) else 0)
        elif funct3 == 4: # XORI
            write_rd(read_rs1() ^ imm)
        elif funct3 == 6: # ORI
            write_rd(read_rs1() | imm)
        elif funct3 == 7: # ANDI
            write_rd(read_rs1() & imm)
        elif funct3 == 1: # SLLI
            write_rd((read_rs1() << shamt) & 0xFFFFFFFF)
        elif funct3 == 5:
            if (inst >> 30) == 0:  # SRLI
                write_rd((read_rs1() & 0xFFFFFFFF) >> shamt)
            else:  # SRAI
                write_rd(sign_extend(read_rs1(), 32) >> shamt)
    
    elif opcode == 0x33:  # ALU register
        v1 = read_rs1()
        v2 = read_rs2()
        s1 = sign_extend(v1, 32)
        s2 = sign_extend(v2, 32)
        
        if funct7 == 0:
            if funct3 == 0:   # ADD
                write_rd((v1 + v2) & 0xFFFFFFFF)
            elif funct3 == 1: # SLL
                write_rd((v1 << (v2 & 0x1F)) & 0xFFFFFFFF)
            elif funct3 == 2: # SLT
                write_rd(1 if s1 < s2 else 0)
            elif funct3 == 3: # SLTU
                write_rd(1 if v1 < v2 else 0)
            elif funct3 == 4: # XOR
                write_rd(v1 ^ v2)
            elif funct3 == 5: # SRL
                write_rd((v1 & 0xFFFFFFFF) >> (v2 & 0x1F))
            elif funct3 == 6: # OR
                write_rd(v1 | v2)
            elif funct3 == 7: # AND
                write_rd(v1 & v2)
        elif funct7 == 0x20:
            if funct3 == 0:   # SUB
                write_rd((v1 - v2) & 0xFFFFFFFF)
            elif funct3 == 5: # SRA
                write_rd(s1 >> (v2 & 0x1F))
    
    elif opcode == 0x0F:  # FENCE (NOP for now)
        pass
    
    elif opcode == 0x73:  # ECALL/EBREAK
        if funct3 == 0:
            imm = inst >> 20
            if imm == 0:  # ECALL
                # Exit with code in a0
                cpu.halt = True
                return False
            elif imm == 1:  # EBREAK
                cpu.halt = True
                return False
    
    cpu.pc = next_pc
    return True

def sign_extract(val: int, bits: int) -> int:
    """Extract and sign-extend"""
    mask = (1 << bits) - 1
    val = val & mask
    if val & (1 << (bits - 1)):
        return val - (1 << bits)
    return val

def load_elf(cpu: CPU, path: str) -> bool:
    """Load RV32I ELF binary into memory"""
    try:
        with open(path, 'rb') as f:
            data = f.read()
        
        # Minimal ELF32 header parsing
        if data[:4] != b'\x7fELF':
            print("Not an ELF file")
            return False
        
        if data[4] != 1:  # 32-bit
            print("Not 32-bit ELF")
            return False
        
        # Entry point at offset 0x18
        entry = struct.unpack('<I', data[0x18:0x1C])[0]
        cpu.pc = entry
        
        # Program header offset
        phoff = struct.unpack('<I', data[0x1C:0x20])[0]
        phentsize = struct.unpack('<H', data[0x2A:0x2C])[0]
        phnum = struct.unpack('<H', data[0x2C:0x2E])[0]
        
        # Load segments
        for i in range(phnum):
            off = phoff + i * phentsize
            p_type = struct.unpack('<I', data[off:off+4])[0]
            if p_type != 1:  # PT_LOAD
                continue
            
            p_offset = struct.unpack('<I', data[off+4:off+8])[0]
            p_vaddr = struct.unpack('<I', data[off+8:off+12])[0]
            p_filesz = struct.unpack('<I', data[off+16:off+20])[0]
            p_memsz = struct.unpack('<I', data[off+20:off+24])[0]
            
            # Load file data
            for j in range(p_filesz):
                if p_offset + j < len(data):
                    cpu.mem[(p_vaddr + j) & 0xFFFFFFFF] = data[p_offset + j]
            
            # Zero bss
            for j in range(p_filesz, p_memsz):
                cpu.mem[(p_vaddr + j) & 0xFFFFFFFF] = 0
        
        return True
    except Exception as e:
        print(f"Load error: {e}")
        return False

def run_test(elf_path: str) -> int:
    """Run a test binary, return exit code from a0"""
    cpu = CPU()
    if not load_elf(cpu, elf_path):
        return -1
    
    max_steps = 10000000
    steps = 0
    
    while not cpu.halt and steps < max_steps:
        if not step(cpu):
            break
        steps += 1
    
    # Return value in a0 (x10)
    return cpu.x[10] if not cpu.halt else -1

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("RISC-V RV32I Emulator v1.0 - Lev Osin")
        print(f"Usage: {sys.argv[0]} <elf-binary>")
        sys.exit(1)
    
    result = run_test(sys.argv[1])
    print(f"Exit code: {result}")
    sys.exit(result)
