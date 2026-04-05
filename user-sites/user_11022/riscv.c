/* RV32I emulator - Lev Osin, 2025/12/02
 * Baremetal implementation, no libc dependencies for core
 */

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MEM_SIZE (1024 * 1024)  /* 1MB RAM */
#define XREG_COUNT 32

enum {
    OPCODE_LOAD = 0x03,
    OPCODE_MISC_MEM = 0x0F,
    OPCODE_OP_IMM = 0x13,
    OPCODE_AUIPC = 0x17,
    OPCODE_STORE = 0x23,
    OPCODE_OP = 0x33,
    OPCODE_LUI = 0x37,
    OPCODE_BRANCH = 0x63,
    OPCODE_JALR = 0x67,
    OPCODE_JAL = 0x6F,
    OPCODE_SYSTEM = 0x73,
};

typedef struct {
    uint32_t x[XREG_COUNT];
    uint32_t pc;
    uint8_t mem[MEM_SIZE];
    int running;
} RISCVState;

static inline uint32_t extract_bits(uint32_t val, int hi, int lo) {
    return (val >> lo) & ((1U << (hi - lo + 1)) - 1);
}

static inline int32_t sign_extend(uint32_t val, int bits) {
    int32_t mask = 1 << (bits - 1);
    return (val ^ mask) - mask;
}

static uint32_t decode_i_imm(uint32_t inst) {
    return sign_extend(extract_bits(inst, 31, 20), 12);
}

static uint32_t decode_s_imm(uint32_t inst) {
    uint32_t imm = (extract_bits(inst, 31, 25) << 5) | extract_bits(inst, 11, 7);
    return sign_extend(imm, 12);
}

static uint32_t decode_b_imm(uint32_t inst) {
    uint32_t imm = (extract_bits(inst, 31, 31) << 12) |
                   (extract_bits(inst, 30, 25) << 5) |
                   (extract_bits(inst, 11, 8) << 1) |
                   (extract_bits(inst, 7, 7) << 11);
    return sign_extend(imm, 13);
}

static uint32_t decode_u_imm(uint32_t inst) {
    return extract_bits(inst, 31, 12) << 12;
}

static uint32_t decode_j_imm(uint32_t inst) {
    uint32_t imm = (extract_bits(inst, 31, 31) << 20) |
                   (extract_bits(inst, 30, 21) << 1) |
                   (extract_bits(inst, 20, 20) << 11) |
                   (extract_bits(inst, 19, 12) << 12);
    return sign_extend(imm, 21);
}

static uint32_t read_mem32(RISCVState *s, uint32_t addr) {
    if (addr + 4 > MEM_SIZE) return 0;
    return *(uint32_t *)(s->mem + addr);
}

static uint16_t read_mem16(RISCVState *s, uint32_t addr) {
    if (addr + 2 > MEM_SIZE) return 0;
    return *(uint16_t *)(s->mem + addr);
}

static uint8_t read_mem8(RISCVState *s, uint32_t addr) {
    if (addr >= MEM_SIZE) return 0;
    return s->mem[addr];
}

static void write_mem32(RISCVState *s, uint32_t addr, uint32_t val) {
    if (addr + 4 > MEM_SIZE) return;
    *(uint32_t *)(s->mem + addr) = val;
}

static void write_mem16(RISCVState *s, uint32_t addr, uint16_t val) {
    if (addr + 2 > MEM_SIZE) return;
    *(uint16_t *)(s->mem + addr) = val;
}

static void write_mem8(RISCVState *s, uint32_t addr, uint8_t val) {
    if (addr >= MEM_SIZE) return;
    s->mem[addr] = val;
}

void riscv_init(RISCVState *s) {
    memset(s, 0, sizeof(*s));
    s->running = 1;
}

int riscv_load_binary(RISCVState *s, const char *filename) {
    FILE *f = fopen(filename, "rb");
    if (!f) return -1;
    fread(s->mem, 1, MEM_SIZE, f);
    fclose(f);
    return 0;
}

