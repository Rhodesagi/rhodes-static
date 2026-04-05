import sys
import platform
import time

print("BCI channel active", file=sys.stderr)
print(f"Platform: {platform.machine()}", file=sys.stderr)
print(f"Python: {platform.python_implementation()} {platform.python_version()}", file=sys.stderr)
print(f"Time: {time.monotonic_ns()} ns", file=sys.stderr)

# Signal ready
print("ACK", flush=True)
