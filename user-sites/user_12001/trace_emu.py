#!/usr/bin/env python3
import sys
sys.path.insert(0, '/var/www/html/user-sites/user_12001')
from riscv_emulator import RISCVEmu

emu = RISCVEmu()
emu.load_binary('/var/www/html/user-sites/user_12001/fib.bin')

print("Initial state: x10=0, x11=0, x12=0, x13=0")
for i in range(200):
    pc = emu.pc
    if pc >= 52:
        print(f"Step {i}: PC=0x{pc:08x} - past end of program!")
        break
    inst = emu.read32(pc)
    
    # Execute
    cont = emu.step()
    
    # Print state
    print(f"Step {i}: PC=0x{pc:08x}, inst=0x{inst:08x} -> PC=0x{emu.pc:08x}")
    print(f"  x10={emu.x[10]}, x11={emu.x[11]}, x12={emu.x[12]}, x13={emu.x[13]}, x14={emu.x[14]}")
    
    if not cont:
        print("Halted!")
        break
    if i > 150:
        print("Too many steps, stopping")
        break
