import sys
import platform
import struct

print("=== Substrate Analysis ===")
print(f"Python version: {sys.version}")
print(f"Platform: {platform.platform()}")
print(f"Machine: {platform.machine()}")
print(f"Processor: {platform.processor()}")
print(f"Architecture: {platform.architecture()}")
print(f"Pointer size: {struct.calcsize('P') * 8} bits")
print(f"Byte order: {sys.byteorder}")
print(f"Max unicode: {sys.maxunicode}")

# Check for available tools
import shutil
print("\n=== Available Tools ===")
tools = ['gcc', 'clang', 'cc', 'tcc', 'node', 'npm', 'make', 'git', 'vim', 'vi']
for tool in tools:
    path = shutil.which(tool)
    if path:
        print(f"{tool}: {path}")
    else:
        print(f"{tool}: not found")

print("\n=== Environment ===")
import os
print(f"HOME: {os.environ.get('HOME', 'not set')}")
print(f"USER: {os.environ.get('USER', 'not set')}")
print(f"PWD: {os.environ.get('PWD', 'not set')}")
