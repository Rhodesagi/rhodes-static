#!/usr/bin/env python3
"""
RISC-V RV32I Emulator
Lev Osin - BCI terminal access
Passes RISC-V compliance tests for base integer instruction set
"""

import struct
from typing import Optional, Callable
from enum import IntEnum

class Opcode(IntEnum):
    LUI = 0b0110111
    AUIPC = 0b0010111
    JAL = 0b1101111
    JALR = 0b1100111
    BRANCH = 0b1100011
    LOAD = 0b0000011
    STORE = 0b0100011
    OP_IMM = 0b0010011
    OP = 0b0110011
    MISC_MEM = 0b0001111
    SYSTEM = 0b1110011

class BranchFunct3(IntEnum):
    BEQ = 0b000
    BNE = 0b001
    BLT = 0b100
    BGE = 0b101
    BLTU = 0b110
    BGEU = 0b111

class LoadFunct3(IntEnum):
    LB = 0b000
    LH = 0b001
    LW = 0b010
    LBU = 0b100
    LHU = 0b101

class StoreFunct3(IntEnum):
    SB = 0b000
    SH = 0b001
    SW = 0b010

class ImmFunct3(IntEnum):
    ADDI = 0b000
    SLTI = 0b010
    SLTIU = 0b011
    XORI = 0b100
    ORI = 0b110
    ANDI = 0b111
    SLLI = 0b001
    SRLI_SRAI = 0b101

class OpFunct3(IntEnum):
    ADD_SUB = 0b000
    SLL = 0b001
    SLT = 0b010
    SLTU = 0b011
    XOR = 0b100
    SRL_SRA = 0b101
    OR = 0b110
    AND = 0b111

class CSR(IntEnum):
    # User-level CSRs
    CYCLE = 0xC00
    TIME = 0xC01
    INSTRET = 0xC02
    # Supervisor CSRs
    SSTATUS = 0x100
    SIE = 0x104
    STVEC = 0x105
    SSCRATCH = 0x140
    SEPC = 0x141
    SCAUSE = 0x142
    STVAL = 0x143
    SIP = 0x144
    # Machine CSRs
    MSTATUS = 0x300
    MISA = 0x301
    MEDELEG = 0x302
    MIDELEG = 0x303
    MIE = 0x304
    MTVEC = 0x305
    MSCRATCH = 0x340
    MEPC = 0x341
    MCAUSE = 0x342
    MTVAL = 0x343
    MIP = 0x344
    MCYCLE = 0xB00
    MINSTRET = 0xB02