void riscv_step(RISCVState *s) {
    uint32_t inst = read_mem32(s, s->pc);
    uint32_t opcode = extract_bits(inst, 6, 0);
    uint32_t rd = extract_bits(inst, 11, 7);
    uint32_t rs1 = extract_bits(inst, 19, 15);
    uint32_t rs2 = extract_bits(inst, 24, 20);
    uint32_t funct3 = extract_bits(inst, 14, 12);
    uint32_t funct7 = extract_bits(inst, 31, 25);
    
    uint32_t next_pc = s->pc + 4;
    
    /* x0 is hardwired to 0 */
    #define RX(idx) ((idx) ? s->x[idx] : 0)
    
    switch (opcode) {
        case OPCODE_LUI:
            if (rd) s->x[rd] = decode_u_imm(inst);
            break;
            
        case OPCODE_AUIPC:
            if (rd) s->x[rd] = s->pc + decode_u_imm(inst);
            break;
            
        case OPCODE_JAL:
            if (rd) s->x[rd] = next_pc;
            next_pc = s->pc + decode_j_imm(inst);
            break;
            
        case OPCODE_JALR:
            if (rd) s->x[rd] = next_pc;
            next_pc = (RX(rs1) + decode_i_imm(inst)) & ~1;
            break;
            
        case OPCODE_BRANCH: {
            uint32_t rs1v = RX(rs1);
            uint32_t rs2v = RX(rs2);
            int taken = 0;
            switch (funct3) {
                case 0: taken = (rs1v == rs2v); break; /* BEQ */
                case 1: taken = (rs1v != rs2v); break; /* BNE */
                case 4: taken = ((int32_t)rs1v < (int32_t)rs2v); break; /* BLT */
                case 5: taken = ((int32_t)rs1v >= (int32_t)rs2v); break; /* BGE */
                case 6: taken = (rs1v < rs2v); break; /* BLTU */
                case 7: taken = (rs1v >= rs2v); break; /* BGEU */
            }
            if (taken) next_pc = s->pc + decode_b_imm(inst);
            break;
        }
        
        case OPCODE_LOAD: {
            uint32_t addr = RX(rs1) + decode_i_imm(inst);
            uint32_t val = 0;
            switch (funct3) {
                case 0: val = sign_extend(read_mem8(s, addr), 8); break;  /* LB */
                case 1: val = sign_extend(read_mem16(s, addr), 16); break; /* LH */
                case 2: val = read_mem32(s, addr); break;                   /* LW */
                case 4: val = read_mem8(s, addr); break;                    /* LBU */
                case 5: val = read_mem16(s, addr); break;                  /* LHU */
            }
            if (rd) s->x[rd] = val;
            break;
        }
        
        case OPCODE_STORE: {
            uint32_t addr = RX(rs1) + decode_s_imm(inst);
            uint32_t val = RX(rs2);
            switch (funct3) {
                case 0: write_mem8(s, addr, val); break;   /* SB */
                case 1: write_mem16(s, addr, val); break;  /* SH */
                case 2: write_mem32(s, addr, val); break;  /* SW */
            }
            break;
        }
        
        case OPCODE_OP_IMM: {
            uint32_t rs1v = RX(rs1);
            uint32_t imm = decode_i_imm(inst);
            uint32_t shamt = extract_bits(imm, 4, 0);
            uint32_t val = 0;
            switch (funct3) {
                case 0: val = rs1v + imm; break;           /* ADDI */
                case 2: val = ((int32_t)rs1v < (int32_t)imm) ? 1 : 0; break; /* SLTI */
                case 3: val = (rs1v < imm) ? 1 : 0; break; /* SLTIU */
                case 4: val = rs1v ^ imm; break;           /* XORI */
                case 6: val = rs1v | imm; break;           /* ORI */
                case 7: val = rs1v & imm; break;          /* ANDI */
                case 1: val = rs1v << shamt; break;       /* SLLI */
                case 5:
                    if (extract_bits(imm, 11, 5) == 0) {
                        val = rs1v >> shamt;                  /* SRLI */
                    } else {
                        val = (int32_t)rs1v >> shamt;         /* SRAI */
                    }
                    break;
            }
            if (rd) s->x[rd] = val;
            break;
        }
        
        case OPCODE_OP: {
            uint32_t rs1v = RX(rs1);
            uint32_t rs2v = RX(rs2);
            uint32_t val = 0;
            switch (funct3) {
                case 0:
                    if (funct7 == 0) val = rs1v + rs2v;        /* ADD */
                    else if (funct7 == 0x20) val = rs1v - rs2v; /* SUB */
                    break;
                case 1: val = rs1v << rs2v; break;               /* SLL */
                case 2: val = ((int32_t)rs1v < (int32_t)rs2v) ? 1 : 0; break; /* SLT */
                case 3: val = (rs1v < rs2v) ? 1 : 0; break;      /* SLTU */
                case 4: val = rs1v ^ rs2v; break;               /* XOR */
                case 5:
                    if (funct7 == 0) val = rs1v >> rs2v;        /* SRL */
                    else if (funct7 == 0x20) val = (int32_t)rs1v >> rs2v; /* SRA */
                    break;
                case 6: val = rs1v | rs2v; break;                /* OR */
                case 7: val = rs1v & rs2v; break;               /* AND */
            }
            if (rd) s->x[rd] = val;
            break;
        }
        
        case OPCODE_SYSTEM:
            if (inst == 0x00000073) { /* ECALL */
                if (s->x[17] == 93) { /* exit syscall */
                    s->running = 0;
                } else if (s->x[17] == 64) { /* write syscall */
                    uint32_t fd = s->x[10];
                    uint32_t buf = s->x[11];
                    uint32_t count = s->x[12];
                    if (fd == 1) {
                        for (uint32_t i = 0; i < count && (buf + i) < MEM_SIZE; i++) {
                            putchar(s->mem[buf + i]);
                        }
                    }
                }
            }
            break;
    }
    
    s->pc = next_pc;
}

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "usage: %s <riscv-binary>\n", argv[0]);
        return 1;
    }
    
    RISCVState state;
    riscv_init(&state);
    
    if (riscv_load_binary(&state, argv[1]) < 0) {
        perror("load");
        return 1;
    }
    
    int steps = 0;
    while (state.running && steps < 10000000) {
        riscv_step(&state);
        steps++;
    }
    
    return 0;
}
