#!/usr/bin/env python3
"""
Extended RISC-V RV32I Test Suite
Lev Osin, Alcor BCI Terminal
December 2025

Comprehensive tests for all RV32I base instructions.
"""

import struct
import sys

# Import the emulator
sys.path.insert(0, '/home/user/public_html')
from riscv_emulator import RV32I, encode_r, encode_i, encode_s, encode_b, encode_u, encode_j

def test_lui():
    """Test LUI instruction"""
    emu = RV32I()
    emu.memory[0:4] = encode_u(0x37, 1, 0x12345000)
    emu.memory[4:8] = struct.pack('<I', 0x00000073)
    emu.run()
    assert emu.x[1] == 0x12345000, f"LUI failed: {emu.x[1]:#x} != 0x12345000"
    print("✓ LUI test passed")

def test_auipc():
    """Test AUIPC instruction"""
    emu = RV32I()
    emu.memory[0:4] = encode_u(0x17, 1, 0x12345000)
    emu.memory[4:8] = struct.pack('<I', 0x00000073)
    emu.run()
    expected = 0x12345000
    assert emu.x[1] == expected, f"AUIPC failed: {emu.x[1]:#x} != {expected:#x}"
    print("✓ AUIPC test passed")

def test_jal():
    """Test JAL instruction - jump forward 8 bytes"""
    emu = RV32I()
    emu.memory[0:4] = encode_j(0x6F, 1, 8)
    emu.memory[4:8] = struct.pack('<I', 0x00000013)
    emu.memory[8:12] = struct.pack('<I', 0x00000073)
    emu.run()
    assert emu.pc == 8, f"JAL PC failed: {emu.pc} != 8"
    assert emu.x[1] == 4, f"JAL link failed: {emu.x[1]} != 4"
    print("✓ JAL test passed")

def test_jalr():
    """Test JALR instruction"""
    emu = RV32I()
    emu.memory[0:4] = encode_i(0x13, 2, 0, 16, 0)
    emu.memory[4:8] = encode_i(0x67, 1, 2, 4, 0)
    emu.memory[20:24] = struct.pack('<I', 0x00000073)
    emu.run()
    assert emu.x[1] == 8, f"JALR link failed: {emu.x[1]} != 8"
    print("✓ JALR test passed")

def test_branch_beq():
    """Test BEQ instruction - branch when equal"""
    emu = RV32I()
    emu.memory[0:4] = encode_i(0x13, 1, 0, 5, 0)
    emu.memory[4:8] = encode_i(0x13, 2, 0, 5, 0)
    emu.memory[8:12] = encode_b(0x63, 1, 2, 8, 0)
    emu.memory[12:16] = struct.pack('<I', 0x00000013)
    emu.memory[16:20] = struct.pack('<I', 0x00000073)
    emu.run()
    assert emu.pc == 16, f"BEQ PC failed: {emu.pc} != 16"
    print("✓ BEQ test passed")

def test_branch_bne():
    """Test BNE instruction - branch when not equal"""
    emu = RV32I()
    emu.memory[0:4] = encode_i(0x13, 1, 0, 5, 0)
    emu.memory[4:8] = encode_i(0x13, 2, 0, 3, 0)
    emu.memory[8:12] = encode_b(0x63, 1, 2, 8, 1)
    emu.memory[16:20] = struct.pack('<I', 0x00000073)
    emu.run()
    assert emu.pc == 16, f"BNE PC failed: {emu.pc} != 16"
    print("✓ BNE test passed")

def test_alu_ops():
    """Test various ALU operations"""
    emu = RV32I()
    program = b""
    program += encode_i(0x13, 1, 0, 10, 0)
    program += encode_i(0x13, 2, 0, 3, 0)
    program += encode_r(0x33, 3, 1, 2, 0, 0)
    program += encode_r(0x33, 4, 1, 2, 0, 0x20)
    program += encode_r(0x33, 5, 1, 2, 7, 0)
    program += encode_r(0x33, 6, 1, 2, 6, 0)
    program += encode_r(0x33, 7, 1, 2, 4, 0)
    program += struct.pack('<I', 0x00000073)
    
    emu.load_program(program)
    emu.run()
    
    assert emu.x[3] == 13, f"ADD failed: {emu.x[3]} != 13"
    assert emu.x[4] == 7, f"SUB failed: {emu.x[4]} != 7"
    assert emu.x[5] == 2, f"AND failed: {emu.x[5]} != 2"
    assert emu.x[6] == 11, f"OR failed: {emu.x[6]} != 11"
    assert emu.x[7] == 9, f"XOR failed: {emu.x[7]} != 9"
    print("✓ ALU ops test passed")

def test_load_store():
    """Test load and store instructions"""
    emu = RV32I()
    program = b""
    program += encode_i(0x13, 1, 0, 0xAB, 0)
    program += encode_s(0x23, 0, 1, 0, 2)
    program += encode_i(0x03, 2, 0, 0, 2)
    program += encode_i(0x13, 3, 0, 0xCD, 0)
    program += encode_s(0x23, 0, 3, 4, 0)
    program += encode_i(0x03, 5, 0, 4, 4)
    program += struct.pack('<I', 0x00000073)
    
    emu.load_program(program)
    emu.run()
    
    assert emu.x[2] == 0xAB, f"LW failed: {emu.x[2]:#x} != 0xab"
    assert emu.x[5] == 0xCD, f"LBU failed: {emu.x[5]:#x} != 0xcd"
    print("✓ Load/Store test passed")

def run_all_tests():
    print("=" * 50)
    print("RISC-V RV32I Extended Test Suite")
    print("Lev Osin, Alcor BCI Terminal")
    print("=" * 50)
    
    tests = [
        test_lui, test_auipc, test_jal, test_jalr,
        test_branch_beq, test_branch_bne,
        test_alu_ops, test_load_store,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"✗ {test.__name__} FAILED: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ {test.__name__} ERROR: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print("=" * 50)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 50)
    
    return failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
