#!/usr/bin/env python3
"""RISC-V RV32I Emulator - Lev Osin, Alcor case A-3891"""

from typing import Optional
import struct

# Instruction encoding masks
OPCODE_MASK = 0x7F
FUNCT3_MASK = 0x7000
FUNCT7_MASK = 0xFE000000
RD_MASK = 0xF80
RS1_MASK = 0xF8000
RS2_MASK = 0x1F00000

# Opcodes (low 7 bits)
OP_LUI = 0x37
OP_AUIPC = 0x17
OP_JAL = 0x6F
OP_JALR = 0x67
OP_BRANCH = 0x63
OP_LOAD = 0x03
OP_STORE = 0x23
OP_IMM = 0x13
OP_OP = 0x33

# Funct3 codes
F3_BEQ, F3_BNE, F3_BLT = 0, 1, 4
F3_BGE, F3_BLTU, F3_BGEU = 5, 6, 7
F3_LB, F3_LH, F3_LW = 0, 1, 2
F3_LBU, F3_LHU = 4, 5
F3_SB, F3_SH, F3_SW = 0, 1, 2
F3_ADD, F3_SLL, F3_SLT = 0, 1, 2
F3_SLTU, F3_XOR, F3_SR = 3, 4, 5
F3_OR, F3_AND = 6, 7

