/*
 * RISC-V RV64I Emulator Header
 * Clean room implementation for compliance testing
 */

#ifndef RV64I_H
#define RV64I_H

#include <stdint.h>
#include <stdbool.h>

#define RV_REGS 32
#define RV_XLEN 64

/* CPU State */
typedef struct {
    uint64_t x[RV_REGS];      /* Integer registers, x0 is always zero */
    uint64_t pc;              /* Program counter */
    uint64_t next_pc;         /* Next PC (for branches) */
    bool trap;                /* Exception/trap occurred */
    uint64_t trap_cause;      /* Trap cause code */
} rv_cpu;

/* Memory interface - simplified for testing */
typedef struct {
    uint8_t *data;
    uint64_t size;
} rv_mem;

/* Instruction encoding helpers */
#define OPCODE(insn)    ((insn) & 0x7F)
#define RD(insn)        (((insn) >> 7) & 0x1F)
#define FUNCT3(insn)    (((insn) >> 12) & 0x7)
#define RS1(insn)       (((insn) >> 15) & 0x1F)
#define RS2(insn)       (((insn) >> 20) & 0x1F)
#define FUNCT7(insn)    (((insn) >> 25) & 0x7F)

/* I-type immediate */
#define IMM_I(insn)     ((int64_t)((int32_t)(insn)) >> 20)
/* S-type immediate */
#define IMM_S(insn)     ((int64_t)((int32_t)(((insn) & 0xFE000000) >> 20) | \
                                  (((insn) >> 7) & 0x1F)))
/* B-type immediate */
#define IMM_B(insn)     ((int64_t)((int32_t)(((insn) & 0x80000000) >> 19) | \
                                  (((insn) & 0x7E000000) >> 20) | \
                                  (((insn) >> 7) & 0x1E) | \
                                  (((insn) << 4) & 0x800))))
/* U-type immediate */
#define IMM_U(insn)     ((int64_t)((insn) & 0xFFFFF000))
/* J-type immediate */
#define IMM_J(insn)     ((int64_t)((int32_t)(((insn) & 0x80000000) >> 11) | \
                                  (((insn) & 0x7FE00000) >> 20) | \
                                  (((insn) >> 9) & 0x400) | \
                                  (((insn) & 0xFF000))))

/* Opcodes */
#define OP_LUI      0x37
#define OP_AUIPC    0x17
#define OP_JAL      0x6F
#define OP_JALR     0x67
#define OP_BRANCH   0x63
#define OP_LOAD     0x03
#define OP_STORE    0x23
#define OP_IMM      0x13
#define OP_OP       0x33
#define OP_IMM32    0x1B
#define OP_OP32     0x3B
#define OP_SYSTEM   0x73

/* ALU funct3 values */
#define ALU_ADD     0
#define ALU_SLL     1
#define ALU_SLT     2
#define ALU_SLTU    3
#define ALU_XOR     4
#define ALU_SR      5
#define ALU_OR      6
#define ALU_AND     7

/* Branch funct3 values */
#define BR_BEQ      0
#define BR_BNE      1
#define BR_BLT      4
#define BR_BGE      5
#define BR_BLTU     6
#define BR_BGEU     7

/* Load/store funct3 values */
#define LS_BYTE     0
#define LS_HALF     1
#define LS_WORD     2
#define LS_DOUBLE   3
#define LS_UBYTE    4
#define LS_UHALF    5
#define LS_UWORD    6

/* CSR addresses */
#define CSR_MSTATUS     0x300
#define CSR_MISA        0x301
#define CSR_MEDELEG     0x302
#define CSR_MIDELEG     0x303
#define CSR_MIE         0x304
#define CSR_MTVEC       0x305
#define CSR_MCOUNTEREN  0x306
#define CSR_MSCRATCH    0x340
#define CSR_MEPC        0x341
#define CSR_MCAUSE      0x342
#define CSR_MTVAL       0x343
#define CSR_MIP         0x344

/* Function prototypes */
void rv_init(rv_cpu *cpu);
bool rv_step(rv_cpu *cpu, rv_mem *mem);
uint32_t rv_fetch(rv_cpu *cpu, rv_mem *mem);

#endif /* RV64I_H */
