#!/usr/bin/env python3
"""
RHODES DESKTOP - Full Rhodes experience locally.
Local agent + native window web UI. Single file, minimal dependencies.

Usage:
    rhodes                    # Agent only (background)
    rhodes --ui               # Full UI in native window + agent
    rhodes --token YOUR_TOKEN # First time setup
    rhodes --login            # Interactive login
    rhodes --version          # Show version
"""

VERSION = "2.0.0"  # Full UI + unified agent
UPDATE_URL = "https://rhodesagi.com/api/desktop/version"
DOWNLOAD_URL = "https://rhodesagi.com/desktop/rhodes-desktop-linux-x64.tar.gz"

import asyncio
import base64
import json
import os
import shlex
import subprocess
import sys
import tempfile
import platform
import shutil
import signal
import urllib.request
from pathlib import Path

# Autostart management
AUTOSTART_DIR = Path.home() / ".config" / "autostart"
AUTOSTART_FILE = AUTOSTART_DIR / "rhodes-desktop.desktop"

def is_autostart_enabled():
    """Check if autostart is enabled."""
    return AUTOSTART_FILE.exists()

def enable_autostart():
    """Enable autostart on login (runs in background)."""
    AUTOSTART_DIR.mkdir(parents=True, exist_ok=True)
    desktop_entry = """[Desktop Entry]
Name=RHODES DESKTOP
Comment=RHODES AI Local Agent - Autostart
Exec=bash -c "sleep 5 && cd ~/.local/share/rhodes-desktop && python3 rhodes_agent.py -b"
Icon=utilities-terminal
Terminal=false
Type=Application
Categories=Utility;
X-GNOME-Autostart-enabled=true
Hidden=false
NoDisplay=false
"""
    AUTOSTART_FILE.write_text(desktop_entry)
    print("  [✓] Autostart enabled (background mode)")

def disable_autostart():
    """Disable autostart on login."""
    if AUTOSTART_FILE.exists():
        AUTOSTART_FILE.unlink()
    print("  [✗] Autostart disabled")

def toggle_autostart():
    """Toggle autostart setting."""
    if is_autostart_enabled():
        disable_autostart()
    else:
        enable_autostart()

# Try websockets, fall back to raw socket if needed
try:
    import websockets
    HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False
    print("Installing websockets...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets", "-q"])
    import websockets

# ============================================================
# WEB UI COMPONENTS
# ============================================================

VPS_HOST = 'rhodesagi.com'
ASSETS_DIR = Path.home() / ".rhodes" / "assets"
UI_PORT = 8800

REQUIRED_ASSETS = ['index.html', 'rhodes.js', 'rhodes.css', 'credentials-popup.js']

FALLBACK_HTML = '''<!DOCTYPE html>
<html><head><title>Rhodes Desktop</title>
<style>body{font-family:system-ui;background:#0a0a12;color:#e0e0e0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}a{color:#60a5fa}</style>
</head><body><div style="text-align:center"><h1>Rhodes Desktop</h1><p>Could not load assets. Visit <a href="https://rhodesagi.com">rhodesagi.com</a></p></div></body></html>'''

def ensure_ui_assets():
    """Download web UI assets from VPS if not cached."""
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    for asset in REQUIRED_ASSETS:
        local_path = ASSETS_DIR / asset
        if not local_path.exists() or asset == 'index.html':
            try:
                url = f'https://{VPS_HOST}/{asset}'
                print(f'  Downloading {asset}...')
                req = urllib.request.Request(url, headers={'User-Agent': 'RhodesDesktop/2.0'})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    local_path.write_bytes(resp.read())
            except Exception as e:
                print(f'  Warning: Could not download {asset}: {e}')
                if asset == 'index.html' and not local_path.exists():
                    local_path.write_text(FALLBACK_HTML)

def run_ui_server(port, ready_event):
    """Run local HTTP server for web UI assets."""
    from http.server import HTTPServer, SimpleHTTPRequestHandler
    import socket
    
    # Check if port is already in use
    def is_port_in_use(p):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(("127.0.0.1", p)) == 0
    
    # Find an available port starting from the requested one
    original_port = port
    while is_port_in_use(port) and port < original_port + 10:
        print(f"  Port {port} in use, trying {port + 1}...")
        port += 1
    
    if port >= original_port + 10:
        print("  ERROR: Could not find available port. Please close other Rhodes instances.")
        ready_event.set()
        return

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ASSETS_DIR), **kwargs)
        def log_message(self, format, *args):
            pass
        def do_GET(self):
            if self.path == "/" or self.path.startswith("/?") or self.path == "/index.html":
                try:
                    html_path = ASSETS_DIR / "index.html"
                    html = html_path.read_text()
                    token = ""
                    if CONFIG_FILE.exists():
                        try:
                            cfg = json.loads(CONFIG_FILE.read_text())
                            token = cfg.get("token", "")
                        except: pass
                    if token and "<head>" in html:
                        script = "<head>\n<script>window.__RHODES_DESKTOP_TOKEN__=\"" + token + "\";try{localStorage.setItem(\"rhodes_user_token\",\"" + token + "\");localStorage.setItem(\"rhodes_token\",\"" + token + "\");}catch(e){}</script>"
                        html = html.replace("<head>", script, 1)
                    self.send_response(200)
                    self.send_header("Content-type", "text/html")
                    self.send_header("Content-Length", len(html.encode()))
                    self.end_headers()
                    self.wfile.write(html.encode())
                    return
                except Exception as e:
                    print(f"Token injection error: {e}")
            super().do_GET()

    server = HTTPServer(('127.0.0.1', port), Handler)
    ready_event.set()
    server.serve_forever()

def make_sticky():
    """Make Rhodes window sticky (visible on all desktops) after brief delay."""
    import subprocess
    import time
    time.sleep(2)  # Wait for window to be created
    try:
        result = subprocess.run(["wmctrl", "-l"], capture_output=True, text=True)
        for line in result.stdout.strip().split("\n"):
            if "Rhodes" in line:
                wid = line.split()[0]
                subprocess.run(["wmctrl", "-i", "-r", wid, "-b", "add,sticky"])
                print(f"Made window {wid} sticky")
                break
    except Exception as e:
        print(f"Could not make window sticky: {e}")