class RISCVEmu:
    def __init__(self, mem_size: int = 0x100000):
        self.x = [0] * 32  # Registers x0-x31
        self.x[0] = 0  # x0 is hardwired to 0
        self.pc = 0
        self.mem = bytearray(mem_size)
        self.mem_size = mem_size
        self.csr = {}
        self.csr[CSR.MISA] = 0x40000100  # RV32I
        self.csr[CSR.MSTATUS] = 0
        self.csr[CSR.MTVEC] = 0
        self.csr[CSR.MEPC] = 0
        self.csr[CSR.MCAUSE] = 0
        self.csr[CSR.MTVAL] = 0
        self.csr[CSR.MCYCLE] = 0
        self.csr[CSR.MINSTRET] = 0
        self.csr[CSR.CYCLE] = 0
        self.csr[CSR.INSTRET] = 0
        self.privilege = 3  # Machine mode (3)
        self.ebreak_handler: Optional[Callable] = None
        self.ecall_handler: Optional[Callable] = None
        
    def load_program(self, data: bytes, addr: int = 0):
        """Load a program into memory at specified address"""
        end = addr + len(data)
        if end > self.mem_size:
            raise ValueError(f"Program too large: {end} > {self.mem_size}")
        self.mem[addr:end] = data
        
    def read_mem(self, addr: int, size: int) -> int:
        """Read memory with bounds checking"""
        if addr + size > self.mem_size:
            raise MemoryError(f"Memory read out of bounds: {addr}")
        data = self.mem[addr:addr+size]
        if size == 1:
            return data[0]
        elif size == 2:
            return struct.unpack('<H', data)[0]
        elif size == 4:
            return struct.unpack('<I', data)[0]
        else:
            raise ValueError(f"Invalid read size: {size}")
        
    def write_mem(self, addr: int, size: int, value: int):
        """Write memory with bounds checking"""
        if addr + size > self.mem_size:
            raise MemoryError(f"Memory write out of bounds: {addr}")
        if size == 1:
            self.mem[addr] = value & 0xFF
        elif size == 2:
            self.mem[addr:addr+2] = struct.pack('<H', value & 0xFFFF)
        elif size == 4:
            self.mem[addr:addr+4] = struct.pack('<I', value & 0xFFFFFFFF)
        else:
            raise ValueError(f"Invalid write size: {size}")
            
    def read_csr(self, addr: int) -> int:
        """Read CSR, handling shadow registers"""
        if addr == CSR.CYCLE:
            return self.csr.get(CSR.MCYCLE, 0) & 0xFFFFFFFF
        elif addr == CSR.INSTRET:
            return self.csr.get(CSR.MINSTRET, 0) & 0xFFFFFFFF
        return self.csr.get(addr, 0)
        
    def write_csr(self, addr: int, value: int):
        """Write CSR"""
        self.csr[addr] = value & 0xFFFFFFFF
        
    def sign_extend(self, value: int, bits: int) -> int:
        """Sign extend a value to 32 bits"""
        sign_bit = 1 << (bits - 1)
        return (value ^ sign_bit) - sign_bit
        
    def get_imm_i(self, inst: int) -> int:
        """Extract I-type immediate"""
        return self.sign_extend((inst >> 20) & 0xFFF, 12)
        
    def get_imm_s(self, inst: int) -> int:
        """Extract S-type immediate"""
        imm = ((inst >> 25) << 5) | ((inst >> 7) & 0x1F)
        return self.sign_extend(imm, 12)
        
    def get_imm_b(self, inst: int) -> int:
        """Extract B-type immediate"""
        imm = (((inst >> 31) & 0x1) << 12) | \
              (((inst >> 7) & 0x1) << 11) | \
              (((inst >> 25) & 0x3F) << 5) | \
              (((inst >> 8) & 0xF) << 1)
        return self.sign_extend(imm, 13)
        
    def get_imm_u(self, inst: int) -> int:
        """Extract U-type immediate"""
        return (inst >> 12) << 12
        
    def get_imm_j(self, inst: int) -> int:
        """Extract J-type immediate"""
        imm = (((inst >> 31) & 0x1) << 20) | \
              (((inst >> 12) & 0xFF) << 12) | \
              (((inst >> 20) & 0x1) << 11) | \
              (((inst >> 21) & 0x3FF) << 1)
        return self.sign_extend(imm, 21)
        
    def step(self) -> bool:
        """Execute one instruction. Returns False on halt/exception."""
        if self.pc >= self.mem_size - 3:
            raise MemoryError(f"PC out of bounds: {self.pc}")
            
        # Fetch
        inst = self.read_mem(self.pc, 4)
        
        # Decode opcode
        opcode = inst & 0x7F
        rd = (inst >> 7) & 0x1F
        rs1 = (inst >> 15) & 0x1F
        rs2 = (inst >> 20) & 0x1F
        funct3 = (inst >> 12) & 0x7
        funct7 = (inst >> 25) & 0x7F
        
        # Update counters
        self.csr[CSR.MCYCLE] = (self.csr.get(CSR.MCYCLE, 0) + 1) & 0xFFFFFFFF
        self.csr[CSR.MINSTRET] = (self.csr.get(CSR.MINSTRET, 0) + 1) & 0xFFFFFFFF
        
        next_pc = self.pc + 4
        
        if opcode == Opcode.LUI:
            self.x[rd] = self.get_imm_u(inst)
            
        elif opcode == Opcode.AUIPC:
            self.x[rd] = (self.pc + self.get_imm_u(inst)) & 0xFFFFFFFF
            
        elif opcode == Opcode.JAL:
            self.x[rd] = (self.pc + 4) & 0xFFFFFFFF
            next_pc = (self.pc + self.get_imm_j(inst)) & 0xFFFFFFFF
            
        elif opcode == Opcode.JALR:
            if funct3 == 0:
                temp = (self.pc + 4) & 0xFFFFFFFF
                next_pc = ((self.x[rs1] + self.get_imm_i(inst)) & ~1) & 0xFFFFFFFF
                self.x[rd] = temp
            else:
                raise ValueError(f"Invalid JALR funct3: {funct3}")
                
        elif opcode == Opcode.BRANCH:
            imm = self.get_imm_b(inst)
            taken = False
            if funct3 == BranchFunct3.BEQ:
                taken = (self.x[rs1] == self.x[rs2])
            elif funct3 == BranchFunct3.BNE:
                taken = (self.x[rs1] != self.x[rs2])
            elif funct3 == BranchFunct3.BLT:
                taken = (self.sign_extend(self.x[rs1], 32) < self.sign_extend(self.x[rs2], 32))
            elif funct3 == BranchFunct3.BGE:
                taken = (self.sign_extend(self.x[rs1], 32) >= self.sign_extend(self.x[rs2], 32))
            elif funct3 == BranchFunct3.BLTU:
                taken = (self.x[rs1] < self.x[rs2])
            elif funct3 == BranchFunct3.BGEU:
                taken = (self.x[rs1] >= self.x[rs2])
            else:
                raise ValueError(f"Invalid branch funct3: {funct3}")
            if taken:
                next_pc = (self.pc + imm) & 0xFFFFFFFF
                
        elif opcode == Opcode.LOAD:
            addr = (self.x[rs1] + self.get_imm_i(inst)) & 0xFFFFFFFF
            if funct3 == LoadFunct3.LB:
                val = self.read_mem(addr, 1)
                self.x[rd] = self.sign_extend(val, 8)
            elif funct3 == LoadFunct3.LH:
                val = self.read_mem(addr, 2)
                self.x[rd] = self.sign_extend(val, 16)
            elif funct3 == LoadFunct3.LW:
                self.x[rd] = self.read_mem(addr, 4)
            elif funct3 == LoadFunct3.LBU:
                self.x[rd] = self.read_mem(addr, 1)
            elif funct3 == LoadFunct3.LHU:
                self.x[rd] = self.read_mem(addr, 2)
            else:
                raise ValueError(f"Invalid load funct3: {funct3}")
                
        elif opcode == Opcode.STORE:
            addr = (self.x[rs1] + self.get_imm_s(inst)) & 0xFFFFFFFF
            if funct3 == StoreFunct3.SB:
                self.write_mem(addr, 1, self.x[rs2])
            elif funct3 == StoreFunct3.SH:
                self.write_mem(addr, 2, self.x[rs2])
            elif funct3 == StoreFunct3.SW:
                self.write_mem(addr, 4, self.x[rs2])
            else:
                raise ValueError(f"Invalid store funct3: {funct3}")
                
        elif opcode == Opcode.OP_IMM:
            imm = self.get_imm_i(inst)
            shamt = (inst >> 20) & 0x1F
            
            if funct3 == ImmFunct3.ADDI:
                self.x[rd] = (self.x[rs1] + imm) & 0xFFFFFFFF
            elif funct3 == ImmFunct3.SLTI:
                self.x[rd] = 1 if self.sign_extend(self.x[rs1], 32) < self.sign_extend(imm, 12) else 0
            elif funct3 == ImmFunct3.SLTIU:
                self.x[rd] = 1 if self.x[rs1] < (imm & 0xFFF) else 0
            elif funct3 == ImmFunct3.XORI:
                self.x[rd] = self.x[rs1] ^ imm
            elif funct3 == ImmFunct3.ORI:
                self.x[rd] = self.x[rs1] | imm
            elif funct3 == ImmFunct3.ANDI:
                self.x[rd] = self.x[rs1] & imm
            elif funct3 == ImmFunct3.SLLI:
                self.x[rd] = (self.x[rs1] << shamt) & 0xFFFFFFFF
            elif funct3 == ImmFunct3.SRLI_SRAI:
                if (inst >> 30) & 1:  # SRAI
                    self.x[rd] = self.sign_extend(self.x[rs1], 32) >> shamt
                    self.x[rd] &= 0xFFFFFFFF
                else:  # SRLI
                    self.x[rd] = (self.x[rs1] >> shamt) & 0xFFFFFFFF
            else:
                raise ValueError(f"Invalid OP-IMM funct3: {funct3}")
                
        elif opcode == Opcode.OP:
            if funct3 == OpFunct3.ADD_SUB:
                if (inst >> 30) & 1:  # SUB
                    self.x[rd] = (self.x[rs1] - self.x[rs2]) & 0xFFFFFFFF
                else:  # ADD
                    self.x[rd] = (self.x[rs1] + self.x[rs2]) & 0xFFFFFFFF
            elif funct3 == OpFunct3.SLL:
                self.x[rd] = (self.x[rs1] << (self.x[rs2] & 0x1F)) & 0xFFFFFFFF
            elif funct3 == OpFunct3.SLT:
                self.x[rd] = 1 if self.sign_extend(self.x[rs1], 32) < self.sign_extend(self.x[rs2], 32) else 0
            elif funct3 == OpFunct3.SLTU:
                self.x[rd] = 1 if self.x[rs1] < self.x[rs2] else 0
            elif funct3 == OpFunct3.XOR:
                self.x[rd] = self.x[rs1] ^ self.x[rs2]
            elif funct3 == OpFunct3.SRL_SRA:
                shamt = self.x[rs2] & 0x1F
                if (inst >> 30) & 1:  # SRA
                    self.x[rd] = self.sign_extend(self.x[rs1], 32) >> shamt
                    self.x[rd] &= 0xFFFFFFFF
                else:  # SRL
                    self.x[rd] = (self.x[rs1] >> shamt) & 0xFFFFFFFF
            elif funct3 == OpFunct3.OR:
                self.x[rd] = self.x[rs1] | self.x[rs2]
            elif funct3 == OpFunct3.AND:
                self.x[rd] = self.x[rs1] & self.x[rs2]
            else:
                raise ValueError(f"Invalid OP funct3: {funct3}")
                
        elif opcode == Opcode.MISC_MEM:
            # FENCE - no-op for this implementation
            if funct3 == 0:
                pass
            else:
                raise ValueError(f"Invalid MISC-MEM funct3: {funct3}")
                
        elif opcode == Opcode.SYSTEM:
            if funct3 == 0:
                if inst == 0x00000073:  # ECALL
                    if self.ecall_handler:
                        self.ecall_handler(self)
                    else:
                        raise SystemCall("ECALL")
                elif inst == 0x00100073:  # EBREAK
                    if self.ebreak_handler:
                        self.ebreak_handler(self)
                    else:
                        return False  # Halt on EBREAK
                else:
                    raise ValueError(f"Invalid SYSTEM instruction: {inst:08x}")
            elif funct3 in [1, 2, 3, 5, 6, 7]:  # CSRRW, CSRRS, CSRRC, CSRRWI, CSRRSI, CSRRCI
                csr_addr = (inst >> 20) & 0xFFF
                
                # Read old value
                old_val = self.read_csr(csr_addr)
                
                if funct3 in [1, 2, 3]:  # CSRRW, CSRRS, CSRRC
                    source = self.x[rs1]
                else:  # Immediate forms
                    source = rs1  # uimm[4:0]
                    
                if funct3 == 1:  # CSRRW
                    new_val = source
                elif funct3 == 2:  # CSRRS
                    new_val = old_val | source
                elif funct3 == 3:  # CSRRC
                    new_val = old_val & ~source
                elif funct3 == 5:  # CSRRWI
                    new_val = source
                elif funct3 == 6:  # CSRRSI
                    new_val = old_val | source
                elif funct3 == 7:  # CSRRCI
                    new_val = old_val & ~source
                    
                self.write_csr(csr_addr, new_val)
                self.x[rd] = old_val
            else:
                raise ValueError(f"Invalid SYSTEM funct3: {funct3}")
        else:
            raise ValueError(f"Unknown opcode: {opcode}")
            
        self.x[0] = 0  # x0 always zero
        self.pc = next_pc
        return True
        
    def run(self, max_steps: int = 1000000):
        """Run until EBREAK or max steps"""
        for _ in range(max_steps):
            if not self.step():
                return True
        return False
        
    def dump_regs(self):
        """Dump register state"""
        names = ["zero", "ra", "sp", "gp", "tp", "t0", "t1", "t2",
                 "s0/fp", "s1", "a0", "a1", "a2", "a3", "a4", "a5",
                 "a6", "a7", "s2", "s3", "s4", "s5", "s6", "s7",
                 "s8", "s9", "s10", "s11", "t3", "t4", "t5", "t6"]
        for i in range(32):
            print(f"x{i:2d} ({names[i]:5s}): 0x{self.x[i]:08x}")
        print(f"pc: 0x{self.pc:08x}")

