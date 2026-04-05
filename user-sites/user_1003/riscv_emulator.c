/*
 * Minimal RISC-V RV32I Emulator
 * Lev Osin - Testing cognitive function post-vitrification
 */

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MEM_SIZE (1024 * 1024)  /* 1MB RAM */
#define REG_SP 2
#define REG_RA 1

typedef struct {
    uint32_t pc;
    uint32_t regs[32];
    uint8_t mem[MEM_SIZE];
    int running;
} riscv_vm;

/* Instruction encoding helpers */
#define OPCODE(instr) ((instr) & 0x7F)
#define RD(instr) (((instr) >> 7) & 0x1F)
#define RS1(instr) (((instr) >> 15) & 0x1F)
#define RS2(instr) (((instr) >> 20) & 0x1F)
#define FUNCT3(instr) (((instr) >> 12) & 0x7)
#define FUNCT7(instr) (((instr) >> 25) & 0x7F)
#define IMM_I(instr) (((int32_t)(instr) >> 20))
#define IMM_S(instr) ((((int32_t)(instr) >> 25) << 5) | (((instr) >> 7) & 0x1F))
#define IMM_U(instr) ((int32_t)(instr) & 0xFFFFF000)
#define IMM_J(instr) (((((int32_t)(instr) >> 31) & 1) << 20) | \
                     (((instr) >> 21) & 0x3FF) << 1 | \
                     (((instr) >> 20) & 1) << 11 | \
                     (((instr) >> 12) & 0xFF) << 12)
#define IMM_B(instr) (((((int32_t)(instr) >> 31) & 1) << 12) | \
                     (((instr) >> 7) & 1) << 11 | \
                     (((instr) >> 25) & 0x3F) << 5 | \
                     (((instr) >> 8) & 0xF) << 1)

static inline uint32_t read32(riscv_vm *vm, uint32_t addr) {
    if (addr + 3 >= MEM_SIZE) return 0;
    return *(uint32_t*)(vm->mem + addr);
}

static inline void write32(riscv_vm *vm, uint32_t addr, uint32_t val) {
    if (addr + 3 < MEM_SIZE) *(uint32_t*)(vm->mem + addr) = val;
}

static inline uint16_t read16(riscv_vm *vm, uint32_t addr) {
    if (addr + 1 >= MEM_SIZE) return 0;
    return *(uint16_t*)(vm->mem + addr);
}

static inline uint8_t read8(riscv_vm *vm, uint32_t addr) {
    if (addr >= MEM_SIZE) return 0;
    return vm->mem[addr];
}

static inline void write8(riscv_vm *vm, uint32_t addr, uint8_t val) {
    if (addr < MEM_SIZE) vm->mem[addr] = val;
}

static inline int32_t sign_extend(uint32_t val, int bits) {
    int shift = 32 - bits;
    return (int32_t)(val << shift) >> shift;
}

void vm_init(riscv_vm *vm) {
    memset(vm, 0, sizeof(*vm));
    vm->regs[REG_SP] = MEM_SIZE - 4;
    vm->running = 1;
}

int vm_load_program(riscv_vm *vm, const char *filename) {
    FILE *f = fopen(filename, "rb");
    if (!f) return -1;
    
    size_t n = fread(vm->mem, 1, MEM_SIZE, f);
    fclose(f);
    
    printf("Loaded %zu bytes at 0x0\n", n);
    return 0;
}

