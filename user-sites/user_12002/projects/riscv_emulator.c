/* RISC-V RV32I Emulator
 * For BCI cognitive capability testing
 * Target: Pass RISC-V compliance tests
 */

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MEM_SIZE (1024 * 1024)  // 1MB RAM

typedef struct {
    uint32_t regs[32];
    uint32_t pc;
    uint8_t *mem;
    size_t mem_size;
    int halt;
} RiscvState;

// Instruction decoding
#define OPCODE(instr) ((instr) & 0x7F)
#define RD(instr)     (((instr) >> 7) & 0x1F)
#define RS1(instr)    (((instr) >> 15) & 0x1F)
#define RS2(instr)    (((instr) >> 20) & 0x1F)
#define FUNCT3(instr) (((instr) >> 12) & 0x7)
#define FUNCT7(instr) (((instr) >> 25) & 0x7F)
#define IMM_I(instr)  (((int32_t)(instr)) >> 20)
#define IMM_S(instr)  ((((int32_t)(instr)) >> 25) << 5) | (((instr) >> 7) & 0x1F)
#define IMM_B(instr)  (((((int32_t)(instr)) >> 31) << 12) | \
                       ((((instr) >> 7) & 0x1) << 11) | \
                       ((((instr) >> 25) & 0x3F) << 5) | \
                       ((((instr) >> 8) & 0xF) << 1))
#define IMM_U(instr)  ((instr) & 0xFFFFF000)
#define IMM_J(instr)  (((((int32_t)(instr)) >> 31) << 20) | \
                       (((instr) >> 12) & 0xFF) << 12 | \
                       ((((instr) >> 20) & 0x1) << 11) | \
                       ((((instr) >> 21) & 0x3FF) << 1))

// Opcodes
#define OP_LUI     0x37
#define OP_AUIPC   0x17
#define OP_JAL     0x6F
#define OP_JALR    0x67
#define OP_BRANCH  0x63
#define OP_LOAD    0x03
#define OP_STORE   0x23
#define OP_IMM     0x13
#define OP_OP      0x33
#define OP_MISC    0x0F
#define OP_SYSTEM  0x73

void riscv_init(RiscvState *s, size_t mem_size) {
    memset(s, 0, sizeof(*s));
    s->mem = calloc(1, mem_size);
    s->mem_size = mem_size;
    s->regs[0] = 0;  // x0 is hardwired to 0
}

uint32_t riscv_read32(RiscvState *s, uint32_t addr) {
    if (addr + 4 > s->mem_size) return 0;
    return *(uint32_t *)(s->mem + addr);
}

void riscv_write32(RiscvState *s, uint32_t addr, uint32_t val) {
    if (addr + 4 > s->mem_size) return;
    *(uint32_t *)(s->mem + addr) = val;
}

