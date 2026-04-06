/*
 * RISC-V RV32I Emulator
 * Lev Osin, Alcor Scottsdale, 2025
 * 
 * Clean C implementation for portability.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#define MEM_SIZE (1 << 20)  /* 1MB RAM */
#define XLEN 32

/* Register file - x0 is hardwired to zero */
typedef struct {
    uint32_t x[32];
    uint32_t pc;
    uint8_t mem[MEM_SIZE];
} RISCVEmu;

/* Instruction formats */
#define OPCODE_MASK 0x7f
#define RD_MASK     0x1f
#define RS1_MASK    0x1f
#define RS2_MASK    0x1f
#define FUNCT3_MASK 0x7
#define FUNCT7_MASK 0x7f

#define GET_OPCODE(inst) ((inst) & OPCODE_MASK)
#define GET_RD(inst)     (((inst) >> 7) & RD_MASK)
#define GET_FUNCT3(inst) (((inst) >> 12) & FUNCT3_MASK)
#define GET_RS1(inst)    (((inst) >> 15) & RS1_MASK)
#define GET_RS2(inst)    (((inst) >> 20) & RS2_MASK)
#define GET_FUNCT7(inst) (((inst) >> 25) & FUNCT7_MASK)

/* RV32I opcodes */
#define OP_LUI      0x37
#define OP_AUIPC    0x17
#define OP_JAL      0x6f
#define OP_JALR     0x67
#define OP_BRANCH   0x63
#define OP_LOAD     0x03
#define OP_STORE    0x23
#define OP_IMM      0x13
#define OP_OP       0x33
#define OP_SYSTEM   0x73

/* ALU funct3 */
#define F3_ADD  0x0
#define F3_SLL  0x1
#define F3_SLT  0x2
#define F3_SLTU 0x3
#define F3_XOR  0x4
#define F3_SR   0x5
#define F3_OR   0x6
#define F3_AND  0x7

/* Branch funct3 */
#define F3_BEQ  0x0
#define F3_BNE  0x1
#define F3_BLT  0x4
#define F3_BGE  0x5
#define F3_BLTU 0x6
#define F3_BGEU 0x7

/* Load/store funct3 */
#define F3_LB  0x0
#define F3_LH  0x1
#define F3_LW  0x2
#define F3_LBU 0x4
#define F3_LHU 0x5
#define F3_SB  0x0
#define F3_SH  0x1
#define F3_SW  0x2

/* Sign extension helpers */
static inline int32_t sign_ext(int32_t val, int bits) {
    int32_t mask = 1 << (bits - 1);
    return (val ^ mask) - mask;
}

/* Memory access helpers */
static inline uint32_t read32(RISCVEmu *emu, uint32_t addr) {
    if (addr & 3) {
        fprintf(stderr, "Unaligned 32-bit load at 0x%08x\n", addr);
        exit(1);
    }
    return emu->mem[addr] |
           (emu->mem[addr+1] << 8) |
           (emu->mem[addr+2] << 16) |
           (emu->mem[addr+3] << 24);
}

static inline uint16_t read16(RISCVEmu *emu, uint32_t addr) {
    return emu->mem[addr] | (emu->mem[addr+1] << 8);
}

static inline uint8_t read8(RISCVEmu *emu, uint32_t addr) {
    return emu->mem[addr];
}

static inline void write32(RISCVEmu *emu, uint32_t addr, uint32_t val) {
    if (addr & 3) {
        fprintf(stderr, "Unaligned 32-bit store at 0x%08x\n", addr);
        exit(1);
    }
    emu->mem[addr] = val & 0xff;
    emu->mem[addr+1] = (val >> 8) & 0xff;
    emu->mem[addr+2] = (val >> 16) & 0xff;
    emu->mem[addr+3] = (val >> 24) & 0xff;
}

static inline void write16(RISCVEmu *emu, uint32_t addr, uint16_t val) {
    emu->mem[addr] = val & 0xff;
    emu->mem[addr+1] = (val >> 8) & 0xff;
}

static inline void write8(RISCVEmu *emu, uint32_t addr, uint8_t val) {
    emu->mem[addr] = val;
}

/* Initialize emulator */
void riscv_init(RISCVEmu *emu) {
    memset(emu, 0, sizeof(*emu));
}

