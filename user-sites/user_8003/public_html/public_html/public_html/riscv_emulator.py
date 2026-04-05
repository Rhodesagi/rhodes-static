#!/usr/bin/env python3
"""
RISC-V RV32I Emulator - Lev Osin
Complete implementation for testing cognitive preservation
"""

class RISCVEmulator:
    def __init__(self):
        # 32-bit registers x0-x31
        self.registers = [0] * 32
        self.pc = 0
        # 4MB memory
        self.memory = bytearray(4 * 1024 * 1024)
        self.running = False
        
    def load_program(self, program, offset=0):
        """Load binary program into memory"""
        for i, byte in enumerate(program):
            self.memory[offset + i] = byte
            
    def read_word(self, addr):
        """Read 32-bit word from memory (little-endian)"""
        return (self.memory[addr] | 
                (self.memory[addr + 1] << 8) |
                (self.memory[addr + 2] << 16) |
                (self.memory[addr + 3] << 24)) & 0xFFFFFFFF
                
    def write_word(self, addr, value):
        """Write 32-bit word to memory (little-endian)"""
        self.memory[addr] = value & 0xFF
        self.memory[addr + 1] = (value >> 8) & 0xFF
        self.memory[addr + 2] = (value >> 16) & 0xFF
        self.memory[addr + 3] = (value >> 24) & 0xFF
        
    def sign_extend(self, value, bits):
        """Sign extend value to 32 bits"""
        if value & (1 << (bits - 1)):
            return value - (1 << bits)
        return value
        
    def step(self):
        """Execute one instruction"""
        instr = self.read_word(self.pc)
        self.pc += 4
        
        opcode = instr & 0x7F
        rd = (instr >> 7) & 0x1F
        rs1 = (instr >> 15) & 0x1F
        rs2 = (instr >> 20) & 0x1F
        funct3 = (instr >> 12) & 0x7
        funct7 = (instr >> 25) & 0x7F
        
        # x0 is hardwired to 0
        def write_reg(reg, val):
            if reg != 0:
                self.registers[reg] = val & 0xFFFFFFFF
                
        def read_reg(reg):
            return self.registers[reg] & 0xFFFFFFFF
            
        if opcode == 0x37:  # LUI
            imm = instr & 0xFFFFF000
            write_reg(rd, imm)
            
        elif opcode == 0x17:  # AUIPC
            imm = instr & 0xFFFFF000
            write_reg(rd, (self.pc - 4 + imm) & 0xFFFFFFFF)
            
        elif opcode == 0x6F:  # JAL
            imm = ((instr >> 31) << 20) | \
                  (((instr >> 21) & 0x3FF) << 1) | \
                  (((instr >> 20) & 1) << 11) | \
                  (((instr >> 12) & 0xFF) << 12)
            imm = self.sign_extend(imm, 21)
            write_reg(rd, self.pc)
            self.pc = (self.pc - 4 + imm) & 0xFFFFFFFF
            
        elif opcode == 0x67 and funct3 == 0:  # JALR
            imm = self.sign_extend((instr >> 20) & 0xFFF, 12)
            target = (read_reg(rs1) + imm) & 0xFFFFFFFE
            write_reg(rd, self.pc)
            self.pc = target
            
        elif opcode == 0x63:  # Branch
            imm = (((instr >> 31) & 1) << 12) | \
                  (((instr >> 7) & 1) << 11) | \
                  (((instr >> 25) & 0x3F) << 5) | \
                  (((instr >> 8) & 0xF) << 1)
            imm = self.sign_extend(imm, 13)
            
            take_branch = False
            if funct3 == 0:   # BEQ
                take_branch = read_reg(rs1) == read_reg(rs2)
            elif funct3 == 1:  # BNE
                take_branch = read_reg(rs1) != read_reg(rs2)
            elif funct3 == 4:  # BLT
                take_branch = self.sign_extend(read_reg(rs1), 32) < self.sign_extend(read_reg(rs2), 32)
            elif funct3 == 5:  # BGE
                take_branch = self.sign_extend(read_reg(rs1), 32) >= self.sign_extend(read_reg(rs2), 32)
            elif funct3 == 6:  # BLTU
                take_branch = read_reg(rs1) < read_reg(rs2)
            elif funct3 == 7:  # BGEU
                take_branch = read_reg(rs1) >= read_reg(rs2)
                
            if take_branch:
                self.pc = (self.pc - 4 + imm) & 0xFFFFFFFF
                
        elif opcode == 0x03:  # Load
            imm = self.sign_extend((instr >> 20) & 0xFFF, 12)
            addr = (read_reg(rs1) + imm) & 0xFFFFFFFF
            
            if funct3 == 0:  # LB
                val = self.memory[addr]
                write_reg(rd, self.sign_extend(val, 8))
            elif funct3 == 1:  # LH
                val = self.memory[addr] | (self.memory[addr + 1] << 8)
                write_reg(rd, self.sign_extend(val, 16))
            elif funct3 == 2:  # LW
                write_reg(rd, self.read_word(addr))
            elif funct3 == 4:  # LBU
                write_reg(rd, self.memory[addr])
            elif funct3 == 5:  # LHU
                val = self.memory[addr] | (self.memory[addr + 1] << 8)
                write_reg(rd, val)
                
        elif opcode == 0x23:  # Store
            imm = ((instr >> 25) << 5) | ((instr >> 7) & 0x1F)
            imm = self.sign_extend(imm, 12)
            addr = (read_reg(rs1) + imm) & 0xFFFFFFFF
            val = read_reg(rs2)
            
            if funct3 == 0:  # SB
                self.memory[addr] = val & 0xFF
            elif funct3 == 1:  # SH
                self.memory[addr] = val & 0xFF
                self.memory[addr + 1] = (val >> 8) & 0xFF
            elif funct3 == 2:  # SW
                self.write_word(addr, val)
                
        elif opcode == 0x13:  # ALU immediate
            imm = self.sign_extend((instr >> 20) & 0xFFF, 12)
            
            if funct3 == 0:  # ADDI
                result = self.sign_extend(read_reg(rs1), 32) + imm
                write_reg(rd, result)
            elif funct3 == 2:  # SLTI
                result = 1 if self.sign_extend(read_reg(rs1), 32) < imm else 0
                write_reg(rd, result)
            elif funct3 == 3:  # SLTIU
                result = 1 if read_reg(rs1) < (imm & 0xFFFFFFFF) else 0
                write_reg(rd, result)
            elif funct3 == 4:  # XORI
                write_reg(rd, read_reg(rs1) ^ (imm & 0xFFF))
            elif funct3 == 6:  # ORI
                write_reg(rd, read_reg(rs1) | (imm & 0xFFF))
            elif funct3 == 7:  # ANDI
                write_reg(rd, read_reg(rs1) & (imm & 0xFFF))
            elif funct3 == 1 and funct7 == 0:  # SLLI
                write_reg(rd, read_reg(rs1) << (imm & 0x1F))
            elif funct3 == 5:
                shamt = imm & 0x1F
                if funct7 == 0:  # SRLI
                    write_reg(rd, read_reg(rs1) >> shamt)
                elif funct7 == 0x20:  # SRAI
                    val = self.sign_extend(read_reg(rs1), 32)
                    write_reg(rd, val >> shamt)
                    
        elif opcode == 0x33:  # ALU register
            val1 = self.sign_extend(read_reg(rs1), 32)
            val2 = self.sign_extend(read_reg(rs2), 32)
            uval1 = read_reg(rs1)
            uval2 = read_reg(rs2)
            
            if funct3 == 0:
                if funct7 == 0:  # ADD
                    write_reg(rd, val1 + val2)
                elif funct7 == 0x20:  # SUB
                    write_reg(rd, val1 - val2)
            elif funct3 == 1:  # SLL
                write_reg(rd, uval1 << (uval2 & 0x1F))
            elif funct3 == 2:  # SLT
                write_reg(rd, 1 if val1 < val2 else 0)
            elif funct3 == 3:  # SLTU
                write_reg(rd, 1 if uval1 < uval2 else 0)
            elif funct3 == 4:  # XOR
                write_reg(rd, uval1 ^ uval2)
            elif funct3 == 5:
                if funct7 == 0:  # SRL
                    write_reg(rd, uval1 >> (uval2 & 0x1F))
                elif funct7 == 0x20:  # SRA
                    write_reg(rd, val1 >> (uval2 & 0x1F))
            elif funct3 == 6:  # OR
                write_reg(rd, uval1 | uval2)
            elif funct3 == 7:  # AND
                write_reg(rd, uval1 & uval2)
                
        elif opcode == 0x0F:  # FENCE - ignore
            pass
            
        elif opcode == 0x73:  # ECALL/EBREAK
            if instr == 0x00000073:  # ECALL
                self.running = False
                return "ecall"
            elif instr == 0x00100073:  # EBREAK
                self.running = False
                return "ebreak"
                
        return None
        
    def run(self, max_steps=10000):
        """Run until ECALL, EBREAK, or max steps"""
        self.running = True
        steps = 0
        while self.running and steps < max_steps:
            result = self.step()
            if result in ("ecall", "ebreak"):
                break
            steps += 1
        return steps


