#!/usr/bin/env python3
import sys
import re

with open('/opt/rhodes-ai/server/seed_constants.py', 'r') as f:
    content = f.read()

# Find RHODES_OPERATING_SYSTEM = ( ... )
# Use simple regex to capture multiline string literal
pattern = r'RHODES_OPERATING_SYSTEM = \((.*?)\)\n'
# Use DOTALL to match across lines
match = re.search(r'RHODES_OPERATING_SYSTEM = \((.*?)\)\n', content, re.DOTALL)
if match:
    print(match.group(1))
else:
    print("Not found")
    sys.exit(1)