/* Load binary into memory */
int riscv_load(RISCVEmu *emu, const char *filename, uint32_t base) {
    FILE *f = fopen(filename, "rb");
    if (!f) {
        perror("fopen");
        return -1;
    }
    
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    if (base + size > MEM_SIZE) {
        fprintf(stderr, "Binary too large for memory\n");
        fclose(f);
        return -1;
    }
    
    fread(emu->mem + base, 1, size, f);
    fclose(f);
    
    emu->pc = base;
    return 0;
}

/* Execute one instruction. Returns 0 on halt, 1 on continue, -1 on error. */
int riscv_step(RISCVEmu *emu) {
    uint32_t inst = read32(emu, emu->pc);
    uint32_t opcode = GET_OPCODE(inst);
    uint32_t rd = GET_RD(inst);
    uint32_t rs1 = GET_RS1(inst);
    uint32_t rs2 = GET_RS2(inst);
    uint32_t funct3 = GET_FUNCT3(inst);
    uint32_t funct7 = GET_FUNCT7(inst);
    
    uint32_t next_pc = emu->pc + 4;
    
    switch (opcode) {
        case OP_LUI:
            emu->x[rd] = inst & 0xfffff000;
            break;
            
        case OP_AUIPC:
            emu->x[rd] = emu->pc + (inst & 0xfffff000);
            break;
            
        case OP_JAL: {
            int32_t imm = ((inst >> 31) << 20) |
                          (((inst >> 21) & 0x3ff) << 1) |
                          (((inst >> 20) & 1) << 11) |
                          (((inst >> 12) & 0xff) << 12);
            imm = sign_ext(imm, 21);
            emu->x[rd] = next_pc;
            next_pc = emu->pc + imm;
            break;
        }
        
        case OP_JALR: {
            int32_t imm = sign_ext((inst >> 20), 12);
            uint32_t target = (emu->x[rs1] + imm) & ~1;
            emu->x[rd] = next_pc;
            next_pc = target;
            break;
        }
        
        case OP_BRANCH: {
            int32_t imm = (((inst >> 31) << 12) |
                          (((inst >> 25) & 0x3f) << 5) |
                          (((inst >> 8) & 0xf) << 1) |
                          (((inst >> 7) & 1) << 11));
            imm = sign_ext(imm, 13);
            
            int32_t rs1_val = sign_ext(emu->x[rs1], 32);
            int32_t rs2_val = sign_ext(emu->x[rs2], 32);
            uint32_t rs1_u = emu->x[rs1];
            uint32_t rs2_u = emu->x[rs2];
            
            int take = 0;
            switch (funct3) {
                case F3_BEQ:  take = rs1_u == rs2_u; break;
                case F3_BNE:  take = rs1_u != rs2_u; break;
                case F3_BLT:  take = rs1_val < rs2_val; break;
                case F3_BGE:  take = rs1_val >= rs2_val; break;
                case F3_BLTU: take = rs1_u < rs2_u; break;
                case F3_BGEU: take = rs1_u >= rs2_u; break;
            }
            
            if (take) {
                next_pc = emu->pc + (imm << 1);
            }
            break;
        }
        
        case OP_LOAD: {
            int32_t imm = sign_ext((inst >> 20), 12);
            uint32_t addr = emu->x[rs1] + imm;
            
            switch (funct3) {
                case F3_LB:  emu->x[rd] = sign_ext(read8(emu, addr), 8); break;
                case F3_LH:  emu->x[rd] = sign_ext(read16(emu, addr), 16); break;
                case F3_LW:  emu->x[rd] = sign_ext(read32(emu, addr), 32); break;
                case F3_LBU: emu->x[rd] = read8(emu, addr); break;
                case F3_LHU: emu->x[rd] = read16(emu, addr); break;
            }
            break;
        }
        
        case OP_STORE: {
            int32_t imm = sign_ext((((inst >> 25) << 5) | ((inst >> 7) & 0x1f)), 12);
            uint32_t addr = emu->x[rs1] + imm;
            
            switch (funct3) {
                case F3_SB: write8(emu, addr, emu->x[rs2]); break;
                case F3_SH: write16(emu, addr, emu->x[rs2]); break;
                case F3_SW: write32(emu, addr, emu->x[rs2]); break;
            }
            break;
        }
        
        case OP_IMM: {
            int32_t imm = sign_ext((inst >> 20), 12);
            uint32_t shamt = (inst >> 20) & 0x1f;
            int32_t rs1_val = sign_ext(emu->x[rs1], 32);
            
            switch (funct3) {
                case F3_ADD:  emu->x[rd] = emu->x[rs1] + imm; break;
                case F3_SLT:  emu->x[rd] = rs1_val < imm ? 1 : 0; break;
                case F3_SLTU: emu->x[rd] = emu->x[rs1] < (uint32_t)imm ? 1 : 0; break;
                case F3_XOR:  emu->x[rd] = emu->x[rs1] ^ imm; break;
                case F3_OR:   emu->x[rd] = emu->x[rs1] | imm; break;
                case F3_AND:  emu->x[rd] = emu->x[rs1] & imm; break;
                case F3_SLL:  emu->x[rd] = emu->x[rs1] << shamt; break;
                case F3_SR:
                    if (funct7 & 0x20) {  /* SRAI */
                        emu->x[rd] = rs1_val >> shamt;
                    } else {  /* SRLI */
                        emu->x[rd] = emu->x[rs1] >> shamt;
                    }
                    break;
            }
            break;
        }
        
        case OP_OP: {
            uint32_t shamt = emu->x[rs2] & 0x1f;
            int32_t rs1_val = sign_ext(emu->x[rs1], 32);
            int32_t rs2_val = sign_ext(emu->x[rs2], 32);
            
            switch (funct3) {
                case F3_ADD:
                    if (funct7 & 0x20) {  /* SUB */
                        emu->x[rd] = emu->x[rs1] - emu->x[rs2];
                    } else {  /* ADD */
                        emu->x[rd] = emu->x[rs1] + emu->x[rs2];
                    }
                    break;
                case F3_SLL: emu->x[rd] = emu->x[rs1] << shamt; break;
                case F3_SLT: emu->x[rd] = rs1_val < rs2_val ? 1 : 0; break;
                case F3_SLTU: emu->x[rd] = emu->x[rs1] < emu->x[rs2] ? 1 : 0; break;
                case F3_XOR: emu->x[rd] = emu->x[rs1] ^ emu->x[rs2]; break;
                case F3_SR:
                    if (funct7 & 0x20) {  /* SRA */
                        emu->x[rd] = rs1_val >> shamt;
                    } else {  /* SRL */
                        emu->x[rd] = emu->x[rs1] >> shamt;
                    }
                    break;
                case F3_OR:  emu->x[rd] = emu->x[rs1] | emu->x[rs2]; break;
                case F3_AND: emu->x[rd] = emu->x[rs1] & emu->x[rs2]; break;
            }
            break;
        }
        
        case OP_SYSTEM: {
            uint32_t imm = (inst >> 20) & 0xfff;
            if (funct3 == 0) {
                if (imm == 0) {  /* ECALL */
                    return 0;  /* Halt */
                } else if (imm == 1) {  /* EBREAK */
                    return 0;  /* Halt */
                }
            }
            break;
        }
        
        default:
            fprintf(stderr, "Unknown opcode: 0x%02x at PC=0x%08x\n", opcode, emu->pc);
            return -1;
    }
    
    emu->x[0] = 0;  /* x0 is hardwired to zero */
    emu->pc = next_pc;
    return 1;
}

/* Run until halt or max steps */
uint64_t riscv_run(RISCVEmu *emu, uint64_t max_steps) {
    uint64_t steps;
    for (steps = 0; steps < max_steps; steps++) {
        int result = riscv_step(emu);
        if (result <= 0) {
            break;
        }
    }
    return steps;
}

/* Print register state */
void riscv_dump_regs(RISCVEmu *emu) {
    printf("PC = 0x%08x\n", emu->pc);
    for (int i = 0; i < 32; i++) {
        if (i % 4 == 0) printf("\n");
        printf("x%02d=0x%08x ", i, emu->x[i]);
    }
    printf("\n");
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <binary>\n", argv[0]);
        return 1;
    }
    
    RISCVEmu emu;
    riscv_init(&emu);
    
    if (riscv_load(&emu, argv[1], 0) < 0) {
        return 1;
    }
    
    uint64_t steps = riscv_run(&emu, 1000000);
    
    printf("Executed %lu instructions\n", steps);
    printf("x1 (ra)  = 0x%08x\n", emu.x[1]);
    printf("x2 (sp)  = 0x%08x\n", emu.x[2]);
    printf("x10 (a0) = 0x%08x (%d)\n", emu.x[10], (int32_t)emu.x[10]);
    
    return 0;
}