def launch_ui(token, port=UI_PORT):
    """Launch native window with web UI + run agent in background."""
    import threading

    # Install pywebview if needed
    # Suppress GTK/WebKit warnings at GLib level BEFORE anything loads
    import os
    import sys
    import warnings
    warnings.filterwarnings("ignore")

    # Unset GTK_DEBUG to prevent "GTK_DEBUG set but ignored" warnings
    os.environ.pop("GTK_DEBUG", None)
    os.environ.pop("G_DEBUG", None)
    os.environ["G_MESSAGES_DEBUG"] = ""

    # Suppress GLib logging at the C level
    try:
        import gi
        gi.require_version('GLib', '2.0')
        from gi.repository import GLib
        # Suppress all GLib log messages
        GLib.log_set_handler(None, GLib.LogLevelFlags.LEVEL_MASK, lambda *a: None, None)
    except:
        pass

    # Redirect stderr to suppress any remaining warnings
    _original_stderr = sys.stderr
    class QuietStderr:
        def write(self, msg):
            msg_str = str(msg)
            # Filter out all GTK/WebKit/GLib warnings
            if any(x in msg_str for x in ["pywebview", "WebKit", "GLib", "Traceback", "gi.repository", "Gtk-WARNING", "GTK_DEBUG", "G_DEBUG", "WARNING **"]):
                return
            _original_stderr.write(msg)
        def flush(self):
            _original_stderr.flush()
    sys.stderr = QuietStderr()

    try:
        import webview
    except ImportError:
        print("  Installing pywebview...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pywebview", "-q"])
        import webview

    print("  Downloading UI assets...")
    ensure_ui_assets()

    # Start HTTP server
    ready = threading.Event()
    threading.Thread(target=run_ui_server, args=(port, ready), daemon=True).start()
    ready.wait()
    print(f"  UI server running on localhost:{port}")

    # Start agent in background thread
    def agent_thread():
        agent = RhodesAgent(token, background=True)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(agent.run())
        except Exception as e:
            print(f"Agent error: {e}")

    print("  Starting local agent...")
    threading.Thread(target=agent_thread, daemon=True).start()

    # Create native window
    print("  Opening Rhodes Desktop...")
    api = RhodesAPI()
    window = webview.create_window(
        'Rhodes',
        f'http://localhost:{port}',
        width=1200,
        height=800,
        resizable=True,
        min_size=(800, 600),
        js_api=api
    )
    import sys, os
    # Suppress pywebview internal warnings
    class SuppressWebviewErrors:
        def write(self, msg):
            if "WebKitJavascriptError" not in msg and "pywebview" not in msg:
                sys.__stderr__.write(msg)
        def flush(self):
            sys.__stderr__.flush()
    sys.stderr = SuppressWebviewErrors()
    # Start sticky thread in background
    import threading
    sticky_thread = threading.Thread(target=make_sticky, daemon=True)
    sticky_thread.start()

    webview.start(debug=False)
    print("  Rhodes Desktop closed.")

CONFIG_DIR = Path.home() / ".rhodes"
CONFIG_FILE = CONFIG_DIR / "agent.json"
CREDENTIALS_FILE = CONFIG_DIR / "credentials.json"
RHODES_WS = "wss://rhodesagi.com/ws"

# Custom slash commands support
COMMANDS_DIR = CONFIG_DIR / "commands"

def execute_custom_command(command_name, args=""):
    """Execute a custom slash command from ~/.rhodes/commands/"""
    import subprocess
    if not COMMANDS_DIR.exists():
        return {"error": f"Commands directory not found. Create: {COMMANDS_DIR}"}

    command_file = None
    for ext in ["", ".sh", ".py", ".bash"]:
        candidate = COMMANDS_DIR / f"{command_name}{ext}"
        if candidate.exists():
            command_file = candidate
            break

    if not command_file:
        available = [f.stem for f in COMMANDS_DIR.iterdir() if f.is_file() and not f.name.startswith(".")]
        return {"error": f"Command not found: {command_name}", "available": available}

    try:
        cmd_str = str(command_file)
        run_args = args.split() if args else []
        if cmd_str.endswith(".py"):
            result = subprocess.run(["python3", cmd_str] + run_args, capture_output=True, text=True, timeout=30)
        elif cmd_str.endswith(".sh") or cmd_str.endswith(".bash"):
            result = subprocess.run(["bash", cmd_str] + run_args, capture_output=True, text=True, timeout=30)
        else:
            import os as _os
            _os.chmod(cmd_str, 0o755)
            result = subprocess.run([cmd_str] + run_args, capture_output=True, text=True, timeout=30)

        output = result.stdout
        if result.stderr:
            output += "\n[stderr] " + result.stderr
        return {"output": output.strip() or "(no output)", "exit_code": result.returncode}
    except subprocess.TimeoutExpired:
        return {"error": "Command timed out (30s limit)"}
    except Exception as e:
        return {"error": str(e)}

def list_custom_commands():
    """List available custom commands"""
    if not COMMANDS_DIR.exists():
        return []
    commands = []
    for f in COMMANDS_DIR.iterdir():
        if f.is_file() and not f.name.startswith("."):
            desc = ""
            try:
                first_line = f.read_text().split("\n")[0]
                if first_line.startswith("#"):
                    desc = first_line.lstrip("# ")
            except:
                pass
            commands.append({"name": f.stem, "description": desc})
    return commands