class RISCV32Emulator:
    def __init__(self, memory_size=1024*1024):
        self.pc = 0
        self.regs = [0]*32
        self.memory = bytearray(memory_size)
        self.running = False
        self.instruction_count = 0
        
    def reset(self, entry_point=0):
        self.pc = entry_point
        self.regs = [0]*32
        self.regs[2] = len(self.memory)  # sp
        self.running = False
        self.instruction_count = 0
        
    def read_reg(self, reg): return 0 if reg == 0 else self.regs[reg] & 0xFFFFFFFF
    def write_reg(self, reg, val):
        if reg != 0: self.regs[reg] = val & 0xFFFFFFFF
    
    def sign_extend(self, val, bits):
        if val & (1 << (bits-1)): val -= (1 << bits)
        return val & 0xFFFFFFFF
    
    def read32(self, addr):
        if addr < 0 or addr+4 > len(self.memory): raise RuntimeError(f"Bad read32 at {addr}")
        return struct.unpack('<I', self.memory[addr:addr+4])[0]
    def read16(self, addr):
        if addr < 0 or addr+2 > len(self.memory): raise RuntimeError(f"Bad read16 at {addr}")
        return struct.unpack('<H', self.memory[addr:addr+2])[0]
    def read8(self, addr):
        if addr < 0 or addr >= len(self.memory): raise RuntimeError(f"Bad read8 at {addr}")
        return self.memory[addr]
    def write32(self, addr, val):
        if addr < 0 or addr+4 > len(self.memory): raise RuntimeError(f"Bad write32 at {addr}")
        self.memory[addr:addr+4] = struct.pack('<I', val & 0xFFFFFFFF)
    def write16(self, addr, val):
        if addr < 0 or addr+2 > len(self.memory): raise RuntimeError(f"Bad write16 at {addr}")
        self.memory[addr:addr+2] = struct.pack('<H', val & 0xFFFF)
    def write8(self, addr, val):
        if addr < 0 or addr >= len(self.memory): raise RuntimeError(f"Bad write8 at {addr}")
        self.memory[addr] = val & 0xFF
    
    def load_program(self, code, addr=0):
        if addr+len(code) > len(self.memory): raise RuntimeError("Program too large")
        self.memory[addr:addr+len(code)] = code
    
    def get_imm_i(self, insn): return self.sign_extend((insn >> 20) & 0xFFF, 12)
    def get_imm_s(self, insn):
        imm = ((insn >> 25) & 0x7F) << 5 | ((insn >> 7) & 0x1F)
        return self.sign_extend(imm, 12)
    def get_imm_b(self, insn):
        imm = ((insn >> 31) & 1) << 12
        imm |= ((insn >> 7) & 1) << 11
        imm |= ((insn >> 25) & 0x3F) << 5
        imm |= ((insn >> 8) & 0xF) << 1
        return self.sign_extend(imm, 13)
    def get_imm_u(self, insn): return (insn >> 12) & 0xFFFFF
    def get_imm_j(self, insn):
        imm = ((insn >> 31) & 1) << 20
        imm |= ((insn >> 12) & 0xFF) << 12
        imm |= ((insn >> 20) & 1) << 11
        imm |= ((insn >> 21) & 0x3FF) << 1
        return self.sign_extend(imm, 21)
    
    def step(self):
        if not self.running: return False
        insn = self.read32(self.pc)
        opcode = insn & OPCODE_MASK
        rd = (insn & RD_MASK) >> 7
        rs1 = (insn & RS1_MASK) >> 15
        rs2 = (insn & RS2_MASK) >> 20
        funct3 = (insn & FUNCT3_MASK) >> 12
        funct7 = (insn & FUNCT7_MASK) >> 25
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
            rs1v, rs2v = self.read_reg(rs1), self.read_reg(rs2)
            take = False
            if funct3 == F3_BEQ: take = rs1v == rs2v
            elif funct3 == F3_BNE: take = rs1v != rs2v
            elif funct3 == F3_BLT: take = self.sign_extend(rs1v,32) < self.sign_extend(rs2v,32)
            elif funct3 == F3_BGE: take = self.sign_extend(rs1v,32) >= self.sign_extend(rs2v,32)
            elif funct3 == F3_BLTU: take = rs1v < rs2v
            elif funct3 == F3_BGEU: take = rs1v >= rs2v
            else: raise RuntimeError(f"Bad branch funct3: {funct3}")
            self.pc = (self.pc + imm if take else self.pc + 4) & 0xFFFFFFFF
        elif opcode == OP_LOAD:
            addr = (self.read_reg(rs1) + self.get_imm_i(insn)) & 0xFFFFFFFF
            if funct3 == F3_LB: val = self.sign_extend(self.read8(addr), 8)
            elif funct3 == F3_LH: val = self.sign_extend(self.read16(addr), 16)
            elif funct3 == F3_LW: val = self.read32(addr)
            elif funct3 == F3_LBU: val = self.read8(addr)
            elif funct3 == F3_LHU: val = self.read16(addr)
            else: raise RuntimeError(f"Bad load funct3: {funct3}")
            self.write_reg(rd, val)
            self.pc += 4
        elif opcode == OP_STORE:
            addr = (self.read_reg(rs1) + self.get_imm_s(insn)) & 0xFFFFFFFF
            rs2v = self.read_reg(rs2)
            if funct3 == F3_SB: self.write8(addr, rs2v)
            elif funct3 == F3_SH: self.write16(addr, rs2v)
            elif funct3 == F3_SW: self.write32(addr, rs2v)
            else: raise RuntimeError(f"Bad store funct3: {funct3}")
            self.pc += 4
        elif opcode == OP_IMM:
            rs1v = self.read_reg(rs1)
            imm = self.get_imm_i(insn)
            if funct3 == F3_ADD: result = rs1v + imm
            elif funct3 == F3_SLL: result = (rs1v << (imm & 0x1F)) & 0xFFFFFFFF
            elif funct3 == F3_SLT: result = 1 if self.sign_extend(rs1v,32) < self.sign_extend(imm,12) else 0
            elif funct3 == F3_SLTU: result = 1 if rs1v < (imm & 0xFFF) else 0
            elif funct3 == F3_XOR: result = rs1v ^ imm
            elif funct3 == F3_SR:
                shamt = imm & 0x1F
                if (insn >> 30) & 1: result = self.sign_extend(rs1v, 32) >> shamt
                else: result = rs1v >> shamt
            elif funct3 == F3_OR: result = rs1v | imm
            elif funct3 == F3_AND: result = rs1v & imm
            else: raise RuntimeError(f"Bad OP-IMM funct3: {funct3}")
            self.write_reg(rd, result)
            self.pc += 4
        elif opcode == OP_OP:
            rs1v, rs2v = self.read_reg(rs1), self.read_reg(rs2)
            if funct3 == F3_ADD:
                if (insn >> 30) & 1: result = (rs1v - rs2v) & 0xFFFFFFFF
                else: result = (rs1v + rs2v) & 0xFFFFFFFF
            elif funct3 == F3_SLL: result = (rs1v << (rs2v & 0x1F)) & 0xFFFFFFFF
            elif funct3 == F3_SLT: result = 1 if self.sign_extend(rs1v,32) < self.sign_extend(rs2v,32) else 0
            elif funct3 == F3_SLTU: result = 1 if rs1v < rs2v else 0
            elif funct3 == F3_XOR: result = rs1v ^ rs2v
            elif funct3 == F3_SR:
                shamt = rs2v & 0x1F
                if (insn >> 30) & 1: result = self.sign_extend(rs1v, 32) >> shamt
                else: result = rs1v >> shamt
            elif funct3 == F3_OR: result = rs1v | rs2v
            elif funct3 == F3_AND: result = rs1v & rs2v
            else: raise RuntimeError(f"Bad OP funct3: {funct3}")
            self.write_reg(rd, result)
            self.pc += 4
        else:
            raise RuntimeError(f"Unknown opcode: {opcode:02x}")
        return True
    
    def run(self, max_instructions=None):
        self.running = True
        while self.running:
            if max_instructions and self.instruction_count >= max_instructions:
                raise RuntimeError("Max instructions exceeded")
            self.step()

