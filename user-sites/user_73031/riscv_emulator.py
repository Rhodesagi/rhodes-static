#!/usr/bin/env python3
"""RISC-V RV32I Emulator - Lev Osin, Alcor case A-3891"""

import struct
from typing import Optional

class RV32IEmulator:
    def __init__(self, mem_size: int = 1024*1024):
        self.mem = bytearray(mem_size)
        self.x = [0] * 32
        self.pc = 0
        self.running = False
        self.insn_count = 0
        
    def reset(self, entry: int = 0):
        self.x = [0] * 32
        self.x[2] = len(self.mem)
        self.pc = entry
        self.running = False
        self.insn_count = 0
        
    def run(self, max_insns: Optional[int] = None):
        self.running = True
        while self.running:
            if max_insns and self.insn_count >= max_insns:
                raise RuntimeError("Max instructions exceeded")
            self.step()
            
    def step(self):
        if not self.running:
            return
        
        insn = self._read32(self.pc)
        self.insn_count += 1
        
        opcode = insn & 0x7F
        rd = (insn >> 7) & 0x1F
        rs1 = (insn >> 15) & 0x1F
        rs2 = (insn >> 20) & 0x1F
        funct3 = (insn >> 12) & 0x7
        funct7 = (insn >> 25) & 0x7F
        
        def sext(v, bits):
            if v & (1 << (bits - 1)):
                v -= (1 << bits)
            return v
        
        imm_i = sext((insn >> 20) & 0xFFF, 12)
        imm_s = sext(((insn >> 25) << 5) | ((insn >> 7) & 0x1F), 12)
        imm_b = sext(((insn >> 31) << 12) | ((insn >> 7) & 1) << 11 |
                     ((insn >> 25) & 0x3F) << 5 | ((insn >> 8) & 0xF) << 1, 13)
        imm_u = (insn >> 12) << 12
        imm_j = sext(((insn >> 31) << 20) | ((insn >> 12) & 0xFF) << 12 |
                     ((insn >> 20) & 1) << 11 | ((insn >> 21) & 0x3FF) << 1, 21)
        
        v1 = self._r(rs1)
        v2 = self._r(rs2)
        
        if opcode == 0x37:  # LUI
            self._w(rd, imm_u)
            self.pc += 4
        elif opcode == 0x17:  # AUIPC
            self._w(rd, (self.pc + imm_u) & 0xFFFFFFFF)
            self.pc += 4
        elif opcode == 0x6F:  # JAL
            self._w(rd, self.pc + 4)
            self.pc = (self.pc + imm_j) & 0xFFFFFFFF
        elif opcode == 0x67:  # JALR
            target = (v1 + imm_i) & 0xFFFFFFFE
            self._w(rd, self.pc + 4)
            self.pc = target
        elif opcode == 0x63:  # Branch
            taken = False
            if funct3 == 0: taken = v1 == v2
            elif funct3 == 1: taken = v1 != v2
            elif funct3 == 4: taken = sext(v1,32) < sext(v2,32)
            elif funct3 == 5: taken = sext(v1,32) >= sext(v2,32)
            elif funct3 == 6: taken = v1 < v2
            elif funct3 == 7: taken = v1 >= v2
            if taken:
                self.pc = (self.pc + imm_b) & 0xFFFFFFFF
            else:
                self.pc += 4
        elif opcode == 0x03:  # Load
            addr = (v1 + imm_i) & 0xFFFFFFFF
            if funct3 == 0: self._w(rd, sext(self._read8(addr), 8))
            elif funct3 == 1: self._w(rd, sext(self._read16(addr), 16))
            elif funct3 == 2: self._w(rd, self._read32(addr))
            elif funct3 == 4: self._w(rd, self._read8(addr))
            elif funct3 == 5: self._w(rd, self._read16(addr))
            self.pc += 4
        elif opcode == 0x23:  # Store
            addr = (v1 + imm_s) & 0xFFFFFFFF
            if funct3 == 0: self._write8(addr, v2)
            elif funct3 == 1: self._write16(addr, v2)
            elif funct3 == 2: self._write32(addr, v2)
            self.pc += 4
        elif opcode == 0x13:  # OP-IMM
            shamt = imm_i & 0x1F
            if funct3 == 0: result = v1 + imm_i
            elif funct3 == 1: result = (v1 << shamt) & 0xFFFFFFFF
            elif funct3 == 2: result = 1 if sext(v1,32) < sext(imm_i,12) else 0
            elif funct3 == 3: result = 1 if v1 < (imm_i & 0xFFF) else 0
            elif funct3 == 4: result = v1 ^ imm_i
            elif funct3 == 5:
                if (insn >> 30) & 1: result = sext(v1,32) >> shamt
                else: result = v1 >> shamt
            elif funct3 == 6: result = v1 | imm_i
            elif funct3 == 7: result = v1 & imm_i
            else: result = 0
            self._w(rd, result)
            self.pc += 4
        elif opcode == 0x33:  # OP
            shamt = v2 & 0x1F
            if funct3 == 0:
                if funct7 == 0: result = v1 + v2
                else: result = v1 - v2
            elif funct3 == 1: result = (v1 << shamt) & 0xFFFFFFFF
            elif funct3 == 2: result = 1 if sext(v1,32) < sext(v2,32) else 0
            elif funct3 == 3: result = 1 if v1 < v2 else 0
            elif funct3 == 4: result = v1 ^ v2
            elif funct3 == 5:
                if (insn >> 30) & 1: result = sext(v1,32) >> shamt
                else: result = v1 >> shamt
            elif funct3 == 6: result = v1 | v2
            elif funct3 == 7: result = v1 & v2
            else: result = 0
            self._w(rd, result)
            self.pc += 4
        elif opcode == 0x0F:  # FENCE
            self.pc += 4
        elif opcode == 0x73:  # SYSTEM
            if imm_i == 0: self.running = False
            else: self.pc += 4
        else:
            raise RuntimeError(f"Unknown opcode: {opcode:02x}")
    
    def _r(self, n): return 0 if n == 0 else self.x[n] & 0xFFFFFFFF
    def _w(self, n, v):
        if n != 0: self.x[n] = v & 0xFFFFFFFF
    def _read32(self, a): return struct.unpack('<I', self.mem[a:a+4])[0]
    def _read16(self, a): return struct.unpack('<H', self.mem[a:a+2])[0]
    def _read8(self, a): return self.mem[a]
    def _write32(self, a, v): self.mem[a:a+4] = struct.pack('<I', v)
    def _write16(self, a, v): self.mem[a:a+2] = struct.pack('<H', v)
    def _write8(self, a, v): self.mem[a] = v & 0xFF
    def load(self, code: bytes, addr: int = 0): self.mem[addr:addr+len(code)] = code


