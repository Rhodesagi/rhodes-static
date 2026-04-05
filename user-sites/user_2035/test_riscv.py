#!/usr/bin/env python3
"""Test harness for riscv.py emulator"""

import sys
import struct

# Simple RV32I test program that sets x10 = 42 and ECALLs to exit
def make_test_prog():
    # li a0, 42     -> addi x10, x0, 42
    # li a7, 93     -> addi x17, x0, 93  (exit syscall)
    # ecall
    prog = bytearray(1 << 20)
    
    # Instructions encoded as little-endian 32-bit words
    # addi x10, x0, 42 = 0x02a00513
    # addi x17, x0, 93 = 0x05d00893  
    # ecall = 0x00000073
    
    inst = [
        0x02a00513,  # addi a0, zero, 42
        0x05d00893,  # addi a7, zero, 93 (exit)
        0x00000073,  # ecall
    ]
    
    for i, w in enumerate(inst):
        prog[i*4:(i+1)*4] = struct.pack('<I', w)
    
    return bytes(prog)

def run_simple_test():
    from riscv import RISCVEmu
    
    # Create test binary
    test_bin = make_test_prog()
    
    emu = RISCVEmu()
    emu.mem[:len(test_bin)] = test_bin
    emu.pc = 0
    
    print("Running RV32I test: addi a0,42 -> addi a7,93 -> ecall")
    steps = emu.run(max_steps=100)
    
    print(f"Steps: {steps}")
    print(f"a0 (x10) = {emu.regs[10]}")
    print(f"a7 (x17) = {emu.regs[17]}")
    print(f"PC = {emu.pc:08x}")
    
    if emu.regs[10] == 42:
        print("\n[PASS] Basic ADDI and ECALL work correctly")
        return True
    else:
        print("\n[FAIL] Expected a0=42")
        return False

if __name__ == "__main__":
    success = run_simple_test()
    sys.exit(0 if success else 1)