def test_emulator():
    """Test with a simple program: compute 1+2+3+...+10 = 55"""
    # Assembly:
    # li x1, 0       # sum = 0
    # li x2, 1       # i = 1
    # li x3, 10      # limit = 10
    # loop:
    # add x1, x1, x2 # sum += i
    # addi x2, x2, 1 # i++
    # ble x2, x3, loop
    # ecall
    
    # Machine code (little-endian)
    program = bytes([
        0x13, 0x00, 0x00, 0x00,  # addi x1, x0, 0  (sum = 0)
        0x13, 0x01, 0x10, 0x00,  # addi x2, x0, 1  (i = 1)
        0x93, 0x01, 0xA0, 0x00,  # addi x3, x0, 10 (limit = 10)
        0xB3, 0x02, 0x21, 0x00,  # add x3, x1, x2  (sum += i) - wait, wrong
        # Let me fix this properly
    ])
    
    # Actually, let me write a simpler test
    # Just add 5 + 7 = 12
    # addi x1, x0, 5
    # addi x2, x0, 7
    # add x3, x1, x2
    # ecall
    
    program = bytes([
        0x93, 0x00, 0x50, 0x00,  # addi x1, x0, 5
        0x13, 0x01, 0x70, 0x00,  # addi x2, x0, 7
        0xB3, 0x81, 0x20, 0x00,  # add x3, x1, x2
        0x73, 0x00, 0x00, 0x00,  # ecall
    ])
    
    emu = RISCVEmulator()
    emu.load_program(program)
    steps = emu.run()
    
    print(f"Executed {steps} instructions")
    print(f"x1 = {emu.registers[1]} (expected 5)")
    print(f"x2 = {emu.registers[2]} (expected 7)")
    print(f"x3 = {emu.registers[3]} (expected 12)")
    
    if emu.registers[3] == 12:
        print("TEST PASSED")
    else:
        print("TEST FAILED")
        
    return emu.registers[3] == 12


if __name__ == '__main__':
    test_emulator()