def assemble_riscv(asm):
    REGS = {'zero':0,'ra':1,'sp':2,'gp':3,'tp':4,'t0':5,'t1':6,'t2':7,'s0':8,'s1':9,
            'a0':10,'a1':11,'a2':12,'a3':13,'a4':14,'a5':15,'a6':16,'a7':17,
            's2':18,'s3':19,'s4':20,'s5':21,'s6':22,'s7':23,'s8':24,'s9':25,'s10':26,'s11':27,
            't3':28,'t4':29,'t5':30,'t6':31}
    def pr(r):
        r = r.strip().replace(',','')
        return int(r[1:]) if r.startswith('x') else REGS[r]
    def ei(op,f3,rd,rs1,imm): return op | (rd<<7) | (f3<<12) | (rs1<<15) | ((imm&0xFFF)<<20)
    def er(op,f3,f7,rd,rs1,rs2): return op | (rd<<7) | (f3<<12) | (rs1<<15) | (rs2<<20) | (f7<<25)
    def es(op,f3,rs1,rs2,imm):
        imm_lo = imm & 0x1F
        imm_hi = (imm >> 5) & 0x7F
        return op | (imm_lo<<7) | (f3<<12) | (rs1<<15) | (rs2<<20) | (imm_hi<<25)
    def eb(op,f3,rs1,rs2,imm):
        imm_11 = (imm >> 11) & 1
        imm_4_1 = (imm >> 1) & 0xF
        imm_10_5 = (imm >> 5) & 0x3F
        imm_12 = (imm >> 12) & 1
        return op | (imm_11<<7) | (imm_4_1<<8) | (f3<<12) | (rs1<<15) | (rs2<<20) | (imm_10_5<<25) | (imm_12<<31)
    def ej(op,rd,imm):
        imm_20 = (imm >> 20) & 1
        imm_10_1 = (imm >> 1) & 0x3FF
        imm_11 = (imm >> 11) & 1
        imm_19_12 = (imm >> 12) & 0xFF
        return op | (rd<<7) | (imm_19_12<<12) | (imm_11<<20) | (imm_10_1<<21) | (imm_20<<31)
    def eu(op,rd,imm): return op | (rd<<7) | ((imm&0xFFFFF)<<12)
    
    insns = []
    labels = {}
    addr = 0
    for line in asm.strip().split('\n'):
        line = line.strip()
        if ':' in line and not line.startswith('.'):
            label = line.split(':')[0].strip()
            labels[label] = addr
        if line and not line.endswith(':'): addr += 4
    
    addr = 0
    for line in asm.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('#') or line.endswith(':'): continue
        if '#' in line: line = line.split('#')[0].strip()
        p = line.replace(',',' ').split()
        op = p[0].lower()
        
        if op == 'addi': insns.append(struct.pack('<I', ei(0x13,0,pr(p[1]),pr(p[2]),int(p[3]))))
        elif op == 'slti': insns.append(struct.pack('<I', ei(0x13,2,pr(p[1]),pr(p[2]),int(p[3]))))
        elif op == 'andi': insns.append(struct.pack('<I', ei(0x13,7,pr(p[1]),pr(p[2]),int(p[3]))))
        elif op == 'ori': insns.append(struct.pack('<I', ei(0x13,6,pr(p[1]),pr(p[2]),int(p[3]))))
        elif op == 'xori': insns.append(struct.pack('<I', ei(0x13,4,pr(p[1]),pr(p[2]),int(p[3]))))
        elif op == 'slli': insns.append(struct.pack('<I', ei(0x13,1,pr(p[1]),pr(p[2]),int(p[3])&0x1F)))
        elif op == 'srli': insns.append(struct.pack('<I', ei(0x13,5,pr(p[1]),pr(p[2]),int(p[3])&0x1F)))
        elif op == 'srai': insns.append(struct.pack('<I', ei(0x13,5,pr(p[1]),pr(p[2]),0x400|(int(p[3])&0x1F))))
        elif op == 'lui': insns.append(struct.pack('<I', eu(0x37,pr(p[1]),int(p[2])&0xFFFFF)))
        elif op == 'auipc': insns.append(struct.pack('<I', eu(0x17,pr(p[1]),int(p[2])&0xFFFFF)))
        elif op == 'add': insns.append(struct.pack('<I', er(0x33,0,0,pr(p[1]),pr(p[2]),pr(p[3]))))
        elif op == 'sub': insns.append(struct.pack('<I', er(0x33,0,0x20,pr(p[1]),pr(p[2]),pr(p[3]))))
        elif op == 'and': insns.append(struct.pack('<I', er(0x33,7,0,pr(p[1]),pr(p[2]),pr(p[3]))))
        elif op == 'or': insns.append(struct.pack('<I', er(0x33,6,0,pr(p[1]),pr(p[2]),pr(p[3]))))
        elif op == 'xor': insns.append(struct.pack('<I', er(0x33,4,0,pr(p[1]),pr(p[2]),pr(p[3]))))
        elif op == 'sll': insns.append(struct.pack('<I', er(0x33,1,0,pr(p[1]),pr(p[2]),pr(p[3]))))
        elif op == 'srl': insns.append(struct.pack('<I', er(0x33,5,0,pr(p[1]),pr(p[2]),pr(p[3]))))
        elif op == 'sra': insns.append(struct.pack('<I', er(0x33,5,0x20,pr(p[1]),pr(p[2]),pr(p[3]))))
        elif op == 'slt': insns.append(struct.pack('<I', er(0x33,2,0,pr(p[1]),pr(p[2]),pr(p[3]))))
        elif op == 'sltu': insns.append(struct.pack('<I', er(0x33,3,0,pr(p[1]),pr(p[2]),pr(p[3]))))
        elif op == 'lw':
            rd = pr(p[1])
            rest = ' '.join(p[2:])
            off, rest = rest.split('(')
            rs1 = pr(rest.rstrip(')'))
            insns.append(struct.pack('<I', ei(0x03,2,rd,rs1,int(off))))
        elif op == 'lh':
            rd = pr(p[1])
            rest = ' '.join(p[2:])
            off, rest = rest.split('(')
            rs1 = pr(rest.rstrip(')'))
            insns.append(struct.pack('<I', ei(0x03,1,rd,rs1,int(off))))
        elif op == 'lb':
            rd = pr(p[1])
            rest = ' '.join(p[2:])
            off, rest = rest.split('(')
            rs1 = pr(rest.rstrip(')'))
            insns.append(struct.pack('<I', ei(0x03,0,rd,rs1,int(off))))
        elif op == 'lhu':
            rd = pr(p[1])
            rest = ' '.join(p[2:])
            off, rest = rest.split('(')
            rs1 = pr(rest.rstrip(')'))
            insns.append(struct.pack('<I', ei(0x03,5,rd,rs1,int(off))))
        elif op == 'lbu':
            rd = pr(p[1])
            rest = ' '.join(p[2:])
            off, rest = rest.split('(')
            rs1 = pr(rest.rstrip(')'))
            insns.append(struct.pack('<I', ei(0x03,4,rd,rs1,int(off))))
        elif op == 'sw':
            rs2 = pr(p[1])
            rest = ' '.join(p[2:])
            off, rest = rest.split('(')
            rs1 = pr(rest.rstrip(')'))
            insns.append(struct.pack('<I', es(0x23,2,rs1,rs2,int(off))))
        elif op == 'sh':
            rs2 = pr(p[1])
            rest = ' '.join(p[2:])
            off, rest = rest.split('(')
            rs1 = pr(rest.rstrip(')'))
            insns.append(struct.pack('<I', es(0x23,1,rs1,rs2,int(off))))
        elif op == 'sb':
            rs2 = pr(p[1])
            rest = ' '.join(p[2:])
            off, rest = rest.split('(')
            rs1 = pr(rest.rstrip(')'))
            insns.append(struct.pack('<I', es(0x23,0,rs1,rs2,int(off))))
        elif op == 'beq':
            rs1, rs2 = pr(p[1]), pr(p[2])
            target = labels[p[3]] - addr if p[3] in labels else int(p[3])
            insns.append(struct.pack('<I', eb(0x63,0,rs1,rs2,target)))
        elif op == 'bne':
            rs1, rs2 = pr(p[1]), pr(p[2])
            target = labels[p[3]] - addr if p[3] in labels else int(p[3])
            insns.append(struct.pack('<I', eb(0x63,1,rs1,rs2,target)))
        elif op == 'blt':
            rs1, rs2 = pr(p[1]), pr(p[2])
            target = labels[p[3]] - addr if p[3] in labels else int(p[3])
            insns.append(struct.pack('<I', eb(0x63,4,rs1,rs2,target)))
        elif op == 'bge':
            rs1, rs2 = pr(p[1]), pr(p[2])
            target = labels[p[3]] - addr if p[3] in labels else int(p[3])
            insns.append(struct.pack('<I', eb(0x63,5,rs1,rs2,target)))
        elif op == 'bltu':
            rs1, rs2 = pr(p[1]), pr(p[2])
            target = labels[p[3]] - addr if p[3] in labels else int(p[3])
            insns.append(struct.pack('<I', eb(0x63,6,rs1,rs2,target)))
        elif op == 'bgeu':
            rs1, rs2 = pr(p[1]), pr(p[2])
            target = labels[p[3]] - addr if p[3] in labels else int(p[3])
            insns.append(struct.pack('<I', eb(0x63,7,rs1,rs2,target)))
        elif op == 'jal':
            rd = pr(p[1])
            target = labels[p[2]] - addr if p[2] in labels else int(p[2])
            insns.append(struct.pack('<I', ej(0x6F,rd,target)))
        elif op == 'jalr':
            insns.append(struct.pack('<I', ei(0x67,0,pr(p[1]),pr(p[2]),int(p[3]))))
        else: raise ValueError(f"Unknown: {op}")
        addr += 4
    return b''.join(insns)