void riscv_step(RiscvState *s) {
    uint32_t instr = riscv_read32(s, s->pc);
    uint32_t opcode = OPCODE(instr);
    uint32_t rd = RD(instr);
    uint32_t rs1 = RS1(instr);
    uint32_t rs2 = RS2(instr);
    uint32_t funct3 = FUNCT3(instr);
    
    uint32_t next_pc = s->pc + 4;
    
    switch (opcode) {
        case OP_LUI:
            s->regs[rd] = IMM_U(instr);
            break;
            
        case OP_AUIPC:
            s->regs[rd] = s->pc + IMM_U(instr);
            break;
            
        case OP_JAL:
            s->regs[rd] = next_pc;
            next_pc = s->pc + IMM_J(instr);
            break;
            
        case OP_JALR:
            s->regs[rd] = next_pc;
            next_pc = (s->regs[rs1] + IMM_I(instr)) & ~1;
            break;
            
        case OP_BRANCH: {
            int32_t imm = IMM_B(instr);
            int taken = 0;
            switch (funct3) {
                case 0: taken = (s->regs[rs1] == s->regs[rs2]); break; // BEQ
                case 1: taken = (s->regs[rs1] != s->regs[rs2]); break; // BNE
                case 4: taken = ((int32_t)s->regs[rs1] < (int32_t)s->regs[rs2]); break; // BLT
                case 5: taken = ((int32_t)s->regs[rs1] >= (int32_t)s->regs[rs2]); break; // BGE
                case 6: taken = (s->regs[rs1] < s->regs[rs2]); break; // BLTU
                case 7: taken = (s->regs[rs1] >= s->regs[rs2]); break; // BGEU
            }
            if (taken) next_pc = s->pc + imm;
            break;
        }
        
        case OP_LOAD: {
            uint32_t addr = s->regs[rs1] + IMM_I(instr);
            switch (funct3) {
                case 0: s->regs[rd] = (int8_t)s->mem[addr]; break;  // LB
                case 1: s->regs[rd] = (int16_t)(s->mem[addr] | (s->mem[addr+1] << 8)); break; // LH
                case 2: s->regs[rd] = riscv_read32(s, addr); break; // LW
                case 4: s->regs[rd] = s->mem[addr]; break;  // LBU
                case 5: s->regs[rd] = s->mem[addr] | (s->mem[addr+1] << 8); break; // LHU
            }
            break;
        }
        
        case OP_STORE: {
            uint32_t addr = s->regs[rs1] + IMM_S(instr);
            switch (funct3) {
                case 0: s->mem[addr] = s->regs[rs2] & 0xFF; break; // SB
                case 1: 
                    s->mem[addr] = s->regs[rs2] & 0xFF;
                    s->mem[addr+1] = (s->regs[rs2] >> 8) & 0xFF;
                    break; // SH
                case 2: riscv_write32(s, addr, s->regs[rs2]); break; // SW
            }
            break;
        }
        
        case OP_IMM: {
            int32_t imm = IMM_I(instr);
            switch (funct3) {
                case 0: s->regs[rd] = s->regs[rs1] + imm; break; // ADDI
                case 2: s->regs[rd] = ((int32_t)s->regs[rs1] < imm) ? 1 : 0; break; // SLTI
                case 3: s->regs[rd] = (s->regs[rs1] < (uint32_t)imm) ? 1 : 0; break; // SLTIU
                case 4: s->regs[rd] = s->regs[rs1] ^ imm; break; // XORI
                case 6: s->regs[rd] = s->regs[rs1] | imm; break; // ORI
                case 7: s->regs[rd] = s->regs[rs1] & imm; break; // ANDI
                case 1: // SLLI
                    s->regs[rd] = s->regs[rs1] << (imm & 0x1F);
                    break;
                case 5: // SRLI/SRAI
                    if ((imm >> 10) & 1) {
                        s->regs[rd] = (int32_t)s->regs[rs1] >> (imm & 0x1F); // SRAI
                    } else {
                        s->regs[rd] = s->regs[rs1] >> (imm & 0x1F); // SRLI
                    }
                    break;
            }
            break;
        }
        
        case OP_OP: {
            uint32_t shamt = (s->regs[rs2] & 0x1F);
            switch (funct3) {
                case 0:
                    if (FUNCT7(instr) == 0) s->regs[rd] = s->regs[rs1] + s->regs[rs2]; // ADD
                    else s->regs[rd] = s->regs[rs1] - s->regs[rs2]; // SUB
                    break;
                case 1: s->regs[rd] = s->regs[rs1] << shamt; break; // SLL
                case 2: s->regs[rd] = ((int32_t)s->regs[rs1] < (int32_t)s->regs[rs2]) ? 1 : 0; break; // SLT
                case 3: s->regs[rd] = (s->regs[rs1] < s->regs[rs2]) ? 1 : 0; break; // SLTU
                case 4: s->regs[rd] = s->regs[rs1] ^ s->regs[rs2]; break; // XOR
                case 5:
                    if (FUNCT7(instr) == 0) s->regs[rd] = s->regs[rs1] >> shamt; // SRL
                    else s->regs[rd] = (int32_t)s->regs[rs1] >> shamt; // SRA
                    break;
                case 6: s->regs[rd] = s->regs[rs1] | s->regs[rs2]; break; // OR
                case 7: s->regs[rd] = s->regs[rs1] & s->regs[rs2]; break; // AND
            }
            break;
        }
        
        case OP_SYSTEM:
            if (instr == 0x00000073) { // ECALL
                if (s->regs[17] == 93) { // exit syscall
                    s->halt = 1;
                }
            } else if (instr == 0x00100073) { // EBREAK
                s->halt = 1;
            }
            break;
    }
    
    s->regs[0] = 0;  // x0 always 0
    s->pc = next_pc;
}

void riscv_run(RiscvState *s, uint32_t max_steps) {
    for (uint32_t i = 0; i < max_steps && !s->halt; i++) {
        riscv_step(s);
    }
}

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <program.bin>\n", argv[0]);
        return 1;
    }
    
    FILE *f = fopen(argv[1], "rb");
    if (!f) {
        perror("fopen");
        return 1;
    }
    
    RiscvState state;
    riscv_init(&state, MEM_SIZE);
    
    // Load program at address 0
    size_t n = fread(state.mem, 1, MEM_SIZE, f);
    fclose(f);
    printf("Loaded %zu bytes\n", n);
    
    // Run
    riscv_run(&state, 10000000);
    
    printf("Halted. PC=0x%08X\n", state.pc);
    printf("x10 (a0) = %u\n", state.regs[10]);
    
    free(state.mem);
    return 0;
}
