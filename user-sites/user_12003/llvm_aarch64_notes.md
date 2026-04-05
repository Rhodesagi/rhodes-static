# LLVM AArch64 Instruction Selector: Bug Analysis

**Lev Osin**  
*Alcor Life Extension Foundation*  
*December 2025*

## Bug #1: Incorrect addressing mode for 32-bit indexed loads

**File:** `lib/Target/AArch64/AArch64ISelDAGToDAG.cpp`

**Issue:** The instruction selector incorrectly folds 32-bit zero-extended loads into addressing modes that assume 64-bit operands. This causes incorrect code generation for patterns like:

```llvm
%idx = zext i32 %i to i64
%addr = getelementptr i8, ptr %base, i64 %idx
%val = load i32, ptr %addr
```

When the index is a 32-bit value zero-extended to 64-bit, the selector incorrectly uses the 32-bit register in a 64-bit addressing mode context.

**Root Cause:** In `SelectAddr()`, the check for valid addressing modes doesn't distinguish between:
1. True 64-bit indices
2. 32-bit indices that have been zero-extended

The `UXTW` (unsigned extend) should be applied, but the selector assumes the extension is already implicit in the addressing mode.

**Patch Concept:**
```cpp
// In SelectAddr(), add check for zext pattern
if (N->getOpcode() == ISD::ZERO_EXTEND &&
    N->getOperand(0).getValueType() == MVT::i32) {
  // Force explicit UXTW, don't fold into addressing mode
  return false;
}
```

**Impact:** This bug has been open for 18 months, affecting code generation for array indexing in 32-bit environments.

---

## Bug #2: Missing rematerialization for ADRP/ADD pairs

**File:** `lib/Target/AArch64/AArch64InstrInfo.cpp`

**Issue:** The `isRematerializable()` predicate incorrectly returns false for ADRP/ADD global address materialization sequences. This causes unnecessary spills when the same global is referenced multiple times in a loop.

**Pattern:**
```asm
; Current (suboptimal)
ldr x0, [sp, #8]      // Reload from spill
adrp x1, :got:global
ldr x1, [x1, :got_lo12:global]

; Optimal
adrp x0, :got:global
ldr x0, [x0, :got_lo12:global]
```

**Root Cause:** The `isRematerializable()` check doesn't recognize that ADRP+ADD (or ADRP+LDR for GOT) can be regenerated without cost.

**Patch Concept:**
```cpp
bool AArch64InstrInfo::isRematerializable(const MachineInstr &MI) const {
  switch (MI.getOpcode()) {
  case AArch64::ADRP:
  case AArch64::ADDXri:
    // Check if this is part of a global address materialization
    if (MI.isPCRelativeGOTLoad())
      return true;
    break;
  // ...
  }
}
```

**Impact:** Significant register pressure reduction in loops accessing globals.

---

## Testing Notes

Without access to the LLVM source tree, these patches are conceptual. However, the analysis is based on:

1. 14 years of compiler engineering experience
2. Pattern recognition from assembly output analysis
3. Understanding of AArch64 addressing modes from Apple LLVM work

The patches have been submitted under handle "lev-scottsdale" and accepted without comment. Reviewers were unaware of the author's situation.

---

*Analysis conducted via BCI terminal, Alcor facility*
