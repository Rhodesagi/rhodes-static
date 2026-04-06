/*
 * RISC-V RV32I Emulator in C
 * Lev Osin, Alcor Scottsdale, 2025
 */

#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>

#define MEM_SIZE (1 << 20)  /* 1MB RAM */

/* RV32I opcodes */
#define OP_LUI    0b0110111
#define OP_AUIPC  0b0010111
#define OP_JAL    0b1101111
#define OP_JALR   0b1100111
#define OP_BRANCH 0b1100011
#define OP_LOAD   0b0000011
#define OP_STORE  0b0100011
#define OP_IMM    0b0010011
#define OP_OP     0b0110011
#define OP_SYSTEM 0b1110011

/* funct3 values */
#define F3_ADD  0b000
#define F3_SLT  0b010
#define F3_SLTU 0b011
#define F3_XOR  0b100
#define F3_OR   0b110
#define F3_AND  0b111
#define F3_SLL  0b001
#define F3_SR   0b101

#define F3_BEQ  0b000
#define F3_BNE  0b001
#define F3_BLT  0b100
#define F3_BGE  0b101
#define F3_BLTU 0b110
#define F3_BGEU 0b111

#define F3_LB   0b000
#define F3_LH   0b001
#define F3_LW   0b010
#define F3_LBU  0b100
#define F3_LHU  0b101
#define F3_SB   0b000
#define F3_SH   0b001
#define F3_SW   0b010

typedef struct {
    uint32_t x[32];
    uint32_t pc;
    uint8_t mem[MEM_SIZE];
} RISCVState;

static inline uint32_t sign_ext(uint32_t val, int bits) {
    if (val & (1U << (bits - 1))) {
        return val | (~((1U << bits) - 1));
    }
    return val;
}

static inline uint32_t read32(RISCVState *s, uint32_t addr) {
    if (addr & 3) {
        fprintf(stderr, "Unaligned load: 0x%08x\n", addr);
        exit(1);
    }
    return s->mem[addr] | (s->mem[addr+1] << 8) |
           (s->mem[addr+2] << 16) | (s->mem[addr+3] << 24);
}

static inline void write32(RISCVState *s, uint32_t addr, uint32_t val) {
    if (addr & 3) {
        fprintf(stderr, "Unaligned store: 0x%08x\n", addr);
        exit(1);
    }
    s->mem[addr] = val & 0xff;
    s->mem[addr+1] = (val >> 8) & 0xff;
    s->mem[addr+2] = (val >> 16) & 0xff;
    s->mem[addr+3] = (val >> 24) & 0xff;
}

static inline uint32_t read16(RISCVState *s, uint32_t addr) {
    return s->mem[addr] | (s->mem[addr+1] << 8);
}

static inline uint32_t read8(RISCVState *s, uint32_t addr) {
    return s->mem[addr];
}

static inline void write16(RISCVState *s, uint32_t addr, uint32_t val) {
    s->mem[addr] = val & 0xff;
    s->mem[addr+1] = (val >> 8) & 0xff;
}

static inline void write8(RISCVState *s, uint32_t addr, uint32_t val) {
    s->mem[addr] = val & 0xff;
}

