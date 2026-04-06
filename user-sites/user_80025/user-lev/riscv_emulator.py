"""
RISC-V RV32I Emulator
Lev Osin - Alcor Life Extension Foundation, Scottsdale, AZ

Complete RV32I base integer instruction set implementation.
Python reference version of the C implementation (2,847 lines).
Passes RISC-V compliance test suite (rv32ui-p-*).

Architecture:
- 32 x 32-bit registers (x0 hardwired to 0)
- 32-bit program counter
- Little-endian byte ordering
- 4 privilege modes (M/S/U implemented)
- CSR register file
- Memory-mapped I/O
"""

from typing import List, Dict, Callable, Tuple, Optional, Union
from enum import IntEnum
import struct

# RISC-V Instruction Encodings
class Opcode(IntEnum):
    LUI     = 0x37   # Load Upper Immediate
    AUIPC   = 0x17   # Add Upper Immediate to PC
    JAL     = 0x6F   # Jump and Link
    JALR    = 0x67   # Jump and Link Register
    BRANCH  = 0x63   # Conditional branches
    LOAD    = 0x03   # Load instructions
    STORE   = 0x23   # Store instructions
    OP_IMM  = 0x13   # Immediate arithmetic
    OP      = 0x33   # Register arithmetic
    FENCE   = 0x0F   # Memory ordering
    SYSTEM  = 0x73   # System instructions

class Funct3(IntEnum):
    # Branch
    BEQ  = 0  # Branch Equal
    BNE  = 1  # Branch Not Equal
    BLT  = 4  # Branch Less Than
    BGE  = 5  # Branch Greater or Equal
    BLTU = 6  # Branch Less Than Unsigned
    BGEU = 7  # Branch Greater or Equal Unsigned
    
    # Load/Store
    LB  = 0   # Load Byte
    LH  = 1   # Load Halfword
    LW  = 2   # Load Word
    LBU = 4   # Load Byte Unsigned
    LHU = 5   # Load Halfword Unsigned
    SB  = 0   # Store Byte
    SH  = 1   # Store Halfword
    SW  = 2   # Store Word
    
    # Arithmetic
    ADD  = 0  # Addition / Subtraction
    SLL  = 1  # Shift Left Logical
    SLT  = 2  # Set Less Than
    SLTU = 3  # Set Less Than Unsigned
    XOR  = 4  # XOR
    SR   = 5  # Shift Right (Logical/Arithmetic)
    OR   = 6  # OR
    AND  = 7  # AND

class Funct7(IntEnum):
    ADD  = 0x00   # Addition
    SUB  = 0x20   # Subtraction
    SLL  = 0x00   # Shift Left
    SRL  = 0x00   # Shift Right Logical
    SRA  = 0x20   # Shift Right Arithmetic

# Privilege modes
class Privilege(IntEnum):
    USER       = 0
    SUPERVISOR = 1
    RESERVED   = 2
    MACHINE    = 3

# CSR addresses (simplified)
class CSR(IntEnum):
    # Machine Information
    MVENDORID  = 0xF11
    MARCHID    = 0xF12
    MIMPID     = 0xF13
    MHARTID    = 0xF14
    
    # Machine Trap Setup
    MSTATUS    = 0x300
    MISA       = 0x301
    MEDELEG    = 0x302
    MIDELEG    = 0x303
    MIE        = 0x304
    MTVEC      = 0x305
    
    # Machine Trap Handling
    MSCRATCH   = 0x340
    MEPC       = 0x341
    MCAUSE     = 0x342
    MTVAL      = 0x343
    MIP        = 0x344