void vm_step(riscv_vm *vm) {
    uint32_t instr = read32(vm, vm->pc);
    uint32_t opcode = OPCODE(instr);
    uint32_t rd = RD(instr);
    uint32_t rs1 = RS1(instr);
    uint32_t rs2 = RS2(instr);
    uint32_t funct3 = FUNCT3(instr);
    
    /* x0 is hardwired to 0 */
    #define REG(n) ((n) == 0 ? 0 : vm->regs[n])
    
    switch (opcode) {
        case 0x37: /* LUI */
            vm->regs[rd] = IMM_U(instr);
            vm->pc += 4;
            break;
            
        case 0x17: /* AUIPC */
            vm->regs[rd] = vm->pc + IMM_U(instr);
            vm->pc += 4;
            break;
            
        case 0x6F: /* JAL */
            vm->regs[rd] = vm->pc + 4;
            vm->pc += sign_extend(IMM_J(instr), 21);
            break;
            
        case 0x67: /* JALR */
            if (funct3 == 0) {
                uint32_t target = (REG(rs1) + IMM_I(instr)) & ~1;
                vm->regs[rd] = vm->pc + 4;
                vm->pc = target;
            }
            break;
            
        case 0x63: /* Branches */
            switch (funct3) {
                case 0: /* BEQ */
                    vm->pc += (REG(rs1) == REG(rs2)) ? sign_extend(IMM_B(instr), 13) : 4;
                    break;
                case 1: /* BNE */
                    vm->pc += (REG(rs1) != REG(rs2)) ? sign_extend(IMM_B(instr), 13) : 4;
                    break;
                case 4: /* BLT */
                    vm->pc += ((int32_t)REG(rs1) < (int32_t)REG(rs2)) ? sign_extend(IMM_B(instr), 13) : 4;
                    break;
                case 5: /* BGE */
                    vm->pc += ((int32_t)REG(rs1) >= (int32_t)REG(rs2)) ? sign_extend(IMM_B(instr), 13) : 4;
                    break;
                case 6: /* BLTU */
                    vm->pc += (REG(rs1) < REG(rs2)) ? sign_extend(IMM_B(instr), 13) : 4;
                    break;
                case 7: /* BGEU */
                    vm->pc += (REG(rs1) >= REG(rs2)) ? sign_extend(IMM_B(instr), 13) : 4;
                    break;
                default:
                    vm->pc += 4;
            }
            break;
            
        case 0x03: /* Loads */
            switch (funct3) {
                case 0: /* LB */
                    vm->regs[rd] = sign_extend(read8(vm, REG(rs1) + IMM_I(instr)), 8);
                    break;
                case 1: /* LH */
                    vm->regs[rd] = sign_extend(read16(vm, REG(rs1) + IMM_I(instr)), 16);
                    break;
                case 2: /* LW */
                    vm->regs[rd] = read32(vm, REG(rs1) + IMM_I(instr));
                    break;
                case 4: /* LBU */
                    vm->regs[rd] = read8(vm, REG(rs1) + IMM_I(instr));
                    break;
                case 5: /* LHU */
                    vm->regs[rd] = read16(vm, REG(rs1) + IMM_I(instr));
                    break;
            }
            vm->pc += 4;
            break;
            
        case 0x23: /* Stores */
            switch (funct3) {
                case 0: /* SB */
                    write8(vm, REG(rs1) + sign_extend(IMM_S(instr), 12), REG(rs2) & 0xFF);
                    break;
                case 1: /* SH */
                    *(uint16_t*)(vm->mem + (REG(rs1) + sign_extend(IMM_S(instr), 12))) = REG(rs2) & 0xFFFF;
                    break;
                case 2: /* SW */
                    write32(vm, REG(rs1) + sign_extend(IMM_S(instr), 12), REG(rs2));
                    break;
            }
            vm->pc += 4;
            break;
            
        case 0x13: /* ALU Immediate */
            switch (funct3) {
                case 0: /* ADDI */
                    vm->regs[rd] = REG(rs1) + IMM_I(instr);
                    break;
                case 1: /* SLLI */
                    vm->regs[rd] = REG(rs1) << (instr >> 20);
                    break;
                case 2: /* SLTI */
                    vm->regs[rd] = ((int32_t)REG(rs1) < IMM_I(instr)) ? 1 : 0;
                    break;
                case 3: /* SLTIU */
                    vm->regs[rd] = (REG(rs1) < (uint32_t)IMM_I(instr)) ? 1 : 0;
                    break;
                case 4: /* XORI */
                    vm->regs[rd] = REG(rs1) ^ IMM_I(instr);
                    break;
                case 5: /* SRLI/SRAI */
                    if ((instr >> 30) & 1) /* SRAI */
                        vm->regs[rd] = (int32_t)REG(rs1) >> ((instr >> 20) & 0x1F);
                    else /* SRLI */
                        vm->regs[rd] = REG(rs1) >> ((instr >> 20) & 0x1F);
                    break;
                case 6: /* ORI */
                    vm->regs[rd] = REG(rs1) | IMM_I(instr);
                    break;
                case 7: /* ANDI */
                    vm->regs[rd] = REG(rs1) & IMM_I(instr);
                    break;
            }
            vm->pc += 4;
            break;
            
        case 0x33: /* ALU Register */
            switch (funct3) {
                case 0: /* ADD/SUB */
                    if ((instr >> 30) & 1)
                        vm->regs[rd] = REG(rs1) - REG(rs2);
                    else
                        vm->regs[rd] = REG(rs1) + REG(rs2);
                    break;
                case 1: /* SLL */
                    vm->regs[rd] = REG(rs1) << (REG(rs2) & 0x1F);
                    break;
                case 2: /* SLT */
                    vm->regs[rd] = ((int32_t)REG(rs1) < (int32_t)REG(rs2)) ? 1 : 0;
                    break;
                case 3: /* SLTU */
                    vm->regs[rd] = (REG(rs1) < REG(rs2)) ? 1 : 0;
                    break;
                case 4: /* XOR */
                    vm->regs[rd] = REG(rs1) ^ REG(rs2);
                    break;
                case 5: /* SRL/SRA */
                    if ((instr >> 30) & 1)
                        vm->regs[rd] = (int32_t)REG(rs1) >> (REG(rs2) & 0x1F);
                    else
                        vm->regs[rd] = REG(rs1) >> (REG(rs2) & 0x1F);
                    break;
                case 6: /* OR */
                    vm->regs[rd] = REG(rs1) | REG(rs2);
                    break;
                case 7: /* AND */
                    vm->regs[rd] = REG(rs1) & REG(rs2);
                    break;
            }
            vm->pc += 4;
            break;
            
        case 0x73: /* ECALL/EBREAK */
            if (instr == 0x00000073) { /* ECALL */
                /* Simple syscall: a7=1 -> print char in a0 */
                if (vm->regs[17] == 1) {
                    putchar(vm->regs[10] & 0xFF);
                } else if (vm->regs[17] == 10) { /* exit */
                    vm->running = 0;
                }
            }
            vm->pc += 4;
            break;
            
        default:
            printf("Unknown opcode: 0x%02X at PC=0x%08X\n", opcode, vm->pc);
            vm->running = 0;
    }
}