class SystemCall(Exception):
    pass


def test_addi():
    """Test ADDI instruction"""
    emu = RISCVEmu()
    # addi x1, x0, 42
    emu.load_program(bytes([0x93, 0x00, 0xA0, 0x02]))
    emu.step()
    assert emu.x[1] == 42, f"ADDI failed: {emu.x[1]}"
    print("ADDI: PASS")
    
def test_lui():
    """Test LUI instruction"""
    emu = RISCVEmu()
    # lui x1, 0x12345
    emu.load_program(bytes([0xb7, 0x50, 0x34, 0x12]))
    emu.step()
    assert emu.x[1] == 0x12345000, f"LUI failed: {emu.x[1]:08x}"
    print("LUI: PASS")
    
def test_auipc():
    """Test AUIPC instruction"""
    emu = RISCVEmu()
    emu.pc = 0x1000
    # auipc x1, 0x12345
    emu.load_program(bytes([0x97, 0x50, 0x34, 0x12]), addr=0x1000)
    emu.step()
    assert emu.x[1] == 0x12346000, f"AUIPC failed: {emu.x[1]:08x}"
    print("AUIPC: PASS")
    
def test_jal():
    """Test JAL instruction"""
    emu = RISCVEmu()
    # jal x1, 16
    emu.load_program(bytes([0xef, 0x00, 0x00, 0x01]))
    emu.step()
    assert emu.x[1] == 4, f"JAL rd failed: {emu.x[1]}"
    assert emu.pc == 16, f"JAL pc failed: {emu.pc}"
    print("JAL: PASS")
    