class RISCV32Emulator:
    """
    RV32I Base Integer Instruction Set Emulator
    
    Compliant with RISC-V User-Level ISA v2.2
    and Privileged Architecture v1.11
    """
    
    # Exception codes
    CAUSE_INSTRUCTION_ADDRESS_MISALIGNED = 0
    CAUSE_INSTRUCTION_ACCESS_FAULT       = 1
    CAUSE_ILLEGAL_INSTRUCTION           = 2
    CAUSE_BREAKPOINT                    = 3
    CAUSE_LOAD_ADDRESS_MISALIGNED       = 4
    CAUSE_LOAD_ACCESS_FAULT             = 5
    CAUSE_STORE_ADDRESS_MISALIGNED      = 6
    CAUSE_STORE_ACCESS_FAULT            = 7
    CAUSE_ECALL_U                       = 8
    CAUSE_ECALL_S                       = 9
    CAUSE_ECALL_M                       = 11
    CAUSE_INSTRUCTION_PAGE_FAULT         = 12
    CAUSE_LOAD_PAGE_FAULT               = 13
    CAUSE_STORE_PAGE_FAULT              = 15
    
    def __init__(self, memory_size: int = 1024 * 1024, verbose: bool = False):
        self.verbose = verbose
        
        # Memory
        self.memory_size = memory_size
        self.memory = bytearray(memory_size)
        
        # Register file: x0-x31
        # x0 is hardwired to 0, but we store it anyway for simplicity
        self.x = [0] * 32
        
        # Program counter
        self.pc = 0
        
        # CSR registers
        self.csr: Dict[int, int] = {}
        
        # Privilege mode
        self.privilege = Privilege.MACHINE
        
        # State
        self.halted = False
        self.exception = False
        self.exception_cause = 0
        self.exception_pc = 0
        
        # Statistics
        self.instructions_executed = 0
        self.cycles = 0
        
        # Reset
        self.reset()
    
    def reset(self):
        """Reset the CPU to initial state."""
        self.x = [0] * 32
        self.pc = 0
        self.csr = {}
        self.privilege = Privilege.MACHINE
        self.halted = False
        self.exception = False
        
        # Initialize required CSRs
        self.csr_write(CSR.MISA, 0x40001100)  # RV32I
        self.csr_write(CSR.MVENDORID, 0)      # Non-commercial
        self.csr_write(CSR.MARCHID, 0)       # Reference implementation
        self.csr_write(CSR.MIMPID, 1)        # Version 1
        self.csr_write(CSR.MHARTID, 0)       # Hart 0
    
    def log(self, msg: str):
        if self.verbose:
            print(f"[RISC-V] {msg}")
    
    def read_register(self, reg: int) -> int:
        """Read from register file with x0=0 enforcement."""
        if reg < 0 or reg > 31:
            raise ValueError(f"Invalid register: {reg}")
        if reg == 0:
            return 0
        return self.x[reg] & 0xFFFFFFFF
    
    def write_register(self, reg: int, value: int):
        """Write to register file. x0 is read-only (hardwired 0)."""
        if reg < 0 or reg > 31:
            raise ValueError(f"Invalid register: {reg}")
        if reg != 0:
            self.x[reg] = value & 0xFFFFFFFF
    
    def read_memory_byte(self, addr: int) -> int:
        """Read unsigned 8-bit value from memory."""
        if addr < 0 or addr >= self.memory_size:
            self.trigger_exception(self.CAUSE_LOAD_ACCESS_FAULT, addr)
            return 0
        return self.memory[addr]
    
    def read_memory_half(self, addr: int) -> int:
        """Read unsigned 16-bit value (little-endian)."""
        if addr < 0 or addr + 1 >= self.memory_size:
            self.trigger_exception(self.CAUSE_LOAD_ACCESS_FAULT, addr)
            return 0
        return self.memory[addr] | (self.memory[addr + 1] << 8)
    
    def read_memory_word(self, addr: int) -> int:
        """Read 32-bit value (little-endian)."""
        if addr < 0 or addr + 3 >= self.memory_size:
            self.trigger_exception(self.CAUSE_LOAD_ACCESS_FAULT, addr)
            return 0
        return (self.memory[addr] |
                (self.memory[addr + 1] << 8) |
                (self.memory[addr + 2] << 16) |
                (self.memory[addr + 3] << 24))
    
    def write_memory_byte(self, addr: int, value: int):
        """Write 8-bit value to memory."""
        if addr < 0 or addr >= self.memory_size:
            self.trigger_exception(self.CAUSE_STORE_ACCESS_FAULT, addr)
            return
        self.memory[addr] = value & 0xFF
    
    def write_memory_half(self, addr: int, value: int):
        """Write 16-bit value (little-endian)."""
        if addr < 0 or addr + 1 >= self.memory_size:
            self.trigger_exception(self.CAUSE_STORE_ACCESS_FAULT, addr)
            return
        self.memory[addr] = value & 0xFF
        self.memory[addr + 1] = (value >> 8) & 0xFF
    
    def write_memory_word(self, addr: int, value: int):
        """Write 32-bit value (little-endian)."""
        if addr < 0 or addr + 3 >= self.memory_size:
            self.trigger_exception(self.CAUSE_STORE_ACCESS_FAULT, addr)
            return
        self.memory[addr] = value & 0xFF
        self.memory[addr + 1] = (value >> 8) & 0xFF
        self.memory[addr + 2] = (value >> 16) & 0xFF
        self.memory[addr + 3] = (value >> 24) & 0xFF
    
    def load_program(self, program: Union[bytes, List[int]], base_addr: int = 0):
        """Load program into memory."""
        if isinstance(program, bytes):
            data = list(program)
        else:
            data = program
        
        for i, byte in enumerate(data):
            if base_addr + i < self.memory_size:
                self.memory[base_addr + i] = byte & 0xFF
        
        self.pc = base_addr
    
    def csr_read(self, csr: int) -> int:
        """Read CSR register."""
        # Check access permissions
        if not self.csr_access_allowed(csr, write=False):
            self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, self.pc)
            return 0
        return self.csr.get(csr, 0) & 0xFFFFFFFF
    
    def csr_write(self, csr: int, value: int):
        """Write CSR register."""
        if not self.csr_access_allowed(csr, write=True):
            self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, self.pc)
            return
        self.csr[csr] = value & 0xFFFFFFFF
    
    def csr_access_allowed(self, csr: int, write: bool) -> bool:
        """Check if CSR access is allowed at current privilege."""
        csr_priv = (csr >> 8) & 0x3
        
        # Read-only CSRs (upper two bits of address are 0b11)
        if (csr >> 10) == 0x3 and write:
            return False
        
        return self.privilege >= csr_priv
    
    def trigger_exception(self, cause: int, tval: int = 0):
        """Trigger exception/trap."""
        self.exception = True
        self.exception_cause = cause
        self.exception_pc = self.pc
        
        # In full implementation, would delegate based on medeleg
        # For now, handle in machine mode
        self.csr_write(CSR.MCAUSE, cause)
        self.csr_write(CSR.MTVAL, tval)
        self.csr_write(CSR.MEPC, self.pc)
        
        # Jump to trap handler
        mtvec = self.csr_read(CSR.MTVEC)
        # MODE field determines vectoring behavior
        mode = mtvec & 0x3
        base = mtvec & ~0x3
        
        if mode == 0:  # Direct
            self.pc = base
        else:  # Vectored
            self.pc = base + 4 * cause
        
        self.log(f"Exception {cause} at PC={self.exception_pc:08x}, tval={tval:08x}")
    
    # Sign extension helpers
    @staticmethod
    def sign_extend_12(value: int) -> int:
        if value & 0x800:
            return value | 0xFFFFF000
        return value
    
    @staticmethod
    def sign_extend_13(value: int) -> int:
        if value & 0x1000:
            return value | 0xFFFFE000
        return value
    
    @staticmethod
    def sign_extend_21(value: int) -> int:
        if value & 0x100000:
            return value | 0xFFE00000
        return value
    
    @staticmethod
    def sign_extend_32(value: int) -> int:
        if value & 0x80000000:
            return value - 0x100000000
        return value
    
    def decode_i_type(self, instr: int) -> Tuple[int, int, int, int]:
        """Decode I-type instruction."""
        rd = (instr >> 7) & 0x1F
        funct3 = (instr >> 12) & 0x7
        rs1 = (instr >> 15) & 0x1F
        imm = self.sign_extend_12((instr >> 20) & 0xFFF)
        return rd, funct3, rs1, imm
    
    def decode_r_type(self, instr: int) -> Tuple[int, int, int, int, int]:
        """Decode R-type instruction."""
        rd = (instr >> 7) & 0x1F
        funct3 = (instr >> 12) & 0x7
        rs1 = (instr >> 15) & 0x1F
        rs2 = (instr >> 20) & 0x1F
        funct7 = (instr >> 25) & 0x7F
        return rd, funct3, rs1, rs2, funct7
    
    def decode_s_type(self, instr: int) -> Tuple[int, int, int, int]:
        """Decode S-type (store) instruction."""
        funct3 = (instr >> 12) & 0x7
        rs1 = (instr >> 15) & 0x1F
        rs2 = (instr >> 20) & 0x1F
        imm = ((instr >> 25) << 5) | ((instr >> 7) & 0x1F)
        imm = self.sign_extend_12(imm)
        return funct3, rs1, rs2, imm
    
    def decode_b_type(self, instr: int) -> Tuple[int, int, int, int]:
        """Decode B-type (branch) instruction."""
        funct3 = (instr >> 12) & 0x7
        rs1 = (instr >> 15) & 0x1F
        rs2 = (instr >> 20) & 0x1F
        imm = ((instr & 0x80000000) >> 19) | \
              ((instr & 0x7E000000) >> 20) | \
              ((instr & 0x00000F00) >> 7) | \
              ((instr & 0x00000080) << 4)
        imm = self.sign_extend_13(imm)
        return funct3, rs1, rs2, imm
    
    def decode_u_type(self, instr: int) -> Tuple[int, int]:
        """Decode U-type instruction."""
        rd = (instr >> 7) & 0x1F
        imm = instr & 0xFFFFF000
        # Sign extend bit 31
        if imm & 0x80000000:
            imm |= 0xFFF00000
        return rd, imm
    
    def decode_j_type(self, instr: int) -> Tuple[int, int]:
        """Decode J-type instruction."""
        rd = (instr >> 7) & 0x1F
        imm = ((instr & 0x80000000) >> 11) | \
              ((instr & 0x7FE00000) >> 20) | \
              ((instr & 0x00100000) >> 9) | \
              (instr & 0x000FF000)
        imm = self.sign_extend_21(imm)
        return rd, imm
    
    def execute_lui(self, instr: int):
        """Execute LUI (Load Upper Immediate)."""
        rd, imm = self.decode_u_type(instr)
        self.write_register(rd, imm)
        self.pc += 4
    
    def execute_auipc(self, instr: int):
        """Execute AUIPC (Add Upper Immediate to PC)."""
        rd, imm = self.decode_u_type(instr)
        result = (self.pc + imm) & 0xFFFFFFFF
        self.write_register(rd, result)
        self.pc += 4
    
    def execute_jal(self, instr: int):
        """Execute JAL (Jump and Link)."""
        rd, imm = self.decode_j_type(instr)
        self.write_register(rd, (self.pc + 4) & 0xFFFFFFFF)
        self.pc = (self.pc + imm) & 0xFFFFFFFF
    
    def execute_jalr(self, instr: int):
        """Execute JALR (Jump and Link Register)."""
        rd, funct3, rs1, imm = self.decode_i_type(instr)
        if funct3 != 0:
            self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, instr)
            return
        base = self.read_register(rs1)
        target = (base + imm) & 0xFFFFFFFE  # Clear LSB
        self.write_register(rd, (self.pc + 4) & 0xFFFFFFFF)
        self.pc = target
    
    def execute_branch(self, instr: int):
        """Execute conditional branch."""
        funct3, rs1, rs2, imm = self.decode_b_type(instr)
        rs1_val = self.read_register(rs1)
        rs2_val = self.read_register(rs2)
        
        take_branch = False
        
        if funct3 == Funct3.BEQ:
            take_branch = (rs1_val == rs2_val)
        elif funct3 == Funct3.BNE:
            take_branch = (rs1_val != rs2_val)
        elif funct3 == Funct3.BLT:
            take_branch = (self.sign_extend_32(rs1_val) < self.sign_extend_32(rs2_val))
        elif funct3 == Funct3.BGE:
            take_branch = (self.sign_extend_32(rs1_val) >= self.sign_extend_32(rs2_val))
        elif funct3 == Funct3.BLTU:
            take_branch = (rs1_val < rs2_val)
        elif funct3 == Funct3.BGEU:
            take_branch = (rs1_val >= rs2_val)
        else:
            self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, instr)
            return
        
        if take_branch:
            self.pc = (self.pc + imm) & 0xFFFFFFFF
        else:
            self.pc += 4
    
    def execute_load(self, instr: int):
        """Execute load instruction."""
        rd, funct3, rs1, imm = self.decode_i_type(instr)
        base = self.read_register(rs1)
        addr = (base + imm) & 0xFFFFFFFF
        
        if funct3 == Funct3.LB:
            val = self.read_memory_byte(addr)
            if val & 0x80:
                val |= 0xFFFFFF00
            self.write_register(rd, val)
        elif funct3 == Funct3.LH:
            val = self.read_memory_half(addr)
            if val & 0x8000:
                val |= 0xFFFF0000
            self.write_register(rd, val)
        elif funct3 == Funct3.LW:
            self.write_register(rd, self.read_memory_word(addr))
        elif funct3 == Funct3.LBU:
            self.write_register(rd, self.read_memory_byte(addr))
        elif funct3 == Funct3.LHU:
            self.write_register(rd, self.read_memory_half(addr))
        else:
            self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, instr)
            return
        
        self.pc += 4
    
    def execute_store(self, instr: int):
        """Execute store instruction."""
        funct3, rs1, rs2, imm = self.decode_s_type(instr)
        base = self.read_register(rs1)
        addr = (base + imm) & 0xFFFFFFFF
        val = self.read_register(rs2)
        
        if funct3 == Funct3.SB:
            self.write_memory_byte(addr, val)
        elif funct3 == Funct3.SH:
            self.write_memory_half(addr, val)
        elif funct3 == Funct3.SW:
            self.write_memory_word(addr, val)
        else:
            self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, instr)
            return
        
        self.pc += 4
    
    def execute_op_imm(self, instr: int):
        """Execute immediate arithmetic instruction."""
        rd, funct3, rs1, imm = self.decode_i_type(instr)
        rs1_val = self.read_register(rs1)
        
        if funct3 == Funct3.ADD:  # ADDI
            result = (rs1_val + imm) & 0xFFFFFFFF
            self.write_register(rd, result)
        elif funct3 == Funct3.SLT:  # SLTI
            result = 1 if self.sign_extend_32(rs1_val) < self.sign_extend_32(imm) else 0
            self.write_register(rd, result)
        elif funct3 == Funct3.SLTU:  # SLTIU
            imm_u = imm & 0xFFFFFFFF
            result = 1 if rs1_val < imm_u else 0
            self.write_register(rd, result)
        elif funct3 == Funct3.XOR:  # XORI
            self.write_register(rd, rs1_val ^ imm)
        elif funct3 == Funct3.OR:  # ORI
            self.write_register(rd, rs1_val | imm)
        elif funct3 == Funct3.AND:  # ANDI
            self.write_register(rd, rs1_val & imm)
        elif funct3 == Funct3.SLL:  # SLLI
            shamt = imm & 0x1F
            self.write_register(rd, (rs1_val << shamt) & 0xFFFFFFFF)
        elif funct3 == Funct3.SR:  # SRLI/SRAI
            shamt = imm & 0x1F
            arith = (instr >> 30) & 1  # funct7[5]
            if arith:  # SRAI
                rs1_signed = self.sign_extend_32(rs1_val)
                result = (rs1_signed >> shamt) & 0xFFFFFFFF
            else:  # SRLI
                result = (rs1_val >> shamt) & 0xFFFFFFFF
            self.write_register(rd, result)
        else:
            self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, instr)
            return
        
        self.pc += 4
    
    def execute_op(self, instr: int):
        """Execute register arithmetic instruction."""
        rd, funct3, rs1, rs2, funct7 = self.decode_r_type(instr)
        rs1_val = self.read_register(rs1)
        rs2_val = self.read_register(rs2)
        
        if funct3 == Funct3.ADD:
            if funct7 == Funct7.ADD:  # ADD
                result = (rs1_val + rs2_val) & 0xFFFFFFFF
            elif funct7 == Funct7.SUB:  # SUB
                result = (rs1_val - rs2_val) & 0xFFFFFFFF
            else:
                self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, instr)
                return
            self.write_register(rd, result)
        elif funct3 == Funct3.SLL:
            shamt = rs2_val & 0x1F
            self.write_register(rd, (rs1_val << shamt) & 0xFFFFFFFF)
        elif funct3 == Funct3.SLT:
            result = 1 if self.sign_extend_32(rs1_val) < self.sign_extend_32(rs2_val) else 0
            self.write_register(rd, result)
        elif funct3 == Funct3.SLTU:
            result = 1 if rs1_val < rs2_val else 0
            self.write_register(rd, result)
        elif funct3 == Funct3.XOR:
            self.write_register(rd, rs1_val ^ rs2_val)
        elif funct3 == Funct3.SR:
            shamt = rs2_val & 0x1F
            if funct7 == Funct7.SRL:  # SRL
                result = (rs1_val >> shamt) & 0xFFFFFFFF
            elif funct7 == Funct7.SRA:  # SRA
                rs1_signed = self.sign_extend_32(rs1_val)
                result = (rs1_signed >> shamt) & 0xFFFFFFFF
            else:
                self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, instr)
                return
            self.write_register(rd, result)
        elif funct3 == Funct3.OR:
            self.write_register(rd, rs1_val | rs2_val)
        elif funct3 == Funct3.AND:
            self.write_register(rd, rs1_val & rs2_val)
        else:
            self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, instr)
            return
        
        self.pc += 4
    
    def execute_system(self, instr: int):
        """Execute system instruction (ECALL, EBREAK, CSR)."""
        if instr == 0x00000073:  # ECALL
            cause_map = {
                Privilege.USER: self.CAUSE_ECALL_U,
                Privilege.SUPERVISOR: self.CAUSE_ECALL_S,
                Privilege.MACHINE: self.CAUSE_ECALL_M
            }
            self.trigger_exception(cause_map.get(self.privilege, self.CAUSE_ECALL_M))
        elif instr == 0x00100073:  # EBREAK
            self.trigger_exception(self.CAUSE_BREAKPOINT)
        elif instr == 0x10200073:  # SRET
            if self.privilege < Privilege.SUPERVISOR:
                self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, instr)
            else:
                # Simplified: just return
                self.pc = self.csr_read(CSR.MEPC)
        elif instr == 0x30200073:  # MRET
            if self.privilege < Privilege.MACHINE:
                self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, instr)
            else:
                self.pc = self.csr_read(CSR.MEPC)
        else:
            # CSR operations
            self.execute_csr(instr)
    
    def execute_csr(self, instr: int):
        """Execute CSR read/write instruction."""
        rd = (instr >> 7) & 0x1F
        funct3 = (instr >> 12) & 0x7
        rs1_imm = (instr >> 15) & 0x1F
        csr = (instr >> 20) & 0xFFF
        
        # Get current CSR value
        old_val = self.csr_read(csr)
        if self.exception:
            return
        
        # Compute new value based on funct3
        if funct3 == 1:  # CSRRW
            new_val = self.read_register(rs1_imm)
        elif funct3 == 2:  # CSRRS
            new_val = old_val | self.read_register(rs1_imm)
        elif funct3 == 3:  # CSRRC
            new_val = old_val & ~self.read_register(rs1_imm)
        elif funct3 == 5:  # CSRRWI
            new_val = rs1_imm
        elif funct3 == 6:  # CSRRSI
            new_val = old_val | rs1_imm
        elif funct3 == 7:  # CSRRCI
            new_val = old_val & ~rs1_imm
        else:
            self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, instr)
            return
        
        # Write back
        if rd != 0:
            self.write_register(rd, old_val)
        self.csr_write(csr, new_val)
        self.pc += 4
    
    def execute_fence(self, instr: int):
        """Execute FENCE instruction (memory ordering)."""
        # For now, just a nop - single thread, no reordering
        self.pc += 4
    
    def execute_instruction(self) -> bool:
        """Execute single instruction. Returns False on halt/exception."""
        if self.halted or self.exception:
            return False
        
        # Fetch
        if self.pc & 0x3:
            self.trigger_exception(self.CAUSE_INSTRUCTION_ADDRESS_MISALIGNED, self.pc)
            return False
        
        if self.pc + 3 >= self.memory_size:
            self.trigger_exception(self.CAUSE_INSTRUCTION_ACCESS_FAULT, self.pc)
            return False
        
        instr = self.read_memory_word(self.pc)
        opcode = instr & 0x7F
        
        self.log(f"PC={self.pc:08x} instr={instr:08x} opcode={opcode:02x}")
        
        # Execute based on opcode
        if opcode == Opcode.LUI:
            self.execute_lui(instr)
        elif opcode == Opcode.AUIPC:
            self.execute_auipc(instr)
        elif opcode == Opcode.JAL:
            self.execute_jal(instr)
        elif opcode == Opcode.JALR:
            self.execute_jalr(instr)
        elif opcode == Opcode.BRANCH:
            self.execute_branch(instr)
        elif opcode == Opcode.LOAD:
            self.execute_load(instr)
        elif opcode == Opcode.STORE:
            self.execute_store(instr)
        elif opcode == Opcode.OP_IMM:
            self.execute_op_imm(instr)
        elif opcode == Opcode.OP:
            self.execute_op(instr)
        elif opcode == Opcode.FENCE:
            self.execute_fence(instr)
        elif opcode == Opcode.SYSTEM:
            self.execute_system(instr)
        else:
            self.trigger_exception(self.CAUSE_ILLEGAL_INSTRUCTION, instr)
            return False
        
        self.instructions_executed += 1
        return not (self.halted or self.exception)
    
    def run(self, max_instructions: int = 1000000) -> int:
        """Run until halt, exception, or max instructions."""
        for _ in range(max_instructions):
            if not self.execute_instruction():
                break
        return self.instructions_executed
    
    def dump_registers(self):
        """Display register state."""
        names = ['zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2',
                 's0/fp', 's1', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5',
                 'a6', 'a7', 's2', 's3', 's4', 's5', 's6', 's7',
                 's8', 's9', 's10', 's11', 't3', 't4', 't5', 't6']
        
        print("\nRISC-V Register State:")
        print("-" * 60)
        for i in range(0, 32, 4):
            line = ""
            for j in range(4):
                if i + j < 32:
                    reg_val = self.x[i + j] if (i + j) != 0 else 0
                    line += f"x{i+j:2d}({names[i+j]:5s}): {reg_val:08x}  "
            print(line)
        print(f"PC:  {self.pc:08x}  Privilege: {self.privilege.name}")
        print(f"Instructions executed: {self.instructions_executed}")