def run_tests():
    tests = [
        ("addi x1, x0, 5\naddi x2, x0, 3\nadd x3, x1, x2", {'x3': 8}),
        ("addi x1, x0, 100\nsw x1, 0(x0)\nlw x2, 0(x0)", {'x2': 100}),
        ("addi x1, x0, 5\naddi x2, x0, 5\nbeq x1, x2, equal\naddi x3, x0, 0\njal x0, done\nequal:\naddi x3, x0, 1\ndone:", {'x3': 1}),
        ("addi x1, x0, 10\naddi x2, x0, 0\naddi x3, x0, 1\naddi x4, x0, 0\nloop:\nbeq x1, x0, done\nadd x4, x2, x3\nadd x2, x0, x3\nadd x3, x0, x4\naddi x1, x1, -1\njal x0, loop\ndone:", {'x4': 55}),
        ("addi x1, x0, -5\naddi x2, x0, 3\nslt x3, x1, x2", {'x3': 1}),
        ("lui x1, 1\naddi x1, x1, 0", {'x1': 0x1000}),
    ]
    
    print("=== RISC-V RV32I Emulator Tests ===")
    emu = RISCV32Emulator()
    passed = 0
    for i, (code, expected) in enumerate(tests, 1):
        try:
            code_bytes = assemble_riscv(code)
            emu.reset()
            emu.load_program(code_bytes)
            emu.run(max_instructions=10000)
            
            ok = True
            for reg, exp in expected.items():
                reg_num = int(reg[1:]) if reg.startswith('x') else 0
                actual = emu.read_reg(reg_num)
                if actual != (exp & 0xFFFFFFFF):
                    ok = False
                    print(f"Test {i}: FAIL - {reg} expected {exp}, got {actual}")
            if ok:
                print(f"Test {i}: PASS")
                passed += 1
        except Exception as e:
            print(f"Test {i}: ERROR - {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n{passed}/{len(tests)} tests passed")
    return passed == len(tests)

if __name__ == "__main__":
    ok = run_tests()
    import sys
    sys.exit(0 if ok else 1)
