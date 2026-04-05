// riscv.c - Simple RISC-V RV32I emulator
// Lev Osin, 2025

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MEM_SIZE (1 << 20)  // 1MB RAM
#define REG_COUNT 32

typedef struct {
    uint32_t regs[REG_COUNT];
    uint32_t pc;
    uint8_t *mem;
    uint32_t mem_size;
    int running;
} RISCV;

// Instruction fields
#define OPCODE(inst) ((inst) & 0x7f)
#define RD(inst) (((inst) >> 7) & 0x1f)
#define RS1(inst) (((inst) >> 15) & 0x1f)
#define RS2(inst) (((inst) >> 20) & 0x1f)
#define FUNCT3(inst) (((inst) >> 12) & 0x7)
#define FUNCT7(inst) (((inst) >> 25) & 0x7f)

// Opcodes
#define OP_IMM 0x13
#define OP_LUI 0x37
#define OP_AUIPC 0x17
#define OP_OP 0x33
#define OP_JAL 0x6f
#define OP_JALR 0x67
#define OP_BRANCH 0x63
#define OP_LOAD 0x03
#define OP_STORE 0x23

void riscv_init(RISCV *cpu) {
    memset(cpu->regs, 0, sizeof(cpu->regs));
    cpu->regs[2] = MEM_SIZE;  // Stack pointer at top of memory
    cpu->pc = 0;
    cpu->mem = calloc(MEM_SIZE, 1);
    cpu->mem_size = MEM_SIZE;
    cpu->running = 1;
}

uint32_t riscv_fetch(RISCV *cpu) {
    if (cpu->pc + 4 > cpu->mem_size) {
        cpu->running = 0;
        return 0;
    }
    uint32_t inst = cpu->mem[cpu->pc] |
                    (cpu->mem[cpu->pc + 1] << 8) |
                    (cpu->mem[cpu->pc + 2] << 16) |
                    (cpu->mem[cpu->pc + 3] << 24);
    cpu->pc += 4;
    return inst;
}

// Sign extend 12-bit immediate
static inline int32_t imm_i(uint32_t inst) {
    return (int32_t)(inst >> 20);
}

// Sign extend 13-bit branch immediate
static inline int32_t imm_b(uint32_t inst) {
    int32_t imm = ((inst >> 31) & 1) << 12 |
                  ((inst >> 7) & 1) << 11 |
                  ((inst >> 25) & 0x3f) << 5 |
                  ((inst >> 8) & 0xf) << 1;
    return (imm << 19) >> 19;  // Sign extend
}

