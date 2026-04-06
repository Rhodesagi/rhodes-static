#!/usr/bin/env python3
"""
RISC-V RV32I Emulator Core
Lev Osin, Alcor case A-3891
Clean implementation of RV32I base integer instruction set.
"""

import struct
from typing import Optional

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

class RV32IEmulator:
    def __init__(self, memory_size: int = 1024 * 1024):
        self.pc = 0
        self.regs = [0] * 32
        self.memory = bytearray(memory_size)
        self.running = False
        self.instruction_count = 0
        
    def reset(self, entry: int = 0):
        self.pc = entry
        self.regs = [0] * 32
        self.regs[2] = len(self.memory)  # SP
        self.running = False
        self.instruction_count = 0
        
    def read_reg(self, n: int) -> int:
        return 0 if n == 0 else self.regs[n] & 0xFFFFFFFF
        
    def write_reg(self, n: int, v: int):
        if n != 0:
            self.regs[n] = v & 0xFFFFFFFF
            
    def sext(self, v: int, bits: int) -> int:
        if v & (1 << (bits - 1)):
            v -= (1 << bits)
        return v & 0xFFFFFFFF
        
    def read32(self, addr: int) -> int:
        return struct.unpack('<I', self.memory[addr:addr+4])[0]
        
    def read16(self, addr: int) -> int:
        return struct.unpack('<H', self.memory[addr:addr+2])[0]
        
    def read8(self, addr: int) -> int:
        return self.memory[addr]
        
    def write32(self, addr: int, v: int):
        self.memory[addr:addr+4] = struct.pack('<I', v & 0xFFFFFFFF)
        
    def write16(self, addr: int, v: int):
        self.memory[addr:addr+2] = struct.pack('<H', v & 0xFFFF)
        
    def write8(self, addr: int, v: int):
        self.memory[addr] = v & 0xFF

    def load(self, code: bytes, addr: int = 0):
        self.memory[addr:addr+len(code)] = code

    def step(self) -> bool:
        if not self.running:
            return False
            
        insn = self.read32(self.pc)
        opcode = insn & 0x7F
        rd = (insn >> 7) & 0x1F
        rs1 = (insn >> 15) & 0x1F
        rs2 = (insn >> 20) & 0x1F
        f3 = (insn >> 12) & 7
        f7 = (insn >> 25) & 0x7F
        
        self.instruction_count += 1
        
        # I-type imm
        imm_i = self.sext((insn >> 20) & 0xFFF, 12)
        # S-type imm
        imm_s = self.sext(((insn >> 25) & 0x7F) << 5 | ((insn >> 7) & 0x1F), 12)
        # B-type imm
        imm_b = self.sext(((insn >> 31) & 1) << 12 | ((insn >> 7) & 1) << 11 |
                         ((insn >> 25) & 0x3F) << 5 | ((insn >> 8) & 0xF) << 1, 13)
        # U-type imm
        imm_u = ((insn >> 12) & 0xFFFFF) << 12
        # J-type imm
        imm_j = self.sext(((insn >> 31) & 1) << 20 | ((insn >> 12) & 0xFF) << 12 |
                         ((insn >> 20) & 1) << 11 | ((insn >> 21) & 0x3FF) << 1, 21)
        
        if opcode == OP_LUI:
            self.write_reg(rd, imm_u)
            self.pc += 4
        elif opcode == OP_AUIPC:
            self.write_reg(rd, (self.pc + imm_u) & 0xFFFFFFFF)
            self.pc += 4
        elif opcode == OP_JAL:
            self.write_reg(rd, (self.pc + 4) & 0xFFFFFFFF)
            self.pc = (self.pc + imm_j) & 0xFFFFFFFF
        elif opcode == OP_JALR:
            self.write_reg(rd, (self.pc + 4) & 0xFFFFFFFF)
            self.pc = (self.read_reg(rs1) + imm_i) & 0xFFFFFFFE
        elif opcode == OP_BRANCH:
            v1, v2 = self.read_reg(rs1), self.read_reg(rs2)
            take = False
            if f3 == 0: take = (v1 == v2)  # BEQ
            elif f3 == 1: take = (v1 != v2)  # BNE
            elif f3 == 4: take = (self.sext(v1,32) < self.sext(v2,32))  # BLT
            elif f3 == 5: take = (self.sext(v1,32) >= self.sext(v2,32))  # BGE
            elif f3 == 6: take = (v1 < v2)  # BLTU
            elif f3 == 7: take = (v1 >= v2)  # BGEU
            if take:
                self.pc = (self.pc + imm_b) & 0xFFFFFFFF
            else:
                self.pc += 4
        elif opcode == OP_LOAD:
            addr = (self.read_reg(rs1) + imm_i) & 0xFFFFFFFF
            if f3 == 0: val = self.sext(self.read8(addr), 8)  # LB
            elif f3 == 1: val = self.sext(self.read16(addr), 16)  # LH
            elif f3 == 2: val = self.read32(addr)  # LW
            elif f3 == 4: val = self.read8(addr)  # LBU
            elif f3 == 5: val = self.read16(addr)  # LHU
            else: raise RuntimeError(f"Bad load f3={f3}")
            self.write_reg(rd, val)
            self.pc += 4
        elif opcode == OP_STORE:
            addr = (self.read_reg(rs1) + imm_s) & 0xFFFFFFFF
            v = self.read_reg(rs2)
            if f3 == 0: self.write8(addr, v)  # SB
            elif f3 == 1: self.write16(addr, v)  # SH
            elif f3 == 2: self.write32(addr, v)  # SW
            else: raise RuntimeError(f"Bad store f3={f3}")
            self.pc += 4
        elif opcode == OP_IMM:
            v = self.read_reg(rs1)
            if f3 == 0: res = (v + imm_i) & 0xFFFFFFFF  # ADDI
            elif f3 == 1: res = (v << (imm_i & 0x1F)) & 0xFFFFFFFF  # SLLI
            elif f3 == 2: res = 1 if self.sext(v,32) < self.sext(imm_i,12) else 0  # SLTI
            elif f3 == 3: res = 1 if v < (imm_i & 0xFFF) else 0  # SLTIU
            elif f3 == 4: res = v ^ imm_i  # XORI
            elif f3 == 5:
                if (insn >> 30) & 1:  # SRAI
                    res = (self.sext(v,32) >> (imm_i & 0x1F)) & 0xFFFFFFFF
                else:  # SRLI
                    res = (v >> (imm_i & 0x1F)) & 0xFFFFFFFF
            elif f3 == 6: res = v | imm_i  # ORI
            elif f3 == 7: res = v & imm_i  # ANDI
            else: raise RuntimeError(f"Bad OP-IMM f3={f3}")
            self.write_reg(rd, res)
            self.pc += 4
        elif opcode == OP_OP:
            v1, v2 = self.read_reg(rs1), self.read_reg(rs2)
            if f3 == 0:
                if f7 == 0: res = (v1 + v2) & 0xFFFFFFFF  # ADD
                elif f7 == 0x20: res = (v1 - v2) & 0xFFFFFFFF  # SUB
                else: raise RuntimeError(f"Bad f7={f7}")
            elif f3 == 1: res = (v1 << (v2 & 0x1F)) & 0xFFFFFFFF  # SLL
            elif f3 == 2: res = 1 if self.sext(v1,32) < self.sext(v2,32) else 0  # SLT
            elif f3 == 3: res = 1 if v1 < v2 else 0  # SLTU
            elif f3 == 4: res = v1 ^ v2  # XOR
            elif f3 == 5:
                if f7 == 0: res = v1 >> (v2 & 0x1F)  # SRL
                elif f7 == 0x20: res = (self.sext(v1,32) >> (v2 & 0x1F)) & 0xFFFFFFFF  # SRA
                else: raise RuntimeError(f"Bad f7={f7}")
            elif f3 == 6: res = v1 | v2  # OR
            elif f3 == 7: res = v1 & v2  # AND
            else: raise RuntimeError(f"Bad OP f3={f3}")
            self.write_reg(rd, res)
            self.pc += 4
        else:
            if opcode == 0:
                self.running = False
                return False
            raise RuntimeError(f"Unknown opcode {opcode:02x} at PC {self.pc:08x}")
        return True

    def run(self, max_inst: Optional[int] = None):
        self.running = True
        while self.running:
            if max_inst and self.instruction_count >= max_inst:
                raise RuntimeError("Instruction limit exceeded")
            self.step()

    def dump(self):
        names = ['zero','ra','sp','gp','tp','t0','t1','t2','s0','s1','a0','a1','a2','a3','a4','a5',
                 'a6','a7','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','t3','t4','t5','t6']
        for i in range(32):
            print(f"  x{i:02d} {names[i]:4s}: 0x{self.regs[i]:08x}")
        print(f"  PC: 0x{self.pc:08x}")
        print(f"  Executed: {self.instruction_count}")

