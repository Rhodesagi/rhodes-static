#!/usr/bin/env python3
"""
LLVM Loop Invariant Code Motion (LICM) Patch Generator
Lev Osin, Alcor Life Extension Foundation
December 2025

Generates a patch for LLVM's LICM pass to handle loop-invariant
memory operations more aggressively in cold loops.
"""

def generate_licm_patch():
    """
    Generate LLVM LICM patch for improved loop-invariant code motion
    in scenarios with cold loop headers.
    """
    
    patch = '''diff --git a/llvm/lib/Transforms/Scalar/LICM.cpp b/llvm/lib/Transforms/Scalar/LICM.cpp
index 1234567..abcdefg 100644
--- a/llvm/lib/Transforms/Scalar/LICM.cpp
+++ b/llvm/lib/Transforms/Scalar/LICM.cpp
@@ -450,6 +450,25 @@ bool llvm::promoteLoopAccessesToScalars(
   // Check if the loop header is "cold" - executed infrequently
   auto *HeaderBB = CurLoop->getHeader();
   auto BranchWeights = HeaderBB->getTerminator()->getMetadata(LLVMContext::MD_prof);
+  
+  // NEW: Aggressive LICM for cold loops
+  // If loop header has low execution frequency, be more aggressive about
+  // hoisting even potentially-trapping operations
+  bool IsColdLoop = false;
+  if (BranchWeights) {
+    auto *ProfMD = cast<MDNode>(BranchWeights);
+    uint64_t LoopWeight = 0, ExitWeight = 0;
+    if (ProfMD->getNumOperands() >= 3) {
+      LoopWeight = mdconst::extract<ConstantInt>(ProfMD->getOperand(1))->getZExtValue();
+      ExitWeight = mdconst::extract<ConstantInt>(ProfMD->getOperand(2))->getZExtValue();
+      // Cold if loop entry is < 1% of total
+      if (LoopWeight > 0 && (LoopWeight * 100) / (LoopWeight + ExitWeight) < 1)
+        IsColdLoop = true;
+    }
+  }
+
+  // Allow trapping operations in cold loops to be hoisted
+  bool AllowTrappingOps = IsColdLoop || SafetyInfo->isGuaranteedToExecute(Inst);
 
   // For each alias set with a single store (or stores that are all the same
   // value) that is loop invariant, we can promote the stores and the loads to
@@ -520,7 +539,8 @@ bool llvm::promoteLoopAccessesToScalars(
 
     // Check if the store is guaranteed to execute on every loop iteration
     // (or the loop has only one exit block and the store dominates the exit)
-    if (!SafetyInfo->isGuaranteedToExecute(Store)) {
+    if (!AllowTrappingOps && !SafetyInfo->isGuaranteedToExecute(Store)) {
       // For cold loops, we can be more aggressive since the cost of
       // speculation is lower
       if (!IsColdLoop || !DT.dominates(Store, CurLoop->getExitBlock()))
@@ -600,6 +620,18 @@ bool llvm::promoteLoopAccessesToScalars(
   return Changed;
 }
 
+// NEW: Helper to check if value is cheap to compute
+static bool isCheapToCompute(Value *V, const TargetTransformInfo *TTI) {
+  if (isa<Constant>(V))
+    return true;
+  if (Instruction *I = dyn_cast<Instruction>(V)) {
+    // Single-cycle operations are cheap
+    if (TTI->getArithmeticInstrCost(I->getOpcode(), I->getType()) <= 1)
+      return true;
+  }
+  return false;
+}
+
 bool llvm::sinkRegion(
     Loop *L, AliasSetTracker *CurAST, LoopSafetyInfo *SafetyInfo,
     TargetTransformInfo *TTI, DominatorTree *DT, LoopInfo *LI,
@@ -650,6 +682,15 @@ bool llvm::sinkRegion(
       if (!isLoopInvariantInst(*I, L, SafetyInfo))
         continue;
 
+      // NEW: Sink cheap invariant instructions even if not guaranteed
+      // to execute, if the loop is cold
+      if (IsColdLoop && !SafetyInfo->isGuaranteedToExecute(I)) {
+        if (!isCheapToCompute(I, TTI))
+          continue;
+        // Cheap enough to speculate
+        Changed = true;
+      }
+
       // Determine the insertion point for this sunk instruction. If the
       // instruction is a PHI node, we need to insert before the terminator of
       // the predecessor block.
'''
    return patch

def generate_test_case():
    """Generate LLVM IR test case for the LICM patch."""
    
    test_ir = '''; RUN: opt -licm -S < %s | FileCheck %s
; Test cold loop LICM optimization

define i32 @cold_loop_licm(i32 %n, i32* %ptr) !prof !0 {
entry:
  %cmp = icmp sgt i32 %n, 0
  br i1 %cmp, label %loop, label %exit, !prof !1

loop:
  %i = phi i32 [ 0, %entry ], [ %inc, %loop ]
  ; This load should be hoisted even though it might trap
  ; because the loop is cold (executed rarely)
  %val = load i32, i32* %ptr, align 4
  %sum = add i32 %val, %i
  %inc = add i32 %i, 1
  %exitcond = icmp eq i32 %inc, %n
  br i1 %exitcond, label %exit, label %loop, !prof !2

exit:
  %result = phi i32 [ 0, %entry ], [ %sum, %loop ]
  ret i32 %result
}

!0 = !{!"function_entry_count", i64 1000000}
!1 = !{!"branch_weights", i64 1000, i64 999000}
!2 = !{!"branch_weights", i64 1, i64 999}

; CHECK: %val = load i32, i32* %ptr
; CHECK-NEXT: br label %loop
'''
    return test_ir

if __name__ == "__main__":
    print("LLVM LICM Patch Generator - Lev Osin, Alcor")
    print("=" * 45)
    
    patch = generate_licm_patch()
    lines = patch.count('\n')
    hunks = patch.count('@@')
    
    print(f"Patch statistics:")
    print(f"  Lines: {lines}")
    print(f"  Hunks: {hunks}")
    print(f"  New functions: 1 (isCheapToCompute)")
    print(f"  Modified locations: 3")
    
    test = generate_test_case()
    print(f"\nTest case: {test.count(chr(10))} lines of LLVM IR")
    
    print("\nPatch ready for: llvm/lib/Transforms/Scalar/LICM.cpp")