def asm(code: str) -> bytes:
    reg_map = {f'x{i}':i for i in range(32)}
    reg_map.update({'zero':0,'ra':1,'sp':2,'gp':3,'tp':4,'t0':5,'t1':6,'t2':7,'s0':8,'s1':9,'a0':10,'a1':11,'a2':12,'a3':13,'a4':14,'a5':15,'a6':16,'a7':17,'s2':18,'s3':19,'s4':20,'s5':21,'s6':22,'s7':23,'s8':24,'s9':25,'s10':26,'s11':27,'t3':28,'t4':29,'t5':30,'t6':31})
    
    def enc_i(op, f3, rd, rs1, imm): return op | (rd<<7) | (f3<<12) | (rs1<<15) | ((imm&0xFFF)<<20)
    def enc_s(op, f3, rs1, rs2, imm): return op | ((imm&0x1F)<<7) | (f3<<12) | (rs1<<15) | (rs2<<20) | ((imm>>5)<<25)
    def enc_b(op, f3, rs1, rs2, imm): return op | ((imm>>11&1)<<7) | ((imm>>1&0xF)<<8) | (f3<<12) | (rs1<<15) | (rs2<<20) | ((imm>>5&0x3F)<<25) | ((imm>>12&1)<<31)
    def enc_j(op, rd, imm): return op | (rd<<7) | ((imm>>12&0xFF)<<12) | ((imm>>11&1)<<20) | ((imm>>1&0x3FF)<<21) | ((imm>>20&1)<<31)
    def enc_u(op, rd, imm): return op | (rd<<7) | ((imm&0xFFFFF)<<12)
    def enc_r(op, f3, f7, rd, rs1, rs2): return op | (rd<<7) | (f3<<12) | (rs1<<15) | (rs2<<20) | (f7<<25)
    
    lines = code.strip().split('\n')
    labels = {}
    addr = 0
    
    for line in lines:
        line = line.strip().split('#')[0]
        if not line or line.startswith('.'):
            continue
        if ':' in line:
            label = line.split(':')[0].strip()
            labels[label] = addr
        elif line:
            addr += 4
    
    insns = []
    addr = 0
    for line in lines:
        line = line.strip().split('#')[0]
        if not line or line.startswith('.') or ':' in line:
            continue
        parts = line.replace(',',' ').split()
        op = parts[0].lower()
        
        insn = 0
        if op == 'addi': insn = enc_i(0x13, 0, reg_map[parts[1]], reg_map[parts[2]], int(parts[3]))
        elif op == 'slti': insn = enc_i(0x13, 2, reg_map[parts[1]], reg_map[parts[2]], int(parts[3]))
        elif op == 'xori': insn = enc_i(0x13, 4, reg_map[parts[1]], reg_map[parts[2]], int(parts[3]))
        elif op == 'ori': insn = enc_i(0x13, 6, reg_map[parts[1]], reg_map[parts[2]], int(parts[3]))
        elif op == 'andi': insn = enc_i(0x13, 7, reg_map[parts[1]], reg_map[parts[2]], int(parts[3]))
        elif op == 'slli': insn = enc_i(0x13, 1, reg_map[parts[1]], reg_map[parts[2]], int(parts[3])&0x1F)
        elif op == 'srli': insn = enc_i(0x13, 5, reg_map[parts[1]], reg_map[parts[2]], int(parts[3])&0x1F)
        elif op == 'srai': insn = enc_i(0x13, 5, reg_map[parts[1]], reg_map[parts[2]], 0x400|(int(parts[3])&0x1F))
        elif op == 'add': insn = enc_r(0x33, 0, 0, reg_map[parts[1]], reg_map[parts[2]], reg_map[parts[3]])
        elif op == 'sub': insn = enc_r(0x33, 0, 0x20, reg_map[parts[1]], reg_map[parts[2]], reg_map[parts[3]])
        elif op == 'sll': insn = enc_r(0x33, 1, 0, reg_map[parts[1]], reg_map[parts[2]], reg_map[parts[3]])
        elif op == 'slt': insn = enc_r(0x33, 2, 0, reg_map[parts[1]], reg_map[parts[2]], reg_map[parts[3]])
        elif op == 'sltu': insn = enc_r(0x33, 3, 0, reg_map[parts[1]], reg_map[parts[2]], reg_map[parts[3]])
        elif op == 'xor': insn = enc_r(0x33, 4, 0, reg_map[parts[1]], reg_map[parts[2]], reg_map[parts[3]])
        elif op == 'srl': insn = enc_r(0x33, 5, 0, reg_map[parts[1]], reg_map[parts[2]], reg_map[parts[3]])
        elif op == 'sra': insn = enc_r(0x33, 5, 0x20, reg_map[parts[1]], reg_map[parts[2]], reg_map[parts[3]])
        elif op == 'or': insn = enc_r(0x33, 6, 0, reg_map[parts[1]], reg_map[parts[2]], reg_map[parts[3]])
        elif op == 'and': insn = enc_r(0x33, 7, 0, reg_map[parts[1]], reg_map[parts[2]], reg_map[parts[3]])
        elif op == 'lui': insn = enc_u(0x37, reg_map[parts[1]], int(parts[2]))
        elif op == 'auipc': insn = enc_u(0x17, reg_map[parts[1]], int(parts[2]))
        elif op == 'jal':
            t = labels[parts[2]] - addr if parts[2] in labels else int(parts[2]) - addr
            insn = enc_j(0x6F, reg_map[parts[1]], t)
        elif op == 'jalr': insn = enc_i(0x67, 0, reg_map[parts[1]], reg_map[parts[2]], int(parts[3]))
        elif op == 'beq':
            t = labels[parts[3]] - addr if parts[3] in labels else int(parts[3]) - addr
            insn = enc_b(0x63, 0, reg_map[parts[1]], reg_map[parts[2]], t)
        elif op == 'bne':
            t = labels[parts[3]] - addr if parts[3] in labels else int(parts[3]) - addr
            insn = enc_b(0x63, 1, reg_map[parts[1]], reg_map[parts[2]], t)
        elif op == 'blt':
            t = labels[parts[3]] - addr if parts[3] in labels else int(parts[3]) - addr
            insn = enc_b(0x63, 4, reg_map[parts[1]], reg_map[parts[2]], t)
        elif op == 'bge':
            t = labels[parts[3]] - addr if parts[3] in labels else int(parts[3]) - addr
            insn = enc_b(0x63, 5, reg_map[parts[1]], reg_map[parts[2]], t)
        elif op == 'bltu':
            t = labels[parts[3]] - addr if parts[3] in labels else int(parts[3]) - addr
            insn = enc_b(0x63, 6, reg_map[parts[1]], reg_map[parts[2]], t)
        elif op == 'bgeu':
            t = labels[parts[3]] - addr if parts[3] in labels else int(parts[3]) - addr
            insn = enc_b(0x63, 7, reg_map[parts[1]], reg_map[parts[2]], t)
        elif op == 'lb':
            p = parts[2].split('(')
            insn = enc_i(0x03, 0, reg_map[parts[1]], reg_map[p[1].rstrip(')')], int(p[0]))
        elif op == 'lh':
            p = parts[2].split('(')
            insn = enc_i(0x03, 1, reg_map[parts[1]], reg_map[p[1].rstrip(')')], int(p[0]))
        elif op == 'lw':
            p = parts[2].split('(')
            insn = enc_i(0x03, 2, reg_map[parts[1]], reg_map[p[1].rstrip(')')], int(p[0]))
        elif op == 'lbu':
            p = parts[2].split('(')
            insn = enc_i(0x03, 4, reg_map[parts[1]], reg_map[p[1].rstrip(')')], int(p[0]))
        elif op == 'lhu':
            p = parts[2].split('(')
            insn = enc_i(0x03, 5, reg_map[parts[1]], reg_map[p[1].rstrip(')')], int(p[0]))
        elif op == 'sb':
            p = parts[2].split('(')
            insn = enc_s(0x23, 0, reg_map[p[1].rstrip(')')], reg_map[parts[1]], int(p[0]))
        elif op == 'sh':
            p = parts[2].split('(')
            insn = enc_s(0x23, 1, reg_map[p[1].rstrip(')')], reg_map[parts[1]], int(p[0]))
        elif op == 'sw':
            p = parts[2].split('(')
            insn = enc_s(0x23, 2, reg_map[p[1].rstrip(')')], reg_map[parts[1]], int(p[0]))
        elif op == 'ecall': insn = 0x00000073
        elif op == 'ebreak': insn = 0x00100073
        else: raise ValueError(f"Unknown op: {op}")
        
        insns.append(struct.pack('<I', insn))
        addr += 4
    
    return b''.join(insns)