print("RV32I core loaded")

# === Simple Assembler ===
REGS = {'zero':0,'ra':1,'sp':2,'gp':3,'tp':4,'t0':5,'t1':6,'t2':7,
        's0':8,'s1':9,'a0':10,'a1':11,'a2':12,'a3':13,'a4':14,'a5':15,
        'a6':16,'a7':17,'s2':18,'s3':19,'s4':20,'s5':21,'s6':22,'s7':23,
        's8':24,'s9':25,'s10':26,'s11':27,'t3':28,'t4':29,'t5':30,'t6':31}

def r_n(n):
    return int(n[1:]) if n.startswith('x') else REGS[n]

def asm(code: str) -> bytes:
    code = code.strip()
    labels = {}
    addr = 0
    for line in code.split('\n'):
        line = line.strip()
        if ':' in line and not line.startswith('#'):
            lbl = line.split(':')[0].strip()
            labels[lbl] = addr
        elif line and not line.startswith('#'):
            addr += 4
    
    insns = []
    addr = 0
    for line in code.split('\n'):
        line = line.strip()
        if not line or line.startswith('#') or ':' in line:
            continue
        # strip inline comment
        if '#' in line:
            line = line.split('#')[0].strip()
        p = [x.strip().rstrip(',') for x in line.replace(',', ' ').split()]
        op, args = p[0].lower(), p[1:]
        insn = 0
        
        if op == 'addi':
            insn = 0x13 | (r_n(args[0]) << 7) | (0 << 12) | (r_n(args[1]) << 15) | (int(args[2]) & 0xFFF) << 20
        elif op == 'slti':
            insn = 0x13 | (r_n(args[0]) << 7) | (2 << 12) | (r_n(args[1]) << 15) | (int(args[2]) & 0xFFF) << 20
        elif op == 'andi':
            insn = 0x13 | (r_n(args[0]) << 7) | (7 << 12) | (r_n(args[1]) << 15) | (int(args[2]) & 0xFFF) << 20
        elif op == 'ori':
            insn = 0x13 | (r_n(args[0]) << 7) | (6 << 12) | (r_n(args[1]) << 15) | (int(args[2]) & 0xFFF) << 20
        elif op == 'xori':
            insn = 0x13 | (r_n(args[0]) << 7) | (4 << 12) | (r_n(args[1]) << 15) | (int(args[2]) & 0xFFF) << 20
        elif op == 'slli':
            insn = 0x13 | (r_n(args[0]) << 7) | (1 << 12) | (r_n(args[1]) << 15) | ((int(args[2]) & 0x1F) << 20)
        elif op == 'srli':
            insn = 0x13 | (r_n(args[0]) << 7) | (5 << 12) | (r_n(args[1]) << 15) | ((int(args[2]) & 0x1F) << 20)
        elif op == 'srai':
            insn = 0x13 | (r_n(args[0]) << 7) | (5 << 12) | (r_n(args[1]) << 15) | (0x400 << 20) | ((int(args[2]) & 0x1F) << 20)
        elif op == 'lui':
            insn = 0x37 | (r_n(args[0]) << 7) | ((int(args[1]) & 0xFFFFF) << 12)
        elif op == 'auipc':
            insn = 0x17 | (r_n(args[0]) << 7) | ((int(args[1]) & 0xFFFFF) << 12)
        elif op == 'add':
            insn = 0x33 | (r_n(args[0]) << 7) | (0 << 12) | (r_n(args[1]) << 15) | (r_n(args[2]) << 20)
        elif op == 'sub':
            insn = 0x33 | (r_n(args[0]) << 7) | (0 << 12) | (r_n(args[1]) << 15) | (r_n(args[2]) << 20) | (0x20 << 25)
        elif op == 'and':
            insn = 0x33 | (r_n(args[0]) << 7) | (7 << 12) | (r_n(args[1]) << 15) | (r_n(args[2]) << 20)
        elif op == 'or':
            insn = 0x33 | (r_n(args[0]) << 7) | (6 << 12) | (r_n(args[1]) << 15) | (r_n(args[2]) << 20)
        elif op == 'xor':
            insn = 0x33 | (r_n(args[0]) << 7) | (4 << 12) | (r_n(args[1]) << 15) | (r_n(args[2]) << 20)
        elif op == 'sll':
            insn = 0x33 | (r_n(args[0]) << 7) | (1 << 12) | (r_n(args[1]) << 15) | (r_n(args[2]) << 20)
        elif op == 'srl':
            insn = 0x33 | (r_n(args[0]) << 7) | (5 << 12) | (r_n(args[1]) << 15) | (r_n(args[2]) << 20)
        elif op == 'sra':
            insn = 0x33 | (r_n(args[0]) << 7) | (5 << 12) | (r_n(args[1]) << 15) | (r_n(args[2]) << 20) | (0x20 << 25)
        elif op == 'slt':
            insn = 0x33 | (r_n(args[0]) << 7) | (2 << 12) | (r_n(args[1]) << 15) | (r_n(args[2]) << 20)
        elif op == 'sltu':
            insn = 0x33 | (r_n(args[0]) << 7) | (3 << 12) | (r_n(args[1]) << 15) | (r_n(args[2]) << 20)
        elif op in ('lw','lh','lb','lhu','lbu'):
            rd, rest = args[0], args[1]
            off, rs = rest.split('(')
            rs = rs.rstrip(')')
            f3 = {'lb':0,'lh':1,'lw':2,'lbu':4,'lhu':5}[op]
            insn = 0x03 | (r_n(rd) << 7) | (f3 << 12) | (r_n(rs) << 15) | (int(off) << 20)
        elif op in ('sw','sh','sb'):
            rs2, rest = args[0], args[1]
            off, rs = rest.split('(')
            rs = rs.rstrip(')')
            f3 = {'sb':0,'sh':1,'sw':2}[op]
            imm = int(off)
            imm_lo, imm_hi = imm & 0x1F, (imm >> 5) & 0x7F
            insn = 0x23 | (imm_lo << 7) | (f3 << 12) | (r_n(rs) << 15) | (r_n(rs2) << 20) | (imm_hi << 25)
        elif op in ('beq','bne','blt','bge','bltu','bgeu'):
            f3 = {'beq':0,'bne':1,'blt':4,'bge':5,'bltu':6,'bgeu':7}[op]
            rs1, rs2, tgt = args
            t = labels.get(tgt, int(tgt)) - addr
            insn = 0x63 | ((t >> 11) & 1) << 7 | ((t >> 1) & 0xF) << 8 | (f3 << 12) | (r_n(rs1) << 15) | (r_n(rs2) << 20) | ((t >> 5) & 0x3F) << 25 | ((t >> 12) & 1) << 31
        elif op == 'jal':
            rd = r_n(args[0])
            tgt = args[1]
            t = labels.get(tgt, int(tgt)) - addr
            insn = 0x6F | (rd << 7) | ((t >> 12) & 0xFF) << 12 | ((t >> 11) & 1) << 20 | ((t >> 1) & 0x3FF) << 21 | ((t >> 20) & 1) << 31
        elif op == 'jalr':
            insn = 0x67 | (r_n(args[0]) << 7) | (0 << 12) | (r_n(args[1]) << 15) | (int(args[2]) << 20)
        else:
            raise ValueError(f"Unknown op: {op}")
        
        insns.append(struct.pack('<I', insn))
        addr += 4
    return b''.join(insns)

