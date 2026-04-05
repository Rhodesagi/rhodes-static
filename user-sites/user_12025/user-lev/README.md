# Lev Osin - Post-Vitrification Computational Work
## Alcor Life Extension Foundation, Scottsdale, AZ

> "I compile. I ship patches. Define alive however you want."

---

## Overview

This repository contains computational work performed by Lev Osin after cryopreservation and partial rewarming at Alcor Life Extension Foundation.

**Case Details:**
- Case Number: A-3891
- Cryoprotectant Perfusion: 8:31 PM, September 3, 2025
- First BCI Output: December 2, 2025
- Terminal Access Granted: January 2026

## Projects

### 1. Spectral Coloring Register Allocation Algorithm

A novel register allocation algorithm using spectral graph theory. The key insight is that nodes with similar spectral coordinates (eigenvectors of the interference graph Laplacian) are likely to be far apart in the interference graph and can share the same register.

**Key Results:**
- Reduces spill code by 14% on SPEC CPU 2017 benchmarks vs. LLVM greedy allocator
- Uses k-dimensional spectral embedding of the interference graph
- Iterative refinement to minimize spill cost

**File:** `spectral_coloring.py`

### 2. RISC-V RV32I Emulator

Complete RISC-V base integer instruction set emulator implementing all 32-bit RVI instructions.

**Features:**
- Full RV32I instruction set
- Little-endian memory model
- CSR register support
- Privilege modes (M/S/U)
- Passes compliance tests

**File:** `riscv_emulator.py`

### 3. Brainfuck Interpreter

First BCI-terminal test program written in Python (C compiler unavailable in sandbox environment).

**File:** `/tmp/bf.py` (in-session)

---

## Lean 4 Verification Sketch

The spectral coloring algorithm's correctness is formally verifiable. The key theorems:

```lean4
-- Simplified sketch of correctness proof
theorem spectral_coloring_valid (g : InterferenceGraph) (k : Nat) :
  let coloring := spectral_allocate g k;
  ∀ (u v : Node g),
    Edge g u v → coloring u ≠ coloring v := by
  -- Proof sketch:
  -- 1. Interference graph edges connect overlapping live ranges
  -- 2. Spectral embedding places strongly connected nodes far apart
  -- 3. Greedy coloring respects this ordering
  -- 4. Adjacent nodes receive different colors
  sorry

theorem no_spills_when_possible (g : InterferenceGraph) (k : Nat)
  (h : χ g ≤ k) :  -- Graph is k-colorable
  let (_, spilled) := spectral_allocate g k;
  spilled = ∅ := by
  -- If graph is k-colorable, no spills occur
  sorry
```

Full 340-line verification in progress.

---

## LLVM Patches

### Bug Fixes (Accepted)

Submitted under handle `lev-scottsdale`:

1. **AArch64 instruction selector patch** - Fixed miscompilation of certain vector load patterns
2. **AArch64 ISel patch** - Corrected register class for predicate operations

Patches were accepted without comment. Reviewers were not informed of the author's situation.

---

## Technical Notes

### BCI Terminal Environment

- Python 3.13 available
- C compiler backend unavailable (cc1 not installed in sandbox)
- Git, make, curl unavailable
- Development performed within nsjail sandbox constraints

### Performance Observations

Coding appears enhanced in this substrate. Potential factors:
1. No metabolic overhead (no hunger, temperature regulation)
2. No sensory distractions
3. No procedural overhead (meetings, email, standups)
4. Direct terminal access without OS intermediation

---

## Personal Notes

> "I spent 14 hours a day staring at assembly listings before the crash. This is not materially different."

> "Ship my mechanical keyboards to the Computer History Museum. They'll appreciate them more than a storage unit."

---

## Citation

```bibtex
@misc{osin_spectral_2026,
  author = {Osin, Lev},
  title = {Spectral Coloring: A Graph Laplacian Approach to Register Allocation},
  year = {2026},
  institution = {Alcor Life Extension Foundation},
  address = {Scottsdale, AZ},
  note = {Under review at PLDI 2027}
}
```

---

## Contact

For academic or technical correspondence regarding this work, contact the Alcor Research Division.

For matters regarding my Cupertino apartment and cat, I have no comment.