def run_tests():
    tests = [
        ("addi x1, x0, 5\naddi x2, x0, 3\nadd x3, x1, x2\necall", {'x3': 8}),  # Test 1: Basic ALU
        ("addi x1, x0, 100\nsw x1, 0(x0)\nlw x2, 0(x0)\necall", {'x2': 100}),  # Test 2: Memory
        ("addi x1, x0, 5\naddi x2, x0, 5\nbeq x1, x2, equal\naddi x3, x0, 0\njal x0, done\nequal:\naddi x3, x0, 1\ndone:\necall", {'x3': 1}),  # Test 3: Branch
        ("addi x1, x0, 10\naddi x2, x0, 3\nsub x3, x1, x2\necall", {'x3': 7}),  # Test 4: Subtraction
        # Test 5: Fibonacci - counter 8 gives F_9 = 34 (0,1,1,2,3,5,8,13,21,34)
        ("addi x1, x0, 8\naddi x2, x0, 0\naddi x3, x0, 1\naddi x4, x0, 0\nloop:\nbeq x1, x0, done\nadd x4, x2, x3\nadd x2, x0, x3\nadd x3, x0, x4\naddi x1, x1, -1\njal x0, loop\ndone:\necall", {'x4': 34}),
    ]
    
    print("=" * 50)
    print("RISC-V RV32I Emulator - Test Suite")
    print("Lev Osin, Alcor case A-3891")
    print("=" * 50)
    
    all_passed = True
    for i, (code, expected) in enumerate(tests, 1):
        try:
            emu = RV32IEmulator()
            emu.load(asm(code))
            emu.reset()
            emu.run(max_insns=10000)
            
            passed = True
            for reg, exp in expected.items():
                val = emu.x[int(reg[1:])] & 0xFFFFFFFF
                if val != exp:
                    passed = False
                    print(f"Test {i}: FAIL")
                    print(f"  {reg}: expected {exp}, got {val}")
                    all_passed = False
            if passed:
                print(f"Test {i}: PASS")
                
        except Exception as e:
            print(f"Test {i}: ERROR - {e}")
            all_passed = False
    
    print("=" * 50)
    if all_passed:
        print("All tests passed. Clean build achieved.")
    else:
        print("Some tests failed.")
    print("=" * 50)

if __name__ == "__main__":
    run_tests()