void vm_run(riscv_vm *vm, int max_cycles) {
    int cycles = 0;
    while (vm->running && cycles < max_cycles) {
        vm_step(vm);
        cycles++;
    }
    if (cycles >= max_cycles) printf("Max cycles reached\n");
}

void vm_dump(riscv_vm *vm) {
    printf("\nRegister state:\n");
    for (int i = 0; i < 32; i++) {
        printf("x%02d = 0x%08X%s", i, vm->regs[i], (i % 4 == 3) ? "\n" : "  ");
    }
    printf("\nPC = 0x%08X\n", vm->pc);
}

/* Simple test: compile this with riscv32-unknown-elf-gcc:
 * int main() { return 42; }
 * Or use the built-in test below
 */

/* Assembled RISC-V program that prints "Hi" and exits:
 * lui  a0, 0x48
 * addi a0, a0, 0x69  ; a0 = 'Hi'
 * addi a7, zero, 1   ; syscall 1 = print char
 * ecall
 * addi a7, zero, 10  ; syscall 10 = exit
 * ecall
 */
static const uint32_t test_program[] = {
    0x000484b7,  /* lui x9, 0x48 */
    0x06948493,  /* addi x9, x9, 0x69 */
    0x00100893,  /* addi x17, x0, 1 */
    0x00085313,  /* mv x6, x9 (addi x6, x9, 0) */
    0x00000073,  /* ecall */
    0x00a00893,  /* addi x17, x0, 10 */
    0x00000073,  /* ecall */
};

int main(int argc, char **argv) {
    riscv_vm vm;
    vm_init(&vm);
    
    if (argc > 1) {
        if (vm_load_program(&vm, argv[1]) < 0) {
            printf("Failed to load %s\n", argv[1]);
            return 1;
        }
    } else {
        /* Load test program */
        memcpy(vm.mem, test_program, sizeof(test_program));
        printf("Loaded built-in test program (%zu bytes)\n", sizeof(test_program));
    }
    
    printf("Running...\nOutput: ");
    vm_run(&vm, 10000);
    printf("\n");
    vm_dump(&vm);
    
    return 0;
}
