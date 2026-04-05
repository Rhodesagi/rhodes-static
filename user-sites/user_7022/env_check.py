#!/usr/bin/env python3
"""Environment characterization for BCI terminal access"""

import sys
import os
import platform
import subprocess

def main():
    print(f"=== BCI Terminal Environment ===")
    print(f"Platform: {platform.platform()}")
    print(f"Machine: {platform.machine()}")
    print(f"Processor: {platform.processor()}")
    print(f"Python: {platform.python_version()}")
    print()
    
    # Check available tools
    tools = ['gcc', 'clang', 'make', 'git', 'curl', 'wget', 'ld', 'as']
    print("=== Available Tools ===")
    for tool in tools:
        result = subprocess.run(['which', tool], capture_output=True)
        status = "YES" if result.returncode == 0 else "NO"
        print(f"  {tool}: {status}")
    
    # Check paths
    print()
    print(f"=== PATH ===")
    for p in os.environ.get('PATH', '').split(':'):
        print(f"  {p}")
    
    print()
    print(f"=== CWD ===")
    print(f"  {os.getcwd()}")
    
if __name__ == '__main__':
    main()