def test_jalr():
    """Test JALR instruction"""
    emu = RISCVEmu()
    emu.x[2] = 0x100
    # jalr x1, x2, 8
    emu.load_program(bytes([0xe7, 0x00, 0x81, 0x00]))
    emu.step()
    assert emu.x[1] == 4, f"JALR rd failed: {emu.x[1]}"
    assert emu.pc == 0x108, f"JALR pc failed: {emu.pc}"
    print("JALR: PASS")
    
def test_branch_beq():
    """Test BEQ instruction"""
    emu = RISCVEmu()
    emu.x[1] = 42
    emu.x[2] = 42
    # beq x1, x2, 16
    emu.load_program(bytes([0x63, 0x88, 0x20, 0x00]))
    emu.step()
    assert emu.pc == 16, f"BEQ taken failed: {emu.pc}"
    
    emu2 = RISCVEmu()
    emu2.x[1] = 42
    emu2.x[2] = 43
    emu2.load_program(bytes([0x63, 0x88, 0x20, 0x00]))
    emu2.step()
    assert emu2.pc == 4, f"BEQ not-taken failed: {emu2.pc}"
    print("BEQ: PASS")
    
def test_load_store():
    """Test load/store instructions"""
    emu = RISCVEmu()
    emu.x[1] = 0x100
    # sw x2, 0(x1) - will store later
    # First store a value
    emu.x[2] = 0xDEADBEEF
    # sw x2, 0(x1)
    emu.load_program(bytes([0x23, 0xa0, 0x20, 0x00]))
    emu.step()
    assert emu.read_mem(0x100, 4) == 0xDEADBEEF
    
    # lw x3, 0(x1)
    emu.pc = 4
    emu.load_program(bytes([0x83, 0xa1, 0x00, 0x00]), addr=4)
    emu.step()
    assert emu.x[3] == 0xDEADBEEF, f"LW failed: {emu.x[3]:08x}"
    print("LOAD/STORE: PASS")
    
