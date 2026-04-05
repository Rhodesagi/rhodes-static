#!/usr/bin/env python3
import sys
sys.path.insert(0, '/var/www/html/user-sites/user_12001')
from riscv_emulator import RISCVEmu

emu = RISCVEmu()
emu.load_binary('/var/www/html/user-sites/user_12001/fib.bin')

print("Initial PC:", emu.pc)
for i in range(20):
    pc = emu.pc
    inst = emu.read32(pc)
    print(f"Step {i}: PC=0x{pc:08x}, inst=0x{inst:08x}")
    if not emu.step():
        print("Halted")
        break
    print(f"  x10={emu.x[10]}, x11={emu.x[11]}, x12={emu.x[12]}, x13={emu.x[13]}, x14={emu.x[14]}")
    if i > 50:
        break