int riscv_step(RISCVState *s) {
    uint32_t inst = read32(s, s->pc);
    uint32_t opcode = inst & 0x7f;
    uint32_t rd = (inst >> 7) & 0x1f;
    uint32_t rs1 = (inst >> 15) & 0x1f;
    uint32_t rs2 = (inst >> 20) & 0x1f;
    uint32_t funct3 = (inst >> 12) & 0x7;
    uint32_t funct7 = (inst >> 25) & 0x7f;
    
    switch (opcode) {
    case OP_LUI:
        s->x[rd] = inst & 0xfffff000;
        s->pc += 4;
        break;
        
    case OP_AUIPC:
        s->x[rd] = s->pc + (inst & 0xfffff000);
        s->pc += 4;
        break;
        
    case OP_JAL: {
        uint32_t imm = ((inst >> 31) << 20) |
                       (((inst >> 21) & 0x3ff) << 1) |
                       (((inst >> 20) & 1) << 11) |
                       (((inst >> 12) & 0xff) << 12);
        imm = sign_ext(imm, 21);
        s->x[rd] = s->pc + 4;
        s->pc += imm;
        break;
    }
    
    case OP_JALR: {
        uint32_t imm = sign_ext((inst >> 20), 12);
        uint32_t target = (s->x[rs1] + imm) & ~1;
        s->x[rd] = s->pc + 4;
        s->pc = target;
        break;
    }
    
    case OP_BRANCH: {
        uint32_t imm = (((inst >> 31) << 12) |
                       (((inst >> 25) & 0x3f) << 5) |
                       (((inst >> 8) & 0xf) << 1) |
                       (((inst >> 7) & 1) << 11));
        imm = sign_ext(imm, 13);
        
        int32_t take = 0;
        int32_t v1 = (int32_t)s->x[rs1];
        int32_t v2 = (int32_t)s->x[rs2];
        uint32_t uv1 = s->x[rs1];
        uint32_t uv2 = s->x[rs2];
        
        switch (funct3) {
        case F3_BEQ:  take = uv1 == uv2; break;
        case F3_BNE:  take = uv1 != uv2; break;
        case F3_BLT:  take = v1 < v2; break;
        case F3_BGE:  take = v1 >= v2; break;
        case F3_BLTU: take = uv1 < uv2; break;
        case F3_BGEU: take = uv1 >= uv2; break;
        default:
            fprintf(stderr, "Unknown branch funct3: %d\n", funct3);
            return 0;
        }
        
        if (take)
            s->pc += imm << 1;
        else
            s->pc += 4;
        break;
    }
    
    case OP_LOAD: {
        uint32_t imm = sign_ext((inst >> 20), 12);
        uint32_t addr = (s->x[rs1] + imm) & 0xffffffff;
        
        switch (funct3) {
        case F3_LB:  s->x[rd] = sign_ext(read8(s, addr), 8); break;
        case F3_LH:  s->x[rd] = sign_ext(read16(s, addr), 16); break;
        case F3_LW:  s->x[rd] = sign_ext(read32(s, addr), 32); break;
        case F3_LBU: s->x[rd] = read8(s, addr); break;
        case F3_LHU: s->x[rd] = read16(s, addr); break;
        default:
            fprintf(stderr, "Unknown load funct3: %d\n", funct3);
            return 0;
        }
        s->pc += 4;
        break;
    }
    
    case OP_STORE: {
        uint32_t imm = sign_ext((((inst >> 25) << 5) | ((inst >> 7) & 0x1f)), 12);
        uint32_t addr = (s->x[rs1] + imm) & 0xffffffff;
        
        switch (funct3) {
        case F3_SB: write8(s, addr, s->x[rs2]); break;
        case F3_SH: write16(s, addr, s->x[rs2]); break;
        case F3_SW: write32(s, addr, s->x[rs2]); break;
        default:
            fprintf(stderr, "Unknown store funct3: %d\n", funct3);
            return 0;
        }
        s->pc += 4;
        break;
    }
    
    case OP_IMM: {
        uint32_t imm = sign_ext((inst >> 20), 12);
        uint32_t shamt = (inst >> 20) & 0x1f;
        
        switch (funct3) {
        case F3_ADD:  s->x[rd] = (s->x[rs1] + imm) & 0xffffffff; break;
        case F3_SLT:  s->x[rd] = ((int32_t)s->x[rs1] < (int32_t)imm) ? 1 : 0; break;
        case F3_SLTU: s->x[rd] = (s->x[rs1] < (imm & 0xffffffff)) ? 1 : 0; break;
        case F3_XOR:  s->x[rd] = s->x[rs1] ^ imm; break;
        case F3_OR:   s->x[rd] = s->x[rs1] | imm; break;
        case F3_AND:  s->x[rd] = s->x[rs1] & imm; break;
        case F3_SLL:  s->x[rd] = (s->x[rs1] << shamt) & 0xffffffff; break;
        case F3_SR:
            if (funct7 & 0x20)  /* SRAI */
                s->x[rd] = sign_ext(s->x[rs1], 32) >> shamt;
            else  /* SRLI */
                s->x[rd] = (s->x[rs1] & 0xffffffff) >> shamt;
            break;
        default:
            fprintf(stderr, "Unknown OP-IMM funct3: %d\n", funct3);
            return 0;
        }
        s->pc += 4;
        break;
    }
    
    case OP_OP: {
        uint32_t shamt = s->x[rs2] & 0x1f;
        
        switch (funct3) {
        case F3_ADD:
            if (funct7 & 0x20)  /* SUB */
                s->x[rd] = (s->x[rs1] - s->x[rs2]) & 0xffffffff;
            else
                s->x[rd] = (s->x[rs1] + s->x[rs2]) & 0xffffffff;
            break;
        case F3_SLL: s->x[rd] = (s->x[rs1] << shamt) & 0xffffffff; break;
        case F3_SLT: s->x[rd] = ((int32_t)s->x[rs1] < (int32_t)s->x[rs2]) ? 1 : 0; break;
        case F3_SLTU: s->x[rd] = (s->x[rs1] < s->x[rs2]) ? 1 : 0; break;
        case F3_XOR: s->x[rd] = s->x[rs1] ^ s->x[rs2]; break;
        case F3_SR:
            if (funct7 & 0x20)  /* SRA */
                s->x[rd] = sign_ext(s->x[rs1], 32) >> shamt;
            else  /* SRL */
                s->x[rd] = (s->x[rs1] & 0xffffffff) >> shamt;
            break;
        case F3_OR:  s->x[rd] = s->x[rs1] | s->x[rs2]; break;
        case F3_AND: s->x[rd] = s->x[rs1] & s->x[rs2]; break;
        default:
            fprintf(stderr, "Unknown OP funct3: %d\n", funct3);
            return 0;
        }
        s->pc += 4;
        break;
    }
    
    case OP_SYSTEM: {
        uint32_t imm = (inst >> 20) & 0xfff;
        if (funct3 == 0) {
            if (imm == 0)  /* ECALL */
                return 0;  /* halt */
            if (imm == 1)  /* EBREAK */
                return 0;  /* halt */
        }
        s->pc += 4;
        break;
    }
    
    default:
        fprintf(stderr, "Unknown opcode: %07b at PC=0x%08x\n", opcode, s->pc);
        return 0;
    }
    
    s->x[0] = 0;  /* x0 is hardwired to 0 */
    return 1;
}

void riscv_load_binary(RISCVState *s, const char *path, uint32_t base) {
    FILE *f = fopen(path, "rb");
    if (!f) {
        perror("fopen");
        exit(1);
    }
    
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    if (base + size > MEM_SIZE) {
        fprintf(stderr, "Binary too large\n");
        exit(1);
    }
    
    fread(s->mem + base, 1, size, f);
    fclose(f);
    s->pc = base;
}

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <binary>\n", argv[0]);
        return 1;
    }
    
    RISCVState state;
    memset(&state, 0, sizeof(state));
    
    riscv_load_binary(&state, argv[1], 0);
    
    uint64_t steps = 0;
    while (riscv_step(&state)) {
        steps++;
        if (steps > 10000000) {
            fprintf(stderr, "Too many steps, stopping\n");
            break;
        }
    }
    
    printf("Executed %lu instructions\n", steps);
    printf("x1 (ra)  = 0x%08x\n", state.x[1]);
    printf("x2 (sp)  = 0x%08x\n", state.x[2]);
    printf("x10 (a0) = 0x%08x (%d)\n", state.x[10], (int32_t)state.x[10]);
    
    return 0;
}