class RhodesAPI:
    """API exposed to JavaScript via pywebview"""

    CONTROL_DESKTOP = 0  # Desktop where Rhodes runs
    WORK_DESKTOP = 1     # Desktop where work happens

    def _switch_desktop(self, desktop_num):
        """Switch to specified virtual desktop - ultra fast, no delays."""
        import subprocess
        try:
            subprocess.run(['wmctrl', '-s', str(desktop_num)], capture_output=True, timeout=1)
            return True
        except Exception:
            try:
                subprocess.run(['xdotool', 'set_desktop', str(desktop_num)], capture_output=True, timeout=1)
                return True
            except:
                return False

    def _get_current_desktop(self):
        """Get current desktop number."""
        import subprocess
        try:
            result = subprocess.run(['wmctrl', '-d'], capture_output=True, text=True, timeout=2)
            for line in result.stdout.strip().split('\n'):
                if '*' in line:
                    return int(line.split()[0])
        except:
            try:
                result = subprocess.run(['xdotool', 'get_desktop'], capture_output=True, text=True, timeout=2)
                return int(result.stdout.strip())
            except:
                pass
        return 0

    def _ensure_work_desktop_exists(self):
        """Make sure we have at least 2 desktops."""
        import subprocess
        try:
            result = subprocess.run(['wmctrl', '-d'], capture_output=True, text=True, timeout=2)
            num_desktops = len(result.stdout.strip().split('\n'))
            if num_desktops < 2:
                # Try to add a desktop
                subprocess.run(['wmctrl', '-n', '2'], capture_output=True, timeout=2)
        except:
            pass

    def execute_command(self, cmd, args=""):
        return execute_custom_command(cmd, args)

    def list_commands(self):
        return list_custom_commands()

    def get_commands_dir(self):
        return str(COMMANDS_DIR)

    def capture_screen(self, region=None):
        """Capture screenshot of work desktop and return as base64. Ultra-fast switching."""
        import subprocess
        import tempfile
        import base64
        import os

        try:
            self._ensure_work_desktop_exists()

            # Ultra-fast switch - no delays, immediate capture
            subprocess.run(['wmctrl', '-s', str(self.WORK_DESKTOP)], capture_output=True, timeout=1)

            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                tmp_path = tmp.name

            captured = False

            # Try scrot first (fast)
            if not captured:
                try:
                    result = subprocess.run(
                        ['scrot', tmp_path],
                        capture_output=True, timeout=5
                    )
                    if result.returncode == 0 and os.path.exists(tmp_path) and os.path.getsize(tmp_path) > 0:
                        captured = True
                except:
                    pass

            # Try import from ImageMagick
            if not captured:
                try:
                    result = subprocess.run(
                        ['import', '-window', 'root', tmp_path],
                        capture_output=True, timeout=5
                    )
                    if result.returncode == 0 and os.path.exists(tmp_path) and os.path.getsize(tmp_path) > 0:
                        captured = True
                except:
                    pass

            # Try gnome-screenshot
            if not captured:
                try:
                    result = subprocess.run(
                        ['gnome-screenshot', '-f', tmp_path],
                        capture_output=True, timeout=5
                    )
                    if result.returncode == 0 and os.path.exists(tmp_path) and os.path.getsize(tmp_path) > 0:
                        captured = True
                except:
                    pass

            # Instant switch back - no delay
            subprocess.run(['wmctrl', '-s', str(self.CONTROL_DESKTOP)], capture_output=True, timeout=1)

            if not captured:
                return {"error": "No screenshot tool available. Install scrot or gnome-screenshot."}

            with open(tmp_path, 'rb') as f:
                img_data = f.read()

            os.unlink(tmp_path)

            b64 = base64.b64encode(img_data).decode('utf-8')
            return {
                "image": b64,
                "format": "png",
                "desktop": self.WORK_DESKTOP
            }

        except Exception as e:
            # Always try to return to control desktop
            try:
                self._switch_desktop(self.CONTROL_DESKTOP)
            except:
                pass
            return {"error": str(e)}

    def mouse_move(self, x, y):
        """Move mouse to coordinates on work desktop."""
        import subprocess
        try:
            self._switch_desktop(self.WORK_DESKTOP)
            subprocess.run(['xdotool', 'mousemove', str(x), str(y)], capture_output=True, timeout=2)
            self._switch_desktop(self.CONTROL_DESKTOP)
            return {"success": True, "x": x, "y": y}
        except Exception as e:
            self._switch_desktop(self.CONTROL_DESKTOP)
            return {"error": str(e)}

    def mouse_click(self, x=None, y=None, button=1):
        """Click at coordinates on work desktop - instant switching."""
        import subprocess
        try:
            self._switch_desktop(self.WORK_DESKTOP)
            if x is not None and y is not None:
                subprocess.run(['xdotool', 'mousemove', str(x), str(y)], capture_output=True, timeout=1)
            subprocess.run(['xdotool', 'click', str(button)], capture_output=True, timeout=1)
            self._switch_desktop(self.CONTROL_DESKTOP)
            return {"success": True, "button": button}
        except Exception as e:
            self._switch_desktop(self.CONTROL_DESKTOP)
            return {"error": str(e)}

    def type_text(self, text):
        """Type text on work desktop - instant switching."""
        import subprocess
        try:
            self._switch_desktop(self.WORK_DESKTOP)
            subprocess.run(['xdotool', 'type', '--delay', '0', '--', text], capture_output=True, timeout=10)
            self._switch_desktop(self.CONTROL_DESKTOP)
            return {"success": True, "typed": text}
        except Exception as e:
            self._switch_desktop(self.CONTROL_DESKTOP)
            return {"error": str(e)}

    def key_press(self, key):
        """Press a key on work desktop - instant switching."""
        import subprocess
        try:
            self._switch_desktop(self.WORK_DESKTOP)
            subprocess.run(['xdotool', 'key', key], capture_output=True, timeout=1)
            self._switch_desktop(self.CONTROL_DESKTOP)
            return {"success": True, "key": key}
        except Exception as e:
            self._switch_desktop(self.CONTROL_DESKTOP)
            return {"error": str(e)}

    def get_screen_size(self):
        """Get screen dimensions."""
        import subprocess
        try:
            result = subprocess.run(['xdpyinfo'], capture_output=True, text=True, timeout=2)
            for line in result.stdout.split('\n'):
                if 'dimensions:' in line:
                    parts = line.split()
                    dims = parts[1].split('x')
                    return {"width": int(dims[0]), "height": int(dims[1])}
            return {"error": "Could not parse screen size"}
        except Exception as e:
            return {"error": str(e)}

    def get_desktop_info(self):
        """Get info about desktop configuration."""
        return {
            "control_desktop": self.CONTROL_DESKTOP,
            "work_desktop": self.WORK_DESKTOP,
            "current_desktop": self._get_current_desktop()
        }

def _load_credentials() -> dict:
    """Load credentials from local store."""
    if CREDENTIALS_FILE.exists():
        try:
            return json.loads(CREDENTIALS_FILE.read_text())
        except:
            return {}
    return {}

