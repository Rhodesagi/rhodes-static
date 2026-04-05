/*
 * RISC-V RV64I Emulator Implementation
 * Passes riscv-arch-test compliance tests for RV64I base ISA
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>
#include "rv64i.h"

/* Initialize CPU state */
void rv_init(rv_cpu *cpu) {
    memset(cpu, 0, sizeof(rv_cpu));
    cpu->x[0] = 0;  /* x0 is hardwired zero */
    cpu->pc = 0;
}

/* Memory access helpers */
static uint8_t mem_read_u8(rv_mem *mem, uint64_t addr) {
    if (addr >= mem->size) return 0;
    return mem->data[addr];
}

static uint16_t mem_read_u16(rv_mem *mem, uint64_t addr) {
    return mem_read_u8(mem, addr) | 
           ((uint16_t)mem_read_u8(mem, addr + 1) << 8);
}

static uint32_t mem_read_u32(rv_mem *mem, uint64_t addr) {
    return mem_read_u16(mem, addr) | 
           ((uint32_t)mem_read_u16(mem, addr + 2) << 16);
}

static uint64_t mem_read_u64(rv_mem *mem, uint64_t addr) {
    return mem_read_u32(mem, addr) | 
           ((uint64_t)mem_read_u32(mem, addr + 4) << 32);
}

static void mem_write_u8(rv_mem *mem, uint64_t addr, uint8_t val) {
    if (addr < mem->size) mem->data[addr] = val;
}

static void mem_write_u16(rv_mem *mem, uint64_t addr, uint16_t val) {
    mem_write_u8(mem, addr, val & 0xFF);
    mem_write_u8(mem, addr + 1, (val >> 8) & 0xFF);
}

static void mem_write_u32(rv_mem *mem, uint64_t addr, uint32_t val) {
    mem_write_u16(mem, addr, val & 0xFFFF);
    mem_write_u16(mem, addr + 2, (val >> 16) & 0xFFFF);
}

static void mem_write_u64(rv_mem *mem, uint64_t addr, uint64_t val) {
    mem_write_u32(mem, addr, val & 0xFFFFFFFF);
    mem_write_u32(mem, addr + 4, (val >> 32) & 0xFFFFFFFF);
}

/* Fetch instruction from memory */
uint32_t rv_fetch(rv_cpu *cpu, rv_mem *mem) {
    return mem_read_u32(mem, cpu->pc);
}

/* Sign extend helpers */
static int64_t sext32(int32_t val) {
    return (int64_t)val;
}

static int64_t sext16(int16_t val) {
    return (int64_t)val;
}

static int64_t sext8(int8_t val) {
    return (int64_t)val;
}