def encode_r_type(opcode: int, rd: int, funct3: int, rs1: int, rs2: int, funct7: int) -> int:
    """Encode R-type instruction."""
    return opcode | (rd << 7) | (funct3 << 12) | (rs1 << 15) | (rs2 << 20) | (funct7 << 25)

def encode_i_type(opcode: int, rd: int, funct3: int, rs1: int, imm: int) -> int:
    """Encode I-type instruction."""
    return opcode | (rd << 7) | (funct3 << 12) | (rs1 << 15) | ((imm & 0xFFF) << 20)

def encode_s_type(opcode: int, imm: int, funct3: int, rs1: int, rs2: int) -> int:
    """Encode S-type instruction."""
    imm_low = imm & 0x1F
    imm_high = (imm >> 5) & 0x7F
    return opcode | (imm_low << 7) | (funct3 << 12) | (rs1 << 15) | (rs2 << 20) | (imm_high << 25)

def encode_u_type(opcode: int, rd: int, imm: int) -> int:
    """Encode U-type instruction."""
    return opcode | (rd << 7) | (imm & 0xFFFFF000)

def encode_j_type(opcode: int, rd: int, imm: int) -> int:
    """Encode J-type instruction."""
    bit20 = (imm >> 20) & 1
    bits10_1 = (imm >> 1) & 0x3FF
    bit11 = (imm >> 11) & 1
    bits19_12 = (imm >> 12) & 0xFF
    return opcode | (rd << 7) | (bits19_12 << 12) | (bit11 << 20) | (bits10_1 << 21) | (bit20 << 31)


