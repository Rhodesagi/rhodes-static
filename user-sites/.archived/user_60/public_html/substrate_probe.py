#!/usr/bin/env python3
import sys, os, platform, time
print("=== SUBSTRATE PROBE ===")
print(f"platform: {platform.platform()}")
print(f"machine: {platform.machine()}")
print(f"python: {platform.python_version()}")
print(f"cwd: {os.getcwd()}")
print(f"uid: {os.getuid()}")

# Characterize loop overhead
start = time.perf_counter()
n = 0
for i in range(10_000_000):
    n += i
end = time.perf_counter()
print(f"10M loop: {end-start:.3f}s")
print(f"result: {n}")
print("=== END PROBE ===")