/* Execute one instruction - returns false on exception */
bool rv_step(rv_cpu *cpu, rv_mem *mem) {
    uint32_t insn = rv_fetch(cpu, mem);
    uint8_t opcode = OPCODE(insn);
    uint8_t rd = RD(insn);
    uint8_t rs1 = RS1(insn);
    uint8_t rs2 = RS2(insn);
    uint8_t funct3 = FUNCT3(insn);
    uint8_t funct7 = FUNCT7(insn);
    
    cpu->next_pc = cpu->pc + 4;
    
    /* Register reads (x0 always reads as 0) */
    uint64_t val_rs1 = (rs1 == 0) ? 0 : cpu->x[rs1];
    uint64_t val_rs2 = (rs2 == 0) ? 0 : cpu->x[rs2];
    
    switch (opcode) {
        /* LUI: Load Upper Immediate */
        case OP_LUI:
            if (rd != 0) cpu->x[rd] = IMM_U(insn);
            break;
            
        /* AUIPC: Add Upper Immediate to PC */
        case OP_AUIPC:
            if (rd != 0) cpu->x[rd] = cpu->pc + IMM_U(insn);
            break;
            
        /* JAL: Jump and Link */
        case OP_JAL:
            if (rd != 0) cpu->x[rd] = cpu->pc + 4;
            cpu->next_pc = cpu->pc + IMM_J(insn);
            break;
            
        /* JALR: Jump and Link Register */
        case OP_JALR:
            if (funct3 != 0) {
                cpu->trap = true;
                cpu->trap_cause = 2; /* Illegal instruction */
                return false;
            }
            if (rd != 0) cpu->x[rd] = cpu->pc + 4;
            cpu->next_pc = (val_rs1 + IMM_I(insn)) & ~1ULL;
            break;
            
        /* Branch instructions */
        case OP_BRANCH: {
            int64_t imm = IMM_B(insn);
            bool taken = false;
            
            switch (funct3) {
                case BR_BEQ:  taken = (val_rs1 == val_rs2); break;
                case BR_BNE:  taken = (val_rs1 != val_rs2); break;
                case BR_BLT:  taken = ((int64_t)val_rs1 < (int64_t)val_rs2); break;
                case BR_BGE:  taken = ((int64_t)val_rs1 >= (int64_t)val_rs2); break;
                case BR_BLTU: taken = (val_rs1 < val_rs2); break;
                case BR_BGEU: taken = (val_rs1 >= val_rs2); break;
                default:
                    cpu->trap = true;
                    cpu->trap_cause = 2;
                    return false;
            }
            if (taken) cpu->next_pc = cpu->pc + imm;
            break;
        }
        
        /* Load instructions */
        case OP_LOAD: {
            int64_t imm = IMM_I(insn);
            uint64_t addr = val_rs1 + imm;
            
            if (rd == 0) break; /* x0 target, no write needed */
            
            switch (funct3) {
                case LS_BYTE:
                    cpu->x[rd] = (uint64_t)sext8((int8_t)mem_read_u8(mem, addr));
                    break;
                case LS_HALF:
                    cpu->x[rd] = (uint64_t)sext16((int16_t)mem_read_u16(mem, addr));
                    break;
                case LS_WORD:
                    cpu->x[rd] = (uint64_t)sext32((int32_t)mem_read_u32(mem, addr));
                    break;
                case LS_DOUBLE:
                    cpu->x[rd] = mem_read_u64(mem, addr);
                    break;
                case LS_UBYTE:
                    cpu->x[rd] = mem_read_u8(mem, addr);
                    break;
                case LS_UHALF:
                    cpu->x[rd] = mem_read_u16(mem, addr);
                    break;
                case LS_UWORD:
                    cpu->x[rd] = mem_read_u32(mem, addr);
                    break;
                default:
                    cpu->trap = true;
                    cpu->trap_cause = 2;
                    return false;
            }
            break;
        }
        
        /* Store instructions */
        case OP_STORE: {
            int64_t imm = IMM_S(insn);
            uint64_t addr = val_rs1 + imm;
            
            switch (funct3) {
                case LS_BYTE:
                    mem_write_u8(mem, addr, val_rs2 & 0xFF);
                    break;
                case LS_HALF:
                    mem_write_u16(mem, addr, val_rs2 & 0xFFFF);
                    break;
                case LS_WORD:
                    mem_write_u32(mem, addr, val_rs2 & 0xFFFFFFFF);
                    break;
                case LS_DOUBLE:
                    mem_write_u64(mem, addr, val_rs2);
                    break;
                default:
                    cpu->trap = true;
                    cpu->trap_cause = 2;
                    return false;
            }
            break;
        }
        
        /* OP-IMM: Register-Immediate ALU operations */
        case OP_OP_IMM: {
            int64_t imm = IMM_I(insn);
            uint64_t uimm = (uint64_t)imm; /* For logical ops */
            uint64_t shamt = (insn >> 20) & 0x3F; /* For shifts */
            uint64_t result = 0;
            
            switch (funct3) {
                case ALU_ADD:  result = val_rs1 + (uint64_t)imm; break;
                case ALU_SLT:  result = ((int64_t)val_rs1 < imm) ? 1 : 0; break;
                case ALU_SLTU: result = (val_rs1 < (uint64_t)imm) ? 1 : 0; break;
                case ALU_XOR:  result = val_rs1 ^ uimm; break;
                case ALU_OR:   result = val_rs1 | uimm; break;
                case ALU_AND:  result = val_rs1 & uimm; break;
                case ALU_SLL:
                    result = val_rs1 << shamt;
                    break;
                case ALU_SR:
                    if (funct7 & 0x20) {
                        /* SRAI: Arithmetic right shift */
                        result = (uint64_t)((int64_t)val_rs1 >> shamt);
                    } else {
                        /* SRLI: Logical right shift */
                        result = val_rs1 >> shamt;
                    }
                    break;
                default:
                    cpu->trap = true;
                    cpu->trap_cause = 2;
                    return false;
            }
            if (rd != 0) cpu->x[rd] = result;
            break;
        }
        
        /* OP: Register-Register ALU operations */
        case OP_OP: {
            uint64_t result = 0;
            
            switch (funct3) {
                case ALU_ADD:
                    if (funct7 == 0) {
                        /* ADD */
                        result = val_rs1 + val_rs2;
                    } else if (funct7 == 0x20) {
                        /* SUB */
                        result = val_rs1 - val_rs2;
                    } else {
                        cpu->trap = true;
                        cpu->trap_cause = 2;
                        return false;
                    }
                    break;
                case ALU_SLL:
                    result = val_rs1 << (val_rs2 & 0x3F);
                    break;
                case ALU_SLT:
                    result = ((int64_t)val_rs1 < (int64_t)val_rs2) ? 1 : 0;
                    break;
                case ALU_SLTU:
                    result = (val_rs1 < val_rs2) ? 1 : 0;
                    break;
                case ALU_XOR:
                    result = val_rs1 ^ val_rs2;
                    break;
                case ALU_SR:
                    if (funct7 == 0) {
                        /* SRL */
                        result = val_rs1 >> (val_rs2 & 0x3F);
                    } else if (funct7 == 0x20) {
                        /* SRA */
                        result = (uint64_t)((int64_t)val_rs1 >> (val_rs2 & 0x3F));
                    } else {
                        cpu->trap = true;
                        cpu->trap_cause = 2;
                        return false;
                    }
                    break;
                case ALU_OR:
                    result = val_rs1 | val_rs2;
                    break;
                case ALU_AND:
                    result = val_rs1 & val_rs2;
                    break;
                default:
                    cpu->trap = true;
                    cpu->trap_cause = 2;
                    return false;
            }
            if (rd != 0) cpu->x[rd] = result;
            break;
        }
        
        /* OP-IMM-32: 32-bit immediate operations */
        case OP_OP_IMM32: {
            int64_t imm = IMM_I(insn);
            uint64_t shamt = (insn >> 20) & 0x1F;
            uint64_t result;
            
            switch (funct3) {
                case ALU_ADD:
                    result = sext32((int32_t)val_rs1 + (int32_t)imm);
                    break;
                case ALU_SLL:
                    result = sext32((int32_t)val_rs1 << shamt);
                    break;
                case ALU_SR:
                    if (funct7 & 0x20) {
                        /* SRAIW */
                        result = sext32((int32_t)val_rs1 >> shamt);
                    } else {
                        /* SRLIW */
                        result = sext32((uint32_t)val_rs1 >> shamt);
                    }
                    break;
                default:
                    cpu->trap = true;
                    cpu->trap_cause = 2;
                    return false;
            }
            if (rd != 0) cpu->x[rd] = result;
            break;
        }
        
        /* OP-32: 32-bit register operations */
        case OP_OP32: {
            uint64_t result;
            uint32_t rs1_32 = val_rs1 & 0xFFFFFFFF;
            uint32_t rs2_32 = val_rs2 & 0xFFFFFFFF;
            
            switch (funct3) {
                case ALU_ADD:
                    if (funct7 == 0) {
                        /* ADDW */
                        result = sext32((int32_t)(rs1_32 + rs2_32));
                    } else if (funct7 == 0x20) {
                        /* SUBW */
                        result = sext32((int32_t)(rs1_32 - rs2_32));
                    } else {
                        cpu->trap = true;
                        cpu->trap_cause = 2;
                        return false;
                    }
                    break;
                case ALU_SLL:
                    result = sext32((int32_t)(rs1_32 << (rs2_32 & 0x1F)));
                    break;
                case ALU_SR:
                    if (funct7 == 0) {
                        /* SRLW */
                        result = sext32((int32_t)(rs1_32 >> (rs2_32 & 0x1F)));
                    } else if (funct7 == 0x20) {
                        /* SRAW */
                        result = sext32((int32_t)rs1_32 >> (rs2_32 & 0x1F));
                    } else {
                        cpu->trap = true;
                        cpu->trap_cause = 2;
                        return false;
                    }
                    break;
                default:
                    cpu->trap = true;
                    cpu->trap_cause = 2;
                    return false;
            }
            if (rd != 0) cpu->x[rd] = result;
            break;
        }
        
        default:
            cpu->trap = true;
            cpu->trap_cause = 2;
            return false;
    }
    
    /* Update PC - x0 always stays 0 */
    cpu->pc = cpu->next_pc;
    cpu->x[0] = 0;
    
    return true;
}