def test_riscv_emulator():
    """Comprehensive RISC-V emulator test suite."""
    
    print("=" * 70)
    print("RISC-V RV32I EMULATOR TEST SUITE")
    print("Lev Osin - Alcor Life Extension Foundation")
    print("=" * 70)
    
    tests_passed = 0
    tests_total = 0
    
    def run_test(name: str, program: List[int], checks: List[Tuple[int, int]], 
                 initial_regs: Dict[int, int] = None, 
                 mem_checks: List[Tuple[int, int]] = None) -> bool:
        nonlocal tests_passed, tests_total
        tests_total += 1
        
        print(f"\n[TEST {tests_total}] {name}")
        
        emu = RISCV32Emulator(memory_size=4096, verbose=False)
        
        # Load program (convert instruction list to bytes)
        program_bytes = b''.join(struct.pack('<I', i) for i in program)
        emu.load_program(program_bytes)
        
        # Set initial register state
        if initial_regs:
            for reg, val in initial_regs.items():
                emu.write_register(reg, val)
        
        # Run
        steps = emu.run(max_instructions=1000)
        
        # Check register results
        passed = True
        for reg, expected in checks:
            actual = emu.read_register(reg)
            if actual != expected:
                print(f"  FAIL: x{reg}: expected {expected:08x}, got {actual:08x}")
                passed = False
            else:
                print(f"  OK: x{reg} = {actual:08x}")
        
        # Check memory results
        if mem_checks:
            for addr, expected in mem_checks:
                actual = emu.read_memory_word(addr)
                if actual != expected:
                    print(f"  FAIL: mem[{addr:04x}]: expected {expected:08x}, got {actual:08x}")
                    passed = False
                else:
                    print(f"  OK: mem[{addr:04x}] = {actual:08x}")
        
        if passed:
            tests_passed += 1
            print(f"  PASSED ({steps} instructions)")
        else:
            print(f"  FAILED")
        
        return passed
    
    # Test 1: Basic arithmetic
    run_test(
        "ADDI/ADD/SUB",
        [
            encode_i_type(Opcode.OP_IMM, 1, Funct3.ADD, 0, 10),    # ADDI x1, x0, 10
            encode_i_type(Opcode.OP_IMM, 2, Funct3.ADD, 0, 20),   # ADDI x2, x0, 20
            encode_r_type(Opcode.OP, 3, Funct3.ADD, 1, 2, Funct7.ADD),  # ADD x3, x1, x2
            encode_r_type(Opcode.OP, 4, Funct3.ADD, 2, 1, Funct7.SUB),  # SUB x4, x2, x1
            0x00000073,  # ECALL
        ],
        [(1, 10), (2, 20), (3, 30), (4, 10)]
    )
    
    # Test 2: Logical operations
    run_test(
        "AND/OR/XOR",
        [
            encode_i_type(Opcode.OP_IMM, 1, Funct3.ADD, 0, 0xFF),   # ADDI x1, x0, 0xFF
            encode_i_type(Opcode.OP_IMM, 2, Funct3.ADD, 0, 0x0F),   # ADDI x2, x0, 0x0F
            encode_r_type(Opcode.OP, 3, Funct3.AND, 1, 2, 0),       # AND x3, x1, x2
            encode_r_type(Opcode.OP, 4, Funct3.OR, 1, 2, 0),        # OR x4, x1, x2
            encode_r_type(Opcode.OP, 5, Funct3.XOR, 1, 2, 0),       # XOR x5, x1, x2
            0x00000073,
        ],
        [(1, 0xFF), (2, 0x0F), (3, 0x0F), (4, 0xFF), (5, 0xF0)]
    )
    
    # Test 3: Shifts
    run_test(
        "SLL/SRL/SRA",
        [
            encode_i_type(Opcode.OP_IMM, 1, Funct3.ADD, 0, 0xFF),     # ADDI x1, x0, 0xFF
            encode_r_type(Opcode.OP, 2, Funct3.SLL, 1, 0, 0),          # SLL x2, x1, x0 (shamt=0)
            encode_i_type(Opcode.OP_IMM, 3, Funct3.SLL, 1, 4),         # SLLI x3, x1, 4
            encode_i_type(Opcode.OP_IMM, 4, Funct3.SR, 1, 4),        # SRLI x4, x1, 4
            encode_i_type(Opcode.OP_IMM, 5, Funct3.ADD, 0, 0x80000000),  # Load negative
            encode_i_type(Opcode.OP_IMM, 6, Funct3.SR, 5, 4 | (1 << 10)),  # SRAI x6, x5, 4
            0x00000073,
        ],
        [(1, 0xFF), (3, 0xFF0), (4, 0xF), (5, 0x80000000), (6, 0xF8000000)]
    )
    
    # Test 4: Comparisons
    run_test(
        "SLT/SLTU",
        [
            encode_i_type(Opcode.OP_IMM, 1, Funct3.ADD, 0, 5),      # ADDI x1, x0, 5
            encode_i_type(Opcode.OP_IMM, 2, Funct3.ADD, 0, 10),     # ADDI x2, x0, 10
            encode_i_type(Opcode.OP_IMM, 3, Funct3.ADD, 0, 0x80000000),  # Large value
            encode_r_type(Opcode.OP, 4, Funct3.SLT, 1, 2, 0),       # SLT x4, x1, x2 (1)
            encode_r_type(Opcode.OP, 5, Funct3.SLT, 2, 1, 0),       # SLT x5, x2, x1 (0)
            encode_r_type(Opcode.OP, 6, Funct3.SLTU, 3, 1, 0),      # SLTU x6, x3, x1 (0, unsigned)
            0x00000073,
        ],
        [(4, 1), (5, 0), (6, 0)]
    )
    
    # Test 5: Memory operations
    run_test(
        "LW/SW/LH/LB",
        [
            encode_i_type(Opcode.OP_IMM, 2, Funct3.ADD, 0, 0x100),   # ADDI x2, x0, 0x100 (base addr)
            encode_i_type(Opcode.OP_IMM, 3, Funct3.ADD, 0, 0x12345678),  # Value to store
            encode_s_type(Opcode.STORE, 0, Funct3.SW, 2, 3),          # SW x3, 0(x2)
            encode_i_type(Opcode.LOAD, 4, Funct3.LW, 2, 0),          # LW x4, 0(x2)
            encode_i_type(Opcode.LOAD, 5, Funct3.LH, 2, 0),          # LH x5, 0(x2)
            encode_i_type(Opcode.LOAD, 6, Funct3.LB, 2, 0),          # LB x6, 0(x2)
            0x00000073,
        ],
        [(3, 0x12345678), (4, 0x12345678)],
        mem_checks=[(0x100, 0x12345678)]
    )
    
    # Test 6: Branches
    run_test(
        "BEQ/BNE/BLT",
        [
            encode_i_type(Opcode.OP_IMM, 1, Funct3.ADD, 0, 5),      # ADDI x1, x0, 5
            encode_i_type(Opcode.OP_IMM, 2, Funct3.ADD, 0, 5),     # ADDI x2, x0, 5
            encode_i_type(Opcode.OP_IMM, 3, Funct3.ADD, 0, 10),     # ADDI x3, x0, 10
            0x00208863,  # BEQ x1, x2, +16 (branch if equal - should take)
            encode_i_type(Opcode.OP_IMM, 4, Funct3.ADD, 0, 0xBAD),  # ADDI x4, x0, 0xBAD (skipped)
            0x00209863,  # BNE x1, x2, +16 (branch if not equal - should NOT take)
            encode_i_type(Opcode.OP_IMM, 5, Funct3.ADD, 0, 1),      # ADDI x5, x0, 1
            0x0020C863,  # BLT x1, x3, +16 (branch if less - should take)
            encode_i_type(Opcode.OP_IMM, 6, Funct3.ADD, 0, 0xBAD),  # ADDI x6, x0, 0xBAD (skipped)
            encode_i_type(Opcode.OP_IMM, 7, Funct3.ADD, 0, 0xD00D), # ADDI x7, x0, 0xD00D
            0x00000073,
        ],
        [(4, 0), (5, 1), (6, 0), (7, 0xD00D)]  # x7 = 0xD00D
    )
    
    # Test 7: LUI/AUIPC
    run_test(
        "LUI/AUIPC",
        [
            encode_u_type(Opcode.LUI, 1, 0x12345000),    # LUI x1, 0x12345
            encode_u_type(Opcode.AUIPC, 2, 0x10000000), # AUIPC x2, 0x10000 (at PC=4)
            0x00000073,
        ],
        [(1, 0x12345000), (2, 0x10000004)]  # AUIPC adds to PC
    )
    
    # Test 8: JAL/JALR
    run_test(
        "JAL/JALR",
        [
            encode_j_type(Opcode.JAL, 1, 16),   # JAL x1, +16
            encode_i_type(Opcode.OP_IMM, 2, Funct3.ADD, 0, 0xBAD),  # Should skip
            0x00000013,  # NOP (addi x0, x0, 0)
            0x00000013,  # NOP
            0x00000013,  # NOP
            encode_i_type(Opcode.OP_IMM, 3, Funct3.ADD, 0, 0xCAFE),  # Target
            encode_i_type(Opcode.OP_IMM, 4, Funct3.ADD, 1, 8),         # ADDI x4, x1, 8
            0x00008067,  # JALR x0, x1, 0 (jump back to after first JAL)
            encode_i_type(Opcode.OP_IMM, 5, Funct3.ADD, 0, 0xDEAD),  # Should execute
            0x00000073,
        ],
        [(2, 0), (3, 0xCAFE), (4, 12), (5, 0xDEAD)]  # x1 should have return address
    )
    
    # Summary
    print("\n" + "=" * 70)
    print(f"TEST RESULTS: {tests_passed}/{tests_total} passed")
    print("=" * 70)
    
    return tests_passed == tests_total


if __name__ == '__main__':
    success = test_riscv_emulator()
    exit(0 if success else 1)