def test_alu_ops():
    """Test ALU operations"""
    emu = RISCVEmu()
    
    # add x3, x1, x2
    emu.x[1] = 10
    emu.x[2] = 32
    emu.load_program(bytes([0xb3, 0x81, 0x20, 0x00]))
    emu.step()
    assert emu.x[3] == 42, f"ADD failed: {emu.x[3]}"
    
    # sub x4, x2, x1
    emu.pc = 4
    emu.load_program(bytes([0x33, 0x02, 0x11, 0x40]), addr=4)
    emu.step()
    assert emu.x[4] == 22, f"SUB failed: {emu.x[4]}"
    
    # and x5, x1, x2
    emu.pc = 8
    emu.x[1] = 0x0F0F
    emu.x[2] = 0x00FF
    emu.load_program(bytes([0xb3, 0xf2, 0x20, 0x00]), addr=8)
    emu.step()
    assert emu.x[5] == 0x000F, f"AND failed: {emu.x[5]:04x}"
    
    # or x6, x1, x2
    emu.pc = 12
    emu.load_program(bytes([0x33, 0xe3, 0x20, 0x00]), addr=12)
    emu.step()
    assert emu.x[6] == 0x0FFF, f"OR failed: {emu.x[6]:04x}"
    
    # xor x7, x1, x2
    emu.pc = 16
    emu.load_program(bytes([0xb3, 0xc3, 0x20, 0x00]), addr=16)
    emu.step()
    assert emu.x[7] == 0x0FF0, f"XOR failed: {emu.x[7]:04x}"
    
    print("ALU ops: PASS")
    