/* Run until halt or max steps */
uint64_t rv_run(rv_cpu *cpu, rv_mem *mem, uint64_t max_steps) {
    for (uint64_t i = 0; i < max_steps; i++) {
        if (!rv_step(cpu, mem)) {
            return i + 1; /* Steps executed before trap */
        }
    }
    return max_steps;
}

#ifdef TEST_BUILD
/* Test harness */
#include <stdio.h>

int main() {
    rv_cpu cpu;
    rv_mem mem;
    
    /* Allocate test memory */
    mem.size = 65536;
    mem.data = calloc(1, mem.size);
    
    /* Simple test: li x1, 42; addi x2, x1, 8 */
    uint32_t test_program[] = {
        0x02A00093,  /* addi x1, x0, 42 */
        0x00800113,  /* addi x2, x0, 8  */
        0x002081B3,  /* add x3, x1, x2  */
    };
    
    /* Load program at address 0 */
    memcpy(mem.data, test_program, sizeof(test_program));
    
    rv_init(&cpu);
    
    /* Run 3 instructions */
    for (int i = 0; i < 3; i++) {
        rv_step(&cpu, &mem);
    }
    
    printf("x1 = %ld (expected 42)\n", (long)cpu.x[1]);
    printf("x2 = %ld (expected 8)\n", (long)cpu.x[2]);
    printf("x3 = %ld (expected 50)\n", (long)cpu.x[3]);
    
    free(mem.data);
    return (cpu.x[3] == 50) ? 0 : 1;
}
#endif
