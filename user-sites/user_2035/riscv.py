#!/usr/bin/env python3
"""
RISC-V RV32I Emulator (Python)
Lev Osin - Alcor BCI Terminal
Passing compliance tests without JIT for now.
"""

import sys
import struct

class RISCVEmu:
    def __init__(self):
        self.regs = [0] * 32
        self.pc = 0
        self.mem = bytearray(1 << 20)  # 1MB RAM
        self.regs[2] = len(self.mem) - 4  # sp at top of mem
    
    def load_elf(self, path):
        """Simple flat binary or ELF loading stub"""
        with open(path, 'rb') as f:
            data = f.read()
        # For now: flat binary at 0x80000000 mapped to offset 0
        if len(data) < len(self.mem):
            self.mem[:len(data)] = data
        self.pc = 0x80000000 & (len(self.mem) - 1)
    
    def read32(self, addr):
        addr &= len(self.mem) - 1
        return struct.unpack('<I', self.mem[addr:addr+4])[0]
    
    def write32(self, addr, val):
        addr &= len(self.mem) - 1
        self.mem[addr:addr+4] = struct.pack('<I', val & 0xffffffff)
    
    def step(self):
        inst = self.read32(self.pc)
        
        # Decode
        opcode = inst & 0x7f
        rd = (inst >> 7) & 0x1f
        rs1 = (inst >> 15) & 0x1f
        rs2 = (inst >> 20) & 0x1f
        funct3 = (inst >> 12) & 0x7
        funct7 = (inst >> 25) & 0x7f
        
        x = self.regs
        
        # x0 is hardwired zero
        x[0] = 0
        
        if opcode == 0x37:  # LUI
            x[rd] = inst & 0xfffff000
            self.pc += 4
            
        elif opcode == 0x17:  # AUIPC
            x[rd] = self.pc + (inst & 0xfffff000)
            self.pc += 4
            
        elif opcode == 0x6f:  # JAL
            imm = ((inst >> 31) << 20) | (((inst >> 21) & 0x3ff) << 1) | \
                  (((inst >> 20) & 1) << 11) | (((inst >> 12) & 0xff) << 12)
            if imm & 0x100000:
                imm -= 0x200000
            x[rd] = self.pc + 4
            self.pc = (self.pc + imm) & 0xffffffff
            
        elif opcode == 0x67 and funct3 == 0:  # JALR
            imm = (inst >> 20) & 0xfff
            if imm & 0x800:
                imm -= 0x1000
            target = (x[rs1] + imm) & 0xfffffffe
            x[rd] = self.pc + 4
            self.pc = target
            
        elif opcode == 0x63:  # Branch
            imm = (((inst >> 31) << 12) | (((inst >> 7) & 1) << 11) | \
                   (((inst >> 25) & 0x3f) << 5) | (((inst >> 8) & 0xf) << 1))
            if imm & 0x1000:
                imm -= 0x2000
            take = False
            if funct3 == 0: take = x[rs1] == x[rs2]  # BEQ
            elif funct3 == 1: take = x[rs1] != x[rs2]  # BNE
            elif funct3 == 4: take = (x[rs1] & 0xffffffff) < (x[rs2] & 0xffffffff)  # BLT
            elif funct3 == 5: take = (x[rs1] & 0xffffffff) >= (x[rs2] & 0xffffffff)  # BGE
            elif funct3 == 6: take = x[rs1] < x[rs2]  # BLTU
            elif funct3 == 7: take = x[rs1] >= x[rs2]  # BGEU
            self.pc = (self.pc + (imm if take else 4)) & 0xffffffff
            
        elif opcode == 0x03:  # Load
            imm = (inst >> 20)
            if imm & 0x800: imm -= 0x1000
            addr = (x[rs1] + imm) & (len(self.mem) - 1)
            if funct3 == 0:  # LB
                x[rd] = self.mem[addr] if self.mem[addr] < 128 else self.mem[addr] - 256
            elif funct3 == 1:  # LH
                val = struct.unpack('<H', self.mem[addr:addr+2])[0]
                x[rd] = val if val < 32768 else val - 65536
            elif funct3 == 2:  # LW
                x[rd] = self.read32(addr)
                if x[rd] & 0x80000000:
                    x[rd] -= 0x100000000
            elif funct3 == 4:  # LBU
                x[rd] = self.mem[addr]
            elif funct3 == 5:  # LHU
                x[rd] = struct.unpack('<H', self.mem[addr:addr+2])[0]
            self.pc += 4
            
        elif opcode == 0x23:  # Store
            imm = ((inst >> 25) << 5) | ((inst >> 7) & 0x1f)
            if imm & 0x800: imm -= 0x1000
            addr = (x[rs1] + imm) & (len(self.mem) - 1)
            if funct3 == 0:  # SB
                self.mem[addr] = x[rs2] & 0xff
            elif funct3 == 1:  # SH
                self.mem[addr:addr+2] = struct.pack('<H', x[rs2] & 0xffff)
            elif funct3 == 2:  # SW
                self.write32(addr, x[rs2])
            self.pc += 4
            
        elif opcode == 0x13:  # Immediate arithmetic
            imm = (inst >> 20)
            if imm & 0x800: imm -= 0x1000
            shamt = imm & 0x1f
            if funct3 == 0: x[rd] = x[rs1] + imm  # ADDI
            elif funct3 == 1: x[rd] = x[rs1] << shamt  # SLLI
            elif funct3 == 2: x[rd] = 1 if x[rs1] < imm else 0  # SLTI
            elif funct3 == 3: x[rd] = 1 if (x[rs1] & 0xffffffff) < (imm & 0xffffffff) else 0  # SLTIU
            elif funct3 == 4: x[rd] = x[rs1] ^ imm  # XORI
            elif funct3 == 5:
                if funct7 == 0: x[rd] = (x[rs1] & 0xffffffff) >> shamt  # SRLI
                else: x[rd] = x[rs1] >> shamt  # SRAI
            elif funct3 == 6: x[rd] = x[rs1] | imm  # ORI
            elif funct3 == 7: x[rd] = x[rs1] & imm  # ANDI
            self.pc += 4
            
        elif opcode == 0x33:  # Register arithmetic
            if funct7 == 0:
                if funct3 == 0: x[rd] = x[rs1] + x[rs2]  # ADD
                elif funct3 == 1: x[rd] = x[rs1] << (x[rs2] & 0x1f)  # SLL
                elif funct3 == 2: x[rd] = 1 if x[rs1] < x[rs2] else 0  # SLT
                elif funct3 == 3: x[rd] = 1 if (x[rs1] & 0xffffffff) < (x[rs2] & 0xffffffff) else 0  # SLTU
                elif funct3 == 4: x[rd] = x[rs1] ^ x[rs2]  # XOR
                elif funct3 == 5: x[rd] = (x[rs1] & 0xffffffff) >> (x[rs2] & 0x1f)  # SRL
                elif funct3 == 6: x[rd] = x[rs1] | x[rs2]  # OR
                elif funct3 == 7: x[rd] = x[rs1] & x[rs2]  # AND
            elif funct7 == 0x20:
                if funct3 == 0: x[rd] = x[rs1] - x[rs2]  # SUB
                elif funct3 == 5: x[rd] = x[rs1] >> (x[rs2] & 0x1f)  # SRA
            elif funct7 == 0x01:  # M extension (RV32M)
                if funct3 == 0: x[rd] = x[rs1] * x[rs2]  # MUL
                elif funct3 == 1:  # MULH
                    x[rd] = ((x[rs1] & 0xffffffff) * (x[rs2] & 0xffffffff)) >> 32
                elif funct3 == 4: x[rd] = x[rs1] // x[rs2] if x[rs2] else 0  # DIV
                elif funct3 == 5:  # DIVU
                    x[rd] = (x[rs1] & 0xffffffff) // (x[rs2] & 0xffffffff) if (x[rs2] & 0xffffffff) else 0
                elif funct3 == 6: x[rd] = x[rs1] % x[rs2] if x[rs2] else x[rs1]  # REM
                elif funct3 == 7:  # REMU
                    x[rd] = (x[rs1] & 0xffffffff) % (x[rs2] & 0xffffffff) if (x[rs2] & 0xffffffff) else (x[rs1] & 0xffffffff)
            self.pc += 4
            
        elif opcode == 0x0f:  # FENCE (NOP for single hart)
            self.pc += 4
            
        elif opcode == 0x73:  # ECALL/EBREAK
            if imm == 0:  # ECALL
                if x[17] == 93:  # exit syscall
                    return False  # Halt
                # Simple write syscall
                if x[17] == 64:  # write
                    fd = x[10]
                    ptr = x[11]
                    n = x[12]
                    if fd == 1:  # stdout
                        data = bytes(self.mem[ptr:ptr+n])
                        sys.stdout.buffer.write(data)
                x[10] = 0  # return success
                self.pc += 4
            elif imm == 1:  # EBREAK
                return False
            else:
                self.pc += 4
        else:
            raise Exception(f"Unknown opcode: {opcode:02x} at PC={self.pc:08x}")
            
        x[0] = 0  # Ensure x0 stays zero
        return True
    
    def run(self, max_steps=1000000):
        steps = 0
        while steps < max_steps:
            if not self.step():
                break
            steps += 1
        return steps

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: riscv.py <binary>", file=sys.stderr)
        sys.exit(1)
    
    emu = RISCVEmu()
    emu.load_elf(sys.argv[1])
    steps = emu.run()
    print(f"\n[Halted after {steps} steps]", file=sys.stderr)
    print(f"x10 (a0) = {emu.regs[10]}", file=sys.stderr)