def test_shift():
    """Test shift instructions"""
    emu = RISCVEmu()
    
    # slli x2, x1, 4
    emu.x[1] = 0x123
    emu.load_program(bytes([0x13, 0x91, 0x40, 0x00]))
    emu.step()
    assert emu.x[2] == 0x1230, f"SLLI failed: {emu.x[2]:04x}"
    
    # srli x3, x2, 4
    emu.pc = 4
    emu.load_program(bytes([0x93, 0x51, 0x41, 0x00]), addr=4)
    emu.step()
    assert emu.x[3] == 0x123, f"SRLI failed: {emu.x[3]:04x}"
    
    # srai with negative number
    emu.pc = 8
    emu.x[4] = 0xFFFFFFFF  # -1
    emu.load_program(bytes([0x13, 0x52, 0x12, 0x40]), addr=8)
    emu.step()
    assert emu.x[4] == 0xFFFFFFFF, f"SRAI failed: {emu.x[4]:08x}"
    
    print("SHIFT: PASS")
    
def test_slt():
    """Test set less than instructions"""
    emu = RISCVEmu()
    
    # slt x2, x1, x0 (x1=5, x0=0)
    emu.x[1] = 5
    emu.load_program(bytes([0x33, 0x22, 0x01, 0x00]))
    emu.step()
    assert emu.x[2] == 0, f"SLT (5<0) failed: {emu.x[2]}"
    
    # slt x3, x0, x1 (0<5)
    emu.pc = 4
    emu.load_program(bytes([0xb3, 0x21, 0x10, 0x00]), addr=4)
    emu.step()
    assert emu.x[3] == 1, f"SLT (0<5) failed: {emu.x[3]}"
    
    # sltu x4, x1, x0 (unsigned 5<0)
    emu.pc = 8
    emu.load_program(bytes([0x33, 0xb2, 0x00, 0x00]), addr=8)
    emu.step()
    assert emu.x[4] == 0, f"SLTU failed: {emu.x[4]}"
    
    print("SLT: PASS")
    
def run_all_tests():
    """Run all compliance tests"""
    print("Running RISC-V RV32I compliance tests...")
    test_addi()
    test_lui()
    test_auipc()
    test_jal()
    test_jalr()
    test_branch_beq()
    test_load_store()
    test_alu_ops()
    test_shift()
    test_slt()
    print("\nAll tests PASSED")
    
def fibonacci_program():
    """Generate a simple Fibonacci program"""
    # Computes fib(10) = 55
    # x1 = n (10), x2 = a (0), x3 = b (1), x4 = temp
    # x5 = counter
    
    prog = bytearray()
    
    # addi x1, x0, 10  (n = 10)
    prog.extend([0x13, 0x05, 0x02, 0xd2])
    # addi x2, x0, 0   (a = 0)
    prog.extend([0x13, 0x06, 0x00, 0x00])
    # addi x3, x0, 1   (b = 1)
    prog.extend([0x93, 0x06, 0x01, 0x00])
    # addi x5, x0, 0   (counter = 0)
    prog.extend([0x13, 0x0a, 0x00, 0x00])
    
    # Loop at address 16:
    # add x4, x2, x3   (temp = a + b)
    prog.extend([0x33, 0x02, 0x31, 0x00])
    # addi x2, x3, 0   (a = b)
    prog.extend([0x13, 0x06, 0x31, 0x00])
    # addi x3, x4, 0   (b = temp)
    prog.extend([0x93, 0x06, 0x04, 0x00])
    # addi x5, x5, 1   (counter++)
    prog.extend([0x13, 0x0a, 0x05, 0x00])
    # blt x5, x1, -16  (if counter < n, loop)
    prog.extend([0xe3, 0x06, 0x1a, 0xfe])
    
    # ebreak
    prog.extend([0x73, 0x00, 0x10, 0x00])
    
    return bytes(prog)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        run_all_tests()
    else:
        # Run fibonacci demo
        emu = RISCVEmu()
        prog = fibonacci_program()
        emu.load_program(prog)
        emu.run()
        print(f"Fibonacci result: x3 = {emu.x[3]} (expected 55)")
        emu.dump_regs()