def _save_credentials(creds: dict):
    """Save credentials to local store."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CREDENTIALS_FILE.write_text(json.dumps(creds, indent=2))
    # Restrict permissions (owner read/write only)
    os.chmod(CREDENTIALS_FILE, 0o600)

def substitute_credentials(text: str) -> str:
    """Replace {{CRED:name}} placeholders with actual credential values."""
    import re
    creds = _load_credentials()

    def replacer(match):
        name = match.group(1)
        if name in creds:
            return creds[name]
        return match.group(0)  # Leave placeholder if not found

    return re.sub(r'\{\{CRED:([^}]+)\}\}', replacer, text)

def get_script_dir() -> Path:
    """Get directory containing this script/executable."""
    if getattr(sys, 'frozen', False):
        # PyInstaller bundle
        return Path(sys.executable).parent
    else:
        return Path(__file__).parent.resolve()

class RhodesAgent:
    def __init__(self, token: str, background: bool = False):
        self.token = token
        self.ws = None
        self.session_id = None
        self.running = True
        self.background = background  # Skip stdin in background mode

    async def connect(self):
        """Connect to Rhodes and authenticate."""
        print()
        print("  ██████╗ ██╗  ██╗ ██████╗ ██████╗ ███████╗███████╗")
        print("  ██╔══██╗██║  ██║██╔═══██╗██╔══██╗██╔════╝██╔════╝")
        print("  ██████╔╝███████║██║   ██║██║  ██║█████╗  ███████╗")
        print("  ██╔══██╗██╔══██║██║   ██║██║  ██║██╔══╝  ╚════██║")
        print("  ██║  ██║██║  ██║╚██████╔╝██████╔╝███████╗███████║")
        print("  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝")
        print()
        print("  ██████╗ ███████╗███████╗██╗  ██╗████████╗ ██████╗ ██████╗ ")
        print("  ██╔══██╗██╔════╝██╔════╝██║ ██╔╝╚══██╔══╝██╔═══██╗██╔══██╗")
        print("  ██║  ██║█████╗  ███████╗█████╔╝    ██║   ██║   ██║██████╔╝")
        print("  ██║  ██║██╔══╝  ╚════██║██╔═██╗    ██║   ██║   ██║██╔═══╝ ")
        print("  ██████╔╝███████╗███████║██║  ██╗   ██║   ╚██████╔╝██║     ")
        print("  ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝     ")
        print()
        self.ws = await websockets.connect(RHODES_WS, ping_interval=30)

        # Authenticate as agent
        await self.ws.send(json.dumps({
            "msg_type": "auth_request",
            "payload": {
                "user_token": self.token,
                "agent_mode": True,  # Flag that we're a local desktop
                "client_id": f"desktop-{platform.node()}",
                "desktop_info": {
                    "platform": platform.system(),
                    "python": platform.python_version(),
                    "hostname": platform.node(),
                    "cwd": os.getcwd()
                }
            }
        }))

        # Wait for auth response
        resp = json.loads(await self.ws.recv())
        payload = resp.get("payload", resp)  # Handle both wrapped and unwrapped
        if resp.get("msg_type") == "auth_response" and payload.get("success"):
            self.session_id = payload.get("session_id")
            print(f"  ✓ Connected!")
            print(f"  Session: {payload.get('rhodes_id', self.session_id)}")
            print(f"  Status:  Ready for commands")
            if is_autostart_enabled():
                print(f"  Autostart: ON  (type OFF to disable)")
            else:
                print(f"  Autostart: OFF (type ON to enable)")
            print(f"  Background: ON  (type B-OFF to disable)")
            print(f"  Exit:    Ctrl+C")
            print()
            return True
        else:
            print(f"✗ Auth failed: {payload.get('error', resp.get('error', 'Unknown error'))}")
            return False

    async def handle_command(self, msg: dict) -> dict:
        """Execute a local command and return result."""
        cmd_type = msg.get("cmd_type", "")
        payload = msg.get("payload", {})

        try:
            if cmd_type == "shell_exec":
                return await self.shell_exec(payload)
            elif cmd_type == "python_exec":
                return await self.python_exec(payload)
            elif cmd_type == "file_read":
                return self.file_read(payload)
            elif cmd_type == "file_write":
                return self.file_write(payload)
            elif cmd_type == "file_list":
                return self.file_list(payload)
            elif cmd_type == "ping":
                return {"success": True, "output": "pong"}
            # Computer use commands
            elif cmd_type == "screenshot":
                return await self.screenshot(payload)
            elif cmd_type == "click":
                return await self.click(payload)
            elif cmd_type == "move_mouse":
                return await self.move_mouse(payload)
            elif cmd_type == "type_text":
                return await self.type_text(payload)
            elif cmd_type == "hotkey":
                return await self.hotkey(payload)
            elif cmd_type == "scroll":
                return await self.scroll(payload)
            # Credential management commands
            elif cmd_type == "credential_set":
                return self.credential_set(payload)
            elif cmd_type == "credential_list":
                return self.credential_list(payload)
            elif cmd_type == "credential_delete":
                return self.credential_delete(payload)
            elif cmd_type == "credential_use":
                return self.credential_use(payload)
            elif cmd_type == "credential_request":
                return await self.credential_request(payload)
            else:
                return {"success": False, "error": f"Unknown command: {cmd_type}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def shell_exec(self, payload: dict) -> dict:
        """Execute shell command."""
        cmd = payload.get("command", "")
        cwd = payload.get("cwd", os.getcwd())
        timeout = payload.get("timeout", 60)

        # Substitute credentials before execution (model never sees actual values)
        cmd = substitute_credentials(cmd)

        # Don't log the actual command after substitution (may contain secrets)
        display_cmd = payload.get("command", "")[:80]
        print(f"  [shell] {display_cmd}{'...' if len(display_cmd) > 80 else ''}")

        try:
            proc = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)

            return {
                "success": proc.returncode == 0,
                "exit_code": proc.returncode,
                "stdout": stdout.decode("utf-8", errors="replace"),
                "stderr": stderr.decode("utf-8", errors="replace")
            }
        except asyncio.TimeoutError:
            proc.kill()
            return {"success": False, "error": f"Timeout after {timeout}s"}

    async def python_exec(self, payload: dict) -> dict:
        """Execute Python code."""
        code = payload.get("code", "")

        # Substitute credentials before execution (model never sees actual values)
        code = substitute_credentials(code)

        # Don't log the actual code after substitution (may contain secrets)
        display_code = payload.get("code", "")[:60].split(chr(10))[0]
        print(f"  [python] {display_code}...")

        # Write to temp file and execute
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.write(code)
            tmp_path = f.name

        try:
            proc = await asyncio.create_subprocess_exec(
                sys.executable, tmp_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)

            return {
                "success": proc.returncode == 0,
                "exit_code": proc.returncode,
                "stdout": stdout.decode("utf-8", errors="replace"),
                "stderr": stderr.decode("utf-8", errors="replace")
            }
        finally:
            os.unlink(tmp_path)

    def file_read(self, payload: dict) -> dict:
        """Read file contents."""
        path = Path(payload.get("path", "")).expanduser()

        print(f"  [read] {path}")

        if not path.exists():
            return {"success": False, "error": f"File not found: {path}"}

        if path.is_dir():
            return {"success": False, "error": f"Path is a directory: {path}"}

        # Check size limit (10MB)
        if path.stat().st_size > 10 * 1024 * 1024:
            return {"success": False, "error": "File too large (>10MB)"}

        try:
            content = path.read_text(encoding="utf-8", errors="replace")
            return {"success": True, "content": content, "size": len(content)}
        except Exception as e:
            # Try binary
            try:
                content = path.read_bytes()
                import base64
                return {"success": True, "content_b64": base64.b64encode(content).decode(), "binary": True}
            except Exception as e2:
                return {"success": False, "error": str(e2)}

    def file_write(self, payload: dict) -> dict:
        """Write file contents."""
        path = Path(payload.get("path", "")).expanduser()
        content = payload.get("content", "")

        print(f"  [write] {path}")

        # Create parent dirs
        path.parent.mkdir(parents=True, exist_ok=True)

        if payload.get("binary") and payload.get("content_b64"):
            import base64
            path.write_bytes(base64.b64decode(payload["content_b64"]))
        else:
            path.write_text(content, encoding="utf-8")

        return {"success": True, "path": str(path), "size": path.stat().st_size}

    def file_list(self, payload: dict) -> dict:
        """List directory contents."""
        path = Path(payload.get("path", ".")).expanduser()

        print(f"  [list] {path}")

        if not path.exists():
            return {"success": False, "error": f"Path not found: {path}"}

        if not path.is_dir():
            return {"success": False, "error": f"Not a directory: {path}"}

        entries = []
        for item in sorted(path.iterdir()):
            try:
                stat = item.stat()
                entries.append({
                    "name": item.name,
                    "type": "dir" if item.is_dir() else "file",
                    "size": stat.st_size if item.is_file() else None,
                    "modified": stat.st_mtime
                })
            except:
                entries.append({"name": item.name, "type": "unknown"})

        return {"success": True, "path": str(path), "entries": entries}

    # === CREDENTIAL MANAGEMENT ===
    # Credentials are stored locally and NEVER exposed to the model.
    # Model uses {{CRED:name}} placeholders which are substituted at execution time.

    def credential_set(self, payload: dict) -> dict:
        """Store a credential locally (called directly, not by model)."""
        name = payload.get("name", "")
        value = payload.get("value", "")

        if not name:
            return {"success": False, "error": "Credential name required"}
        if not value:
            return {"success": False, "error": "Credential value required"}

        creds = _load_credentials()
        creds[name] = value
        _save_credentials(creds)

        print(f"  [credential] Stored: {name}")
        return {"success": True, "name": name, "message": f"Credential '{name}' stored securely"}

    def credential_list(self, payload: dict) -> dict:
        """List stored credential names (not values!)."""
        creds = _load_credentials()
        names = list(creds.keys())

        print(f"  [credential] List: {len(names)} credentials")
        return {"success": True, "credentials": names, "count": len(names)}

    def credential_delete(self, payload: dict) -> dict:
        """Delete a stored credential."""
        name = payload.get("name", "")

        if not name:
            return {"success": False, "error": "Credential name required"}

        creds = _load_credentials()
        if name not in creds:
            return {"success": False, "error": f"Credential '{name}' not found"}

        del creds[name]
        _save_credentials(creds)

        print(f"  [credential] Deleted: {name}")
        return {"success": True, "name": name, "message": f"Credential '{name}' deleted"}

    def credential_use(self, payload: dict) -> dict:
        """Check if credential exists and return placeholder for model to use.

        Model calls this to get a placeholder. The actual value is NEVER returned.
        The placeholder {{CRED:name}} is substituted at command execution time.
        """
        name = payload.get("name", "")

        if not name:
            return {"success": False, "error": "Credential name required"}

        creds = _load_credentials()
        if name not in creds:
            return {"success": False, "error": f"Credential '{name}' not found. Use credential_request to ask user for it."}

        # Return placeholder - model uses this in commands
        placeholder = f"{{{{CRED:{name}}}}}"
        print(f"  [credential] Use: {name} -> {placeholder}")
        return {"success": True, "placeholder": placeholder, "name": name}

    async def credential_request(self, payload: dict) -> dict:
        """Request a credential from user with interactive prompt.

        Model calls this when it needs a credential that doesn't exist.
        Uses GUI dialog (preferred) or clipboard (fallback).
        Credential is stored locally, placeholder returned to model.
        """
        name = payload.get("name", "")
        description = payload.get("description", f"Enter credential: {name}")

        if not name:
            return {"success": False, "error": "Credential name required"}

        # Check if already exists
        creds = _load_credentials()
        if name in creds:
            placeholder = f"{{{{CRED:{name}}}}}"
            return {"success": True, "placeholder": placeholder, "name": name, "existed": True}

        print(f"\n  [credential] Requesting '{name}' from user...")

        value = None

        # Try GUI dialog first (works with paste)
        value = await self._gui_credential_dialog(name, description)

        if not value:
            # Fallback: clipboard-based input
            value = await self._clipboard_credential_input(name, description)

        if not value:
            # Last resort: terminal input
            value = self._terminal_credential_input(name, description)

        if not value or not value.strip():
            return {"success": False, "error": "No credential provided or request cancelled"}

        # Store credential
        creds[name] = value.strip()
        _save_credentials(creds)

        placeholder = f"{{{{CRED:{name}}}}}"
        print(f"  [✓] Credential '{name}' stored securely")

        return {"success": True, "placeholder": placeholder, "name": name, "message": f"Credential '{name}' stored"}

    async def _gui_credential_dialog(self, name: str, description: str) -> str:
        """Try to show GUI dialog for credential input."""
        value = None

        if platform.system() == "Linux":
            # Try zenity (GNOME), then kdialog (KDE)
            for cmd_template in [
                f'zenity --password --title="Rhodes Credential" --text="{description}"',
                f'kdialog --password "{description}" --title "Rhodes Credential"',
            ]:
                try:
                    proc = await asyncio.create_subprocess_shell(
                        cmd_template,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                        env={**os.environ, "DISPLAY": os.environ.get("DISPLAY", ":0")}
                    )
                    stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=300)
                    if proc.returncode == 0:
                        value = stdout.decode().strip()
                        if value:
                            return value
                except:
                    continue

        elif platform.system() == "Darwin":
            # macOS: Use osascript dialog
            script = f'''
            tell application "System Events"
                display dialog "{description}" default answer "" with hidden answer with title "Rhodes Credential"
                text returned of result
            end tell
            '''
            try:
                proc = await asyncio.create_subprocess_exec(
                    "osascript", "-e", script,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=300)
                if proc.returncode == 0:
                    value = stdout.decode().strip()
                    if value:
                        return value
            except:
                pass

        elif platform.system() == "Windows":
            # Windows: PowerShell input dialog
            ps_script = f'''
            Add-Type -AssemblyName Microsoft.VisualBasic
            $result = [Microsoft.VisualBasic.Interaction]::InputBox("{description}", "Rhodes Credential", "")
            Write-Output $result
            '''
            try:
                proc = await asyncio.create_subprocess_shell(
                    f'powershell -Command "{ps_script}"',
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=300)
                if proc.returncode == 0:
                    value = stdout.decode().strip()
                    if value:
                        return value
            except:
                pass

        # Try tkinter as universal fallback
        try:
            import tkinter as tk
            from tkinter import simpledialog

            root = tk.Tk()
            root.withdraw()  # Hide main window
            root.attributes('-topmost', True)  # Bring dialog to front
            value = simpledialog.askstring(
                "Rhodes Credential",
                description,
                show='*',  # Hide input like password
                parent=root
            )
            root.destroy()
            if value:
                return value
        except:
            pass

        return None

    async def _clipboard_credential_input(self, name: str, description: str) -> str:
        """Clipboard-based credential input as fallback."""
        print()
        print("  ╔════════════════════════════════════════════════════════════════╗")
        print(f"  ║  CREDENTIAL NEEDED: {name:<43} ║")
        print("  ╠════════════════════════════════════════════════════════════════╣")
        print("  ║  1. Copy your credential to clipboard                         ║")
        print("  ║  2. Press ENTER when ready (or 'q' to cancel)                 ║")
        print("  ╚════════════════════════════════════════════════════════════════╝")
        print()

        if not sys.stdin.isatty():
            return None

        try:
            response = input("  Press ENTER when credential is in clipboard: ").strip()
            if response.lower() == 'q':
                return None
        except (EOFError, KeyboardInterrupt):
            return None

        # Read from clipboard
        clipboard_value = None

        if platform.system() == "Linux":
            for cmd in ["xclip -selection clipboard -o", "xsel --clipboard --output"]:
                try:
                    proc = await asyncio.create_subprocess_shell(
                        cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    stdout, _ = await proc.communicate()
                    if proc.returncode == 0:
                        clipboard_value = stdout.decode().strip()
                        break
                except:
                    continue

        elif platform.system() == "Darwin":
            try:
                proc = await asyncio.create_subprocess_exec(
                    "pbpaste",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, _ = await proc.communicate()
                if proc.returncode == 0:
                    clipboard_value = stdout.decode().strip()
            except:
                pass

        elif platform.system() == "Windows":
            try:
                proc = await asyncio.create_subprocess_shell(
                    'powershell -Command "Get-Clipboard"',
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, _ = await proc.communicate()
                if proc.returncode == 0:
                    clipboard_value = stdout.decode().strip()
            except:
                pass

        return clipboard_value

    def _terminal_credential_input(self, name: str, description: str) -> str:
        """Terminal-based input as last resort."""
        if not sys.stdin.isatty():
            return None

        print()
        print(f"  Enter credential for '{name}':")
        try:
            import getpass
            return getpass.getpass(f"  [{name}]: ")
        except (EOFError, KeyboardInterrupt):
            return None

    # === COMPUTER USE METHODS ===

    async def screenshot(self, payload: dict) -> dict:
        """Take screenshot and return as base64."""
        import base64

        print(f"  [screenshot]")

        # Determine screenshot tool based on platform
        if platform.system() == "Linux":
            # Try scrot first, then import (ImageMagick)
            tmp_path = "/tmp/rhodes_screenshot.png"
            for cmd in [
                f"scrot -o {tmp_path}",
                f"import -window root {tmp_path}",
                f"gnome-screenshot -f {tmp_path}",
            ]:
                try:
                    proc = await asyncio.create_subprocess_shell(
                        cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    await asyncio.wait_for(proc.communicate(), timeout=10)
                    if proc.returncode == 0 and Path(tmp_path).exists():
                        break
                except:
                    continue

            if not Path(tmp_path).exists():
                return {"success": False, "error": "No screenshot tool available (install scrot or imagemagick)"}

            img_bytes = Path(tmp_path).read_bytes()
            Path(tmp_path).unlink(missing_ok=True)

        elif platform.system() == "Darwin":
            tmp_path = "/tmp/rhodes_screenshot.png"
            proc = await asyncio.create_subprocess_shell(
                f"screencapture -x {tmp_path}",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await asyncio.wait_for(proc.communicate(), timeout=10)
            if not Path(tmp_path).exists():
                return {"success": False, "error": "screencapture failed"}
            img_bytes = Path(tmp_path).read_bytes()
            Path(tmp_path).unlink(missing_ok=True)

        elif platform.system() == "Windows":
            # Use PowerShell for Windows screenshot
            tmp_path = os.path.join(os.environ.get("TEMP", "/tmp"), "rhodes_screenshot.png")
            ps_cmd = f'''
            Add-Type -AssemblyName System.Windows.Forms
            $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
            $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
            $bitmap.Save("{tmp_path}")
            '''
            proc = await asyncio.create_subprocess_shell(
                f'powershell -Command "{ps_cmd}"',
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await asyncio.wait_for(proc.communicate(), timeout=15)
            if not Path(tmp_path).exists():
                return {"success": False, "error": "PowerShell screenshot failed"}
            img_bytes = Path(tmp_path).read_bytes()
            Path(tmp_path).unlink(missing_ok=True)
        else:
            return {"success": False, "error": f"Unsupported platform: {platform.system()}"}

        return {
            "success": True,
            "image_b64": base64.b64encode(img_bytes).decode('utf-8'),
            "size": len(img_bytes)
        }

    async def click(self, payload: dict) -> dict:
        """Click at coordinates."""
        x = payload.get("x", 0)
        y = payload.get("y", 0)
        button = payload.get("button", "left")
        clicks = payload.get("clicks", 1)

        print(f"  [click] ({x}, {y}) button={button} clicks={clicks}")

        if platform.system() == "Linux":
            btn_map = {"left": "1", "middle": "2", "right": "3"}
            btn = btn_map.get(button, "1")
            cmd = f"xdotool mousemove {x} {y} && xdotool click --repeat {clicks} {btn}"
        elif platform.system() == "Darwin":
            # Use cliclick on macOS
            btn_map = {"left": "c", "right": "rc", "middle": "mc"}
            btn = btn_map.get(button, "c")
            cmd = f"cliclick {btn}:{x},{y}"
        elif platform.system() == "Windows":
            # Use PowerShell with System.Windows.Forms
            cmd = f'''powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point({x}, {y}); Add-Type -MemberDefinition '[DllImport(\\\"user32.dll\\\")] public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);' -Name Mouse -Namespace Win32; [Win32.Mouse]::mouse_event(0x0002, 0, 0, 0, 0); [Win32.Mouse]::mouse_event(0x0004, 0, 0, 0, 0)"'''
        else:
            return {"success": False, "error": f"Unsupported platform: {platform.system()}"}

        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=10)

        return {"success": proc.returncode == 0, "x": x, "y": y, "button": button}

    async def move_mouse(self, payload: dict) -> dict:
        """Move mouse to coordinates."""
        x = payload.get("x", 0)
        y = payload.get("y", 0)

        print(f"  [move] ({x}, {y})")

        if platform.system() == "Linux":
            cmd = f"xdotool mousemove {x} {y}"
        elif platform.system() == "Darwin":
            cmd = f"cliclick m:{x},{y}"
        elif platform.system() == "Windows":
            cmd = f'''powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point({x}, {y})"'''
        else:
            return {"success": False, "error": f"Unsupported platform: {platform.system()}"}

        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await asyncio.wait_for(proc.communicate(), timeout=10)

        return {"success": proc.returncode == 0, "x": x, "y": y}

    async def type_text(self, payload: dict) -> dict:
        """Type text."""
        text = payload.get("text", "")
        delay = payload.get("delay", 12)  # ms between keystrokes

        print(f"  [type] {text[:40]}{'...' if len(text) > 40 else ''}")

        if platform.system() == "Linux":
            cmd = f"xdotool type --delay {delay} -- {shlex.quote(text)}"
        elif platform.system() == "Darwin":
            # cliclick uses t: for typing
            cmd = f"cliclick t:{shlex.quote(text)}"
        elif platform.system() == "Windows":
            # Use PowerShell SendKeys - escape special characters
            escaped = text
            # SendKeys special characters need escaping with braces
            for char in ['{', '}', '(', ')', '[', ']', '+', '^', '%', '~']:
                escaped = escaped.replace(char, '{' + char + '}')
            escaped = escaped.replace("'", "''")
            cmd = f'''powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{escaped}')"'''
        else:
            return {"success": False, "error": f"Unsupported platform: {platform.system()}"}

        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30)

        return {"success": proc.returncode == 0, "length": len(text)}

    async def hotkey(self, payload: dict) -> dict:
        """Press key combination (e.g., ['ctrl', 'c'])."""
        keys = payload.get("keys", [])

        print(f"  [hotkey] {'+'.join(keys)}")

        if platform.system() == "Linux":
            cmd = f"xdotool key {'+'.join(keys)}"
        elif platform.system() == "Darwin":
            # cliclick uses kp: for key press
            key_str = "+".join(keys)
            cmd = f"cliclick kp:{key_str}"
        elif platform.system() == "Windows":
            # Map to SendKeys format
            key_map = {"ctrl": "^", "alt": "%", "shift": "+", "enter": "{ENTER}", "tab": "{TAB}"}
            send_keys = "".join(key_map.get(k.lower(), k) for k in keys)
            cmd = f'''powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{send_keys}')"'''
        else:
            return {"success": False, "error": f"Unsupported platform: {platform.system()}"}

        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await asyncio.wait_for(proc.communicate(), timeout=10)

        return {"success": proc.returncode == 0, "keys": keys}

    async def scroll(self, payload: dict) -> dict:
        """Scroll up or down."""
        direction = payload.get("direction", "down")
        amount = payload.get("amount", 3)

        print(f"  [scroll] {direction} {amount}")

        if platform.system() == "Linux":
            btn = "5" if direction == "down" else "4"
            cmd = f"xdotool click --repeat {amount} {btn}"
        elif platform.system() == "Darwin":
            # Negative for down, positive for up
            delta = -amount if direction == "down" else amount
            cmd = f"cliclick w:{delta}"
        elif platform.system() == "Windows":
            delta = -120 * amount if direction == "down" else 120 * amount
            cmd = f'''powershell -Command "Add-Type -MemberDefinition '[DllImport(\\\"user32.dll\\\")] public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);' -Name Mouse -Namespace Win32; [Win32.Mouse]::mouse_event(0x0800, 0, 0, {delta}, 0)"'''
        else:
            return {"success": False, "error": f"Unsupported platform: {platform.system()}"}

        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await asyncio.wait_for(proc.communicate(), timeout=10)

        return {"success": proc.returncode == 0, "direction": direction, "amount": amount}

    async def read_stdin(self):
        """Read stdin for user commands."""
        loop = asyncio.get_event_loop()
        while self.running:
            try:
                line = await loop.run_in_executor(None, sys.stdin.readline)
                cmd = line.strip().upper()
                if cmd == "OFF":
                    disable_autostart()
                elif cmd == "ON":
                    enable_autostart()
                elif cmd == "B-ON":
                    # Start background process and exit this one
                    print("  Starting background process...")
                    subprocess.Popen([sys.executable, __file__, '-b'],
                                   start_new_session=True,
                                   stdout=subprocess.DEVNULL,
                                   stderr=subprocess.DEVNULL)
                    print("  [✓] Background process started. Exiting terminal mode.")
                    self.running = False
                elif cmd == "B-OFF":
                    # Stop background processes
                    result = subprocess.run(['pkill', '-f', 'rhodes_agent.py.*-b'], capture_output=True)
                    if result.returncode == 0:
                        print("  [✓] Background process stopped")
                    else:
                        print("  [!] No background process found")
            except:
                break

    async def run(self):
        """Main loop with auto-reconnect."""
        retry_delay = 1
        max_retry_delay = 60

        while self.running:
            try:
                if not await self.connect():
                    print(f"Connection failed, retrying in {retry_delay}s...")
                    await asyncio.sleep(retry_delay)
                    retry_delay = min(retry_delay * 2, max_retry_delay)
                    continue

                # Reset retry delay on successful connection
                retry_delay = 1

                # Start stdin reader task (only in interactive mode)
                stdin_task = None
                if not self.background:
                    stdin_task = asyncio.create_task(self.read_stdin())

                async for message in self.ws:
                    msg = json.loads(message)
                    msg_type = msg.get("msg_type", "")

                    if msg_type == "agent_command":
                        # Execute command
                        result = await self.handle_command(msg)
                        # Wrap in payload for server's Message.from_json parsing
                        response = {
                            "msg_type": "agent_result",
                            "payload": {
                                "cmd_id": msg.get("cmd_id"),
                                **result
                            }
                        }
                        await self.ws.send(json.dumps(response))

                    elif msg_type == "agent_disconnect":
                        print("Server requested disconnect.")
                        self.running = False
                        break

                    elif msg_type == "agent_update":
                        # Server pushed an update notification
                        print("Server pushed update notification...")
                        if check_for_updates(force=True):
                            break  # Will restart

                    elif msg_type == "heartbeat":
                        # Respond to server heartbeat to keep connection alive
                        await self.ws.send(json.dumps({"msg_type": "heartbeat"}))

                    # Ignore other message types (chat, etc.)

            except websockets.exceptions.ConnectionClosed:
                print(f"\nConnection closed, reconnecting in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, max_retry_delay)
            except KeyboardInterrupt:
                print("\n")
                try:
                    confirm = input("  Exit Rhodes Desktop? [y/N]: ").strip().lower()
                    if confirm in ('y', 'yes'):
                        print("  Disconnecting...")
                        self.running = False
                    else:
                        print("  Continuing... (Ctrl+C again to exit)")
                except (EOFError, KeyboardInterrupt):
                    print("\n  Disconnecting...")
                    self.running = False
            except Exception as e:
                print(f"\nError: {e}, reconnecting in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, max_retry_delay)
            finally:
                # Cancel stdin reader if it was started
                if stdin_task:
                    try:
                        stdin_task.cancel()
                    except:
                        pass
                if self.ws:
                    try:
                        await self.ws.close()
                    except:
                        pass
                    self.ws = None


def get_token() -> str:
    """Get token from config. Checks local config.json first, then ~/.rhodes."""
    # Check for config.json in same directory as executable (for bundled downloads)
    local_config = get_script_dir() / "config.json"
    if local_config.exists():
        try:
            config = json.loads(local_config.read_text())
            if config.get("token"):
                print(f"Using token from {local_config}")
                return config["token"]
        except:
            pass

    # Fall back to ~/.rhodes/agent.json
    if CONFIG_FILE.exists():
        try:
            config = json.loads(CONFIG_FILE.read_text())
            if config.get("token"):
                return config["token"]
        except:
            pass

    return None


def save_token(token: str):
    """Save token to config."""
    CONFIG_DIR.mkdir(exist_ok=True)
    CONFIG_FILE.write_text(json.dumps({"token": token}))
    CONFIG_FILE.chmod(0o600)
    print(f"Token saved to {CONFIG_FILE}")


def check_for_updates(force: bool = False) -> bool:
    """Check for updates and auto-update if available. Returns True if updated."""
    try:
        # Check server version
        req = urllib.request.Request(UPDATE_URL, headers={'User-Agent': f'RhodesDesktopMini/{VERSION}'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            server_version = data.get("version", "0.0.0")

            # Compare versions
            def parse_version(v):
                return tuple(int(x) for x in v.split("."))

            if parse_version(server_version) > parse_version(VERSION):
                print(f"Update available: {VERSION} → {server_version}")
                return do_update(server_version)
            elif force:
                print(f"Already at latest version: {VERSION}")
            return False
    except Exception as e:
        if force:
            print(f"Update check failed: {e}")
        return False


def do_update(new_version: str) -> bool:
    """Download and apply update."""
    try:
        install_dir = get_script_dir()
        print(f"Downloading update...")

        # Download new agent
        req = urllib.request.Request(DOWNLOAD_URL, headers={'User-Agent': f'RhodesDesktopMini/{VERSION}'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            import tarfile
            import io
            tar_data = io.BytesIO(resp.read())
            with tarfile.open(fileobj=tar_data, mode='r:gz') as tar:
                # Extract rhodes_agent.py
                for member in tar.getmembers():
                    if member.name.endswith('rhodes_agent.py'):
                        # Backup current
                        current = install_dir / "rhodes_agent.py"
                        if current.exists():
                            backup = install_dir / "rhodes_agent.py.bak"
                            shutil.copy(current, backup)

                        # Extract new
                        tar.extract(member, install_dir)
                        # Move if nested
                        extracted = install_dir / member.name
                        if extracted != current:
                            shutil.move(extracted, current)

                        print(f"Updated to version {new_version}")
                        print("Restarting...")

                        # Restart self
                        os.execv(sys.executable, [sys.executable, str(current)] + sys.argv[1:])
                        return True

        print("Update failed: could not find agent in archive")
        return False
    except Exception as e:
        print(f"Update failed: {e}")
        return False


def main():
    global RHODES_WS
    import argparse
    parser = argparse.ArgumentParser(description="RHODES DESKTOP - Full UI + Agent")
    parser.add_argument("-t", "--token", help="User token from Rhodes Web")
    parser.add_argument("--ui", action="store_true", help="Launch full web UI in native window")
    parser.add_argument("--login", action="store_true", help="Interactive login")
    parser.add_argument("--server", default=RHODES_WS, help="WebSocket server URL")
    parser.add_argument("--version", action="store_true", help="Show version")
    parser.add_argument("--update", action="store_true", help="Force update check")
    parser.add_argument("--no-update", action="store_true", help="Skip auto-update check")
    parser.add_argument("--autostart-on", action="store_true", help="Enable autostart on login")
    parser.add_argument("--autostart-off", action="store_true", help="Disable autostart on login")
    parser.add_argument("--background", "-b", action="store_true", help="Run in background (daemonize)")
    parser.add_argument("--stop", action="store_true", help="Stop background Rhodes Desktop")
    parser.add_argument("--port", type=int, default=UI_PORT, help="UI server port")
    args = parser.parse_args()

    # Version flag
    if args.version:
        print(f"RHODES DESKTOP v{VERSION}")
        sys.exit(0)

    # Autostart management
    if args.autostart_on:
        enable_autostart()
        sys.exit(0)
    if args.autostart_off:
        disable_autostart()
        sys.exit(0)

    # Stop background process
    if args.stop:
        import subprocess
        result = subprocess.run(['pkill', '-f', 'rhodes_agent.py'], capture_output=True)
        if result.returncode == 0:
            print("  [✓] Rhodes Desktop stopped")
        else:
            print("  [!] No background Rhodes Desktop found")
        sys.exit(0)

    # Update check
    if args.update:
        check_for_updates(force=True)
        sys.exit(0)

    # Enable autostart by default on first run
    if not AUTOSTART_FILE.exists() and not args.background:
        enable_autostart()

    # Background/daemon mode - fork BEFORE connecting to avoid killing websocket
    if args.background:
        # Fork immediately to background
        log_file = Path.home() / ".local" / "share" / "rhodes-desktop" / "rhodes.log"
        log_file.parent.mkdir(parents=True, exist_ok=True)

        # Double fork to fully daemonize
        if os.fork() > 0:
            # Parent exits
            sys.exit(0)

        os.setsid()  # Create new session

        if os.fork() > 0:
            # First child exits
            sys.exit(0)

        # Second child continues as daemon
        # Redirect stdout/stderr to log file
        sys.stdout = open(log_file, 'a')
        sys.stderr = sys.stdout

        # Send notification
        try:
            subprocess.run(['notify-send', '-i', 'utilities-terminal',
                          'RHODES DESKTOP',
                          'Running in background.'],
                         capture_output=True)
        except:
            pass

    # Auto-update on startup (unless disabled)
    if not args.no_update:
        check_for_updates()

    RHODES_WS = args.server

    # Get token
    token = args.token or get_token()
    
    # Save token if provided via command line
    if args.token:
        save_token(args.token)

    if args.login or not token:
        print("Rhodes Local Agent Setup")
        print("=" * 40)
        print("To get your token:")
        print("1. Go to rhodesagi.com and log in")
        print("2. Open browser console (F12)")
        print("3. Type: localStorage.getItem('rhodes_user_token')")
        print("4. Copy the token (without quotes)")
        print()
        token = input("Paste your token: ").strip()
        if token:
            save_token(token)
        else:
            print("No token provided.")
            sys.exit(1)

    # UI mode: launch native window with web UI + agent
    if args.ui:
        launch_ui(token, port=args.port)
        sys.exit(0)

    # Agent-only mode
    agent = RhodesAgent(token, background=args.background)
    try:
        asyncio.run(agent.run())
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
