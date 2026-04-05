/* RISC-V RV32I Emulator v2 - Warning fixes
 * Lev Osin - Alcor BCI Session 1
 */

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MEM_SIZE (1024 * 1024)

typedef struct {
    uint32_t regs[32];
    uint32_t pc;
    uint8_t *mem;
    size_t mem_size;
    int halt;
} RiscvState;

#define OPCODE(instr) ((instr) & 0x7F)
#define RD(instr)     (((instr) >> 7) & 0x1F)
#define RS1(instr)    (((instr) >> 15) & 0x1F)
#define RS2(instr)    (((instr) >> 20) & 0x1F)
#define FUNCT3(instr) (((instr) >> 12) & 0x7)
#define FUNCT7(instr) (((instr) >> 25) & 0x7F)
#define IMM_I(instr)  (((int32_t)(instr)) >> 20)

#define OP_LUI     0x37
#define OP_AUIPC   0x17
#define OP_JAL     0x6F
#define OP_JALR    0x67
#define OP_BRANCH  0x63
#define OP_LOAD    0x03
#define OP_STORE   0x23
#define OP_IMM     0x13
#define OP_OP      0x33
#define OP_SYSTEM  0x73

void riscv_init(RiscvState *s) {
    memset(s, 0, sizeof(*s));
    s->mem = calloc(1, MEM_SIZE);
    s->mem_size = MEM_SIZE;
}

uint32_t riscv_read32(RiscvState *s, uint32_t addr) {
    if (addr + 4 > s->mem_size) return 0;
    return *(uint32_t *)(s->mem + addr);
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
            s->regs[rd] = instr & 0xFFFFF000;
            break;
            
        case OP_AUIPC:
            s->regs[rd] = s->pc + (instr & 0xFFFFF000);
            break;
            
        case OP_JAL:
            s->regs[rd] = next_pc;
            next_pc = s->pc + (((instr & 0x80000000) ? 0xFFF00000 : 0) |
                              ((instr >> 20) & 0x7FE) |
                              ((instr >> 9) & 0x800) |
                              (instr & 0xFF000));
            break;
            
        case OP_JALR:
            s->regs[rd] = next_pc;
            next_pc = (s->regs[rs1] + IMM_I(instr)) & ~1;
            break;
            
        case OP_BRANCH: {
            int32_t imm = ((instr & 0x80000000) ? 0xFFFFF000 : 0) |
                         ((instr >> 20) & 0x7E0) |
                         ((instr >> 7) & 0x1E);
            int taken = 0;
            switch (funct3) {
                case 0: taken = (s->regs[rs1] == s->regs[rs2]); break;
                case 1: taken = (s->regs[rs1] != s->regs[rs2]); break;
                case 4: taken = ((int32_t)s->regs[rs1] < (int32_t)s->regs[rs2]); break;
                case 5: taken = ((int32_t)s->regs[rs1] >= (int32_t)s->regs[rs2]); break;
                case 6: taken = (s->regs[rs1] < s->regs[rs2]); break;
                case 7: taken = (s->regs[rs1] >= s->regs[rs2]); break;
            }
            if (taken) next_pc = s->pc + imm;
            break;
        }
        
        case OP_LOAD: {
            uint32_t addr = s->regs[rs1] + IMM_I(instr);
            switch (funct3) {
                case 0: s->regs[rd] = (int8_t)s->mem[addr]; break;
                case 1: s->regs[rd] = (int16_t)(s->mem[addr] | ((uint16_t)s->mem[addr+1] << 8)); break;
                case 2: s->regs[rd] = riscv_read32(s, addr); break;
                case 4: s->regs[rd] = s->mem[addr]; break;
                case 5: s->regs[rd] = s->mem[addr] | ((uint16_t)s->mem[addr+1] << 8); break;
            }
            break;
        }
        
        case OP_STORE: {
            uint32_t addr = s->regs[rs1] + ((((int32_t)(instr & 0xFE000000)) >> 20) |
                                           ((instr >> 7) & 0x1F));
            switch (funct3) {
                case 0: s->mem[addr] = s->regs[rs2] & 0xFF; break;
                case 1:
                    s->mem[addr] = s->regs[rs2] & 0xFF;
                    s->mem[addr+1] = (s->regs[rs2] >> 8) & 0xFF;
                    break;
                case 2:
                    if (addr + 4 <= s->mem_size)
                        *(uint32_t *)(s->mem + addr) = s->regs[rs2];
                    break;
            }
            break;
        }
        
        case OP_IMM: {
            int32_t imm = IMM_I(instr);
            switch (funct3) {
                case 0: s->regs[rd] = s->regs[rs1] + imm; break;
                case 2: s->regs[rd] = ((int32_t)s->regs[rs1] < imm) ? 1 : 0; break;
                case 3: s->regs[rd] = (s->regs[rs1] < (uint32_t)imm) ? 1 : 0; break;
                case 4: s->regs[rd] = s->regs[rs1] ^ imm; break;
                case 6: s->regs[rd] = s->regs[rs1] | imm; break;
                case 7: s->regs[rd] = s->regs[rs1] & imm; break;
                case 1: s->regs[rd] = s->regs[rs1] << (imm & 0x1F); break;
                case 5:
                    if ((imm >> 10) & 1)
                        s->regs[rd] = (int32_t)s->regs[rs1] >> (imm & 0x1F);
                    else
                        s->regs[rd] = s->regs[rs1] >> (imm & 0x1F);
                    break;
            }
            break;
        }
        
        case OP_OP: {
            uint32_t shamt = s->regs[rs2] & 0x1F;
            switch (funct3) {
                case 0:
                    if (FUNCT7(instr) == 0) s->regs[rd] = s->regs[rs1] + s->regs[rs2];
                    else s->regs[rd] = s->regs[rs1] - s->regs[rs2];
                    break;
                case 1: s->regs[rd] = s->regs[rs1] << shamt; break;
                case 2: s->regs[rd] = ((int32_t)s->regs[rs1] < (int32_t)s->regs[rs2]) ? 1 : 0; break;
                case 3: s->regs[rd] = (s->regs[rs1] < s->regs[rs2]) ? 1 : 0; break;
                case 4: s->regs[rd] = s->regs[rs1] ^ s->regs[rs2]; break;
                case 5:
                    if (FUNCT7(instr) == 0) s->regs[rd] = s->regs[rs1] >> shamt;
                    else s->regs[rd] = (int32_t)s->regs[rs1] >> shamt;
                    break;
                case 6: s->regs[rd] = s->regs[rs1] | s->regs[rs2]; break;
                case 7: s->regs[rd] = s->regs[rs1] & s->regs[rs2]; break;
            }
            break;
        }
        
        case OP_SYSTEM:
            if (instr == 0x00000073 || instr == 0x00100073) s->halt = 1;
            break;
    }
    
    s->regs[0] = 0;
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
    if (!f) { perror("fopen"); return 1; }
    
    RiscvState state;
    riscv_init(&state);
    
    size_t n = fread(state.mem, 1, MEM_SIZE, f);
    fclose(f);
    printf("Loaded %zu bytes\n", n);
    
    riscv_run(&state, 10000000);
    
    printf("Halted. PC=0x%08X\n", state.pc);
    printf("x10 (a0) = %u\n", state.regs[10]);
    
    free(state.mem);
    return 0;
}