void riscv_execute(RISCV *cpu, uint32_t inst) {
    uint32_t opcode = OPCODE(inst);
    uint32_t rd = RD(inst);
    uint32_t rs1 = RS1(inst);
    uint32_t rs2 = RS2(inst);
    uint32_t funct3 = FUNCT3(inst);
    uint32_t funct7 = FUNCT7(inst);
    
    // x0 is hardwired to 0
    cpu->regs[0] = 0;
    
    switch (opcode) {
        case OP_IMM: {
            int32_t imm = imm_i(inst);
            switch (funct3) {
                case 0: cpu->regs[rd] = cpu->regs[rs1] + imm; break;  // ADDI
                case 2: cpu->regs[rd] = (int32_t)cpu->regs[rs1] < imm ? 1 : 0; break;  // SLTI
                case 3: cpu->regs[rd] = cpu->regs[rs1] < (uint32_t)imm ? 1 : 0; break;  // SLTIU
                case 4: cpu->regs[rd] = cpu->regs[rs1] ^ imm; break;  // XORI
                case 6: cpu->regs[rd] = cpu->regs[rs1] | imm; break;  // ORI
                case 7: cpu->regs[rd] = cpu->regs[rs1] & imm; break;  // ANDI
                case 1: cpu->regs[rd] = cpu->regs[rs1] << (imm & 0x1f); break;  // SLLI
                case 5: {
                    if (funct7 & 0x20) {
                        cpu->regs[rd] = cpu->regs[rs1] >> (imm & 0x1f);  // SRLI
                    } else {
                        cpu->regs[rd] = (uint32_t)((int32_t)cpu->regs[rs1] >> (imm & 0x1f));  // SRAI
                    }
                    break;
                }
            }
            break;
        }
        
        case OP_LUI: {
            cpu->regs[rd] = inst & 0xfffff000;
            break;
        }
        
        case OP_AUIPC: {
            cpu->regs[rd] = cpu->pc - 4 + (inst & 0xfffff000);
            break;
        }
        
        case OP_OP: {
            switch (funct3) {
                case 0: {
                    if (funct7 & 0x20) {
                        cpu->regs[rd] = cpu->regs[rs1] - cpu->regs[rs2];  // SUB
                    } else {
                        cpu->regs[rd] = cpu->regs[rs1] + cpu->regs[rs2];  // ADD
                    }
                    break;
                }
                case 1: cpu->regs[rd] = cpu->regs[rs1] << (cpu->regs[rs2] & 0x1f); break;  // SLL
                case 2: cpu->regs[rd] = (int32_t)cpu->regs[rs1] < (int32_t)cpu->regs[rs2] ? 1 : 0; break;  // SLT
                case 3: cpu->regs[rd] = cpu->regs[rs1] < cpu->regs[rs2] ? 1 : 0; break;  // SLTU
                case 4: cpu->regs[rd] = cpu->regs[rs1] ^ cpu->regs[rs2]; break;  // XOR
                case 5: {
                    if (funct7 & 0x20) {
                        cpu->regs[rd] = (uint32_t)((int32_t)cpu->regs[rs1] >> (cpu->regs[rs2] & 0x1f));  // SRA
                    } else {
                        cpu->regs[rd] = cpu->regs[rs1] >> (cpu->regs[rs2] & 0x1f);  // SRL
                    }
                    break;
                }
                case 6: cpu->regs[rd] = cpu->regs[rs1] | cpu->regs[rs2]; break;  // OR
                case 7: cpu->regs[rd] = cpu->regs[rs1] & cpu->regs[rs2]; break;  // AND
            }
            break;
        }
        
        case OP_JAL: {
            int32_t imm = ((inst >> 31) & 1) << 20 |
                          ((inst >> 21) & 0x3ff) << 1 |
                          ((inst >> 20) & 1) << 11 |
                          ((inst >> 12) & 0xff) << 12;
            imm = (imm << 11) >> 11;  // Sign extend
            cpu->regs[rd] = cpu->pc;
            cpu->pc = (cpu->pc - 4) + imm;
            break;
        }
        
        case OP_JALR: {
            int32_t imm = imm_i(inst);
            uint32_t tmp = cpu->pc;
            cpu->pc = (cpu->regs[rs1] + imm) & ~1;
            cpu->regs[rd] = tmp;
            break;
        }
        
        case OP_BRANCH: {
            int32_t imm = imm_b(inst);
            int take = 0;
            switch (funct3) {
                case 0: take = cpu->regs[rs1] == cpu->regs[rs2]; break;  // BEQ
                case 1: take = cpu->regs[rs1] != cpu->regs[rs2]; break;  // BNE
                case 4: take = (int32_t)cpu->regs[rs1] < (int32_t)cpu->regs[rs2]; break;  // BLT
                case 5: take = (int32_t)cpu->regs[rs1] >= (int32_t)cpu->regs[rs2]; break;  // BGE
                case 6: take = cpu->regs[rs1] < cpu->regs[rs2]; break;  // BLTU
                case 7: take = cpu->regs[rs1] >= cpu->regs[rs2]; break;  // BGEU
            }
            if (take) {
                cpu->pc = (cpu->pc - 4) + imm;
            }
            break;
        }
        
        case OP_LOAD: {
            uint32_t addr = cpu->regs[rs1] + imm_i(inst);
            if (addr >= cpu->mem_size) {
                fprintf(stderr, "Load out of bounds: 0x%x\n", addr);
                cpu->running = 0;
                break;
            }
            switch (funct3) {
                case 0: cpu->regs[rd] = (int8_t)cpu->mem[addr]; break;  // LB
                case 1: cpu->regs[rd] = (int16_t)(cpu->mem[addr] | (cpu->mem[addr+1] << 8)); break;  // LH
                case 2: cpu->regs[rd] = cpu->mem[addr] | (cpu->mem[addr+1] << 8) | 
                                           (cpu->mem[addr+2] << 16) | (cpu->mem[addr+3] << 24); break;  // LW
                case 4: cpu->regs[rd] = cpu->mem[addr]; break;  // LBU
                case 5: cpu->regs[rd] = cpu->mem[addr] | (cpu->mem[addr+1] << 8); break;  // LHU
            }
            break;
        }
        
        case OP_STORE: {
            int32_t imm = ((inst >> 25) << 5) | ((inst >> 7) & 0x1f);
            imm = (imm << 20) >> 20;  // Sign extend
            uint32_t addr = cpu->regs[rs1] + imm;
            if (addr >= cpu->mem_size) {
                fprintf(stderr, "Store out of bounds: 0x%x\n", addr);
                cpu->running = 0;
                break;
            }
            switch (funct3) {
                case 0: cpu->mem[addr] = cpu->regs[rs2] & 0xff; break;  // SB
                case 1: 
                    cpu->mem[addr] = cpu->regs[rs2] & 0xff;
                    cpu->mem[addr+1] = (cpu->regs[rs2] >> 8) & 0xff;
                    break;  // SH
                case 2:
                    cpu->mem[addr] = cpu->regs[rs2] & 0xff;
                    cpu->mem[addr+1] = (cpu->regs[rs2] >> 8) & 0xff;
                    cpu->mem[addr+2] = (cpu->regs[rs2] >> 16) & 0xff;
                    cpu->mem[addr+3] = (cpu->regs[rs2] >> 24) & 0xff;
                    break;  // SW
            }
            break;
        }
        
        case 0x73: {  // ECALL/EBREAK
            if (inst == 0x00000073) {  // ECALL
                if (cpu->regs[17] == 93) {  // exit syscall in a0
                    printf("Exit code: %d\n", cpu->regs[10]);
                    cpu->running = 0;
                }
            }
            break;
        }
        
        default:
            fprintf(stderr, "Unknown opcode: 0x%02x at PC=0x%x\n", opcode, cpu->pc - 4);
            cpu->running = 0;
            break;
    }
    
    cpu->regs[0] = 0;  // x0 always 0
}

void riscv_run(RISCV *cpu) {
    int count = 0;
    while (cpu->running && count < 1000000) {
        uint32_t inst = riscv_fetch(cpu);
        riscv_execute(cpu, inst);
        count++;
    }
    if (count >= 1000000) {
        fprintf(stderr, "Instruction limit reached\n");
    }
}

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <program.bin>\n", argv[0]);
        return 1;
    }
    
    RISCV cpu;
    riscv_init(&cpu);
    
    FILE *f = fopen(argv[1], "rb");
    if (!f) {
        perror("fopen");
        return 1;
    }
    
    size_t n = fread(cpu.mem, 1, cpu.mem_size, f);
    fclose(f);
    printf("Loaded %zu bytes\n", n);
    
    riscv_run(&cpu);
    
    free(cpu.mem);
    return 0;
}