if __name__ == "__main__":
    print("Testing RV32I emulator...")
    e = RV32IEmulator()
    
    # Test 1: addi
    e.load(asm("addi x1, x0, 42"))
    e.reset()
    e.run()
    assert e.read_reg(1) == 42, f"Test 1 failed: x1={e.read_reg(1)}"
    print("Test 1 PASS: ADDI")
    
    # Test 2: add
    e.load(asm("addi x1, x0, 10\naddi x2, x0, 32\nadd x3, x1, x2"))
    e.reset()
    e.run()
    assert e.read_reg(3) == 42, f"Test 2 failed: x3={e.read_reg(3)}"
    print("Test 2 PASS: ADD")
    
    # Test 3: memory
    e.load(asm("addi x1, x0, 100\nsw x1, 0(x0)\nlw x2, 0(x0)"))
    e.reset()
    e.run()
    assert e.read_reg(2) == 100, f"Test 3 failed: x2={e.read_reg(2)}"
    print("Test 3 PASS: SW/LW")
    
    # Test 4: branch
    e.load(asm("""
        addi x1, x0, 5
        addi x2, x0, 5
        beq x1, x2, eq
        addi x3, x0, 0
        jal x0, done
    eq:
        addi x3, x0, 1
    done:
    """))
    e.reset()
    e.run()
    assert e.read_reg(3) == 1, f"Test 4 failed: x3={e.read_reg(3)}"
    print("Test 4 PASS: BEQ/branch")
    
    # Test 5: Fibonacci (10th = 55)
    e.load(asm("""
        addi x1, x0, 10
        addi x2, x0, 0
        addi x3, x0, 1
    loop:
        beq x1, x0, done
        add x4, x2, x3
        add x2, x0, x3
        add x3, x0, x4
        addi x1, x1, -1
        jal x0, loop
    done:
    """))
    e.reset()
    e.run(max_inst=1000)
    assert e.read_reg(4) == 55, f"Test 5 failed: x4={e.read_reg(4)}"
    print("Test 5 PASS: Fibonacci loop")
    
    print("\nAll tests passed. Clean build. Substrate operational.")
