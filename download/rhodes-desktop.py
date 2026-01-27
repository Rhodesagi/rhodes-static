#!/usr/bin/env python3
"""
RHODES_CODE - Full Rhodes experience locally.
Local agent + native window web UI. Single file, minimal dependencies.

Usage:
    rhodes                    # Full UI + agent (default)
    rhodes --ui               # Same as above
    rhodes --no-ui            # Agent only (background)
    rhodes --token YOUR_TOKEN # First time setup
    rhodes --login            # Interactive login
    rhodes --version          # Show version
    rhodes --uninstall        # Remove all RHODES_CODE data
    rhodes --stop             # Stop background instance
"""

VERSION = "2.9.3"  # pywebview for all platforms + Python version check
UPDATE_URL = "https://rhodesagi.com/api/desktop/version"
DOWNLOAD_URL = "https://rhodesagi.com/desktop/rhodes-desktop-linux-x64.tar.gz"

import sys

# Check Python version - pywebview dependencies don't support 3.14+ yet
if sys.version_info >= (3, 14):
    print()
    print("  [ERROR] Python 3.14+ is not yet supported!")
    print()
    print("  The UI framework (pywebview) requires Python 3.13 or earlier.")
    print("  Please install Python 3.12 or 3.13 from python.org")
    print()
    print("  Your version:", sys.version.split()[0])
    print()
    sys.exit(1)

import asyncio
import base64
import json
import os
import shlex
import subprocess
import sys
import tempfile
import time
import platform
import shutil
import signal
import urllib.request
from pathlib import Path

# Admin user check for debug mode
ADMIN_USER_IDS = {2}  # User IDs that get debug mode

def is_admin_user(token: str) -> bool:
    """Check if token belongs to an admin user."""
    if not token:
        return False
    try:
        import base64
        parts = token.split(".")
        if len(parts) != 3:
            return False
        # Decode payload (add padding if needed)
        payload = parts[1]
        payload += "=" * (4 - len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload)
        import json
        data = json.loads(decoded)
        return data.get("user_id") in ADMIN_USER_IDS
    except:
        return False

# Global debug flag (set during launch)
_DEBUG_MODE = False

# Sandbox configuration
# "none" - no restrictions
# "actions" - read anywhere, write/execute only in sandbox_dir
# "full" - read and write only in sandbox_dir
SANDBOX_MODE = "none"
SANDBOX_DIR = None

def set_sandbox(mode: str, directory: str = None):
    """Configure sandbox mode."""
    global SANDBOX_MODE, SANDBOX_DIR
    if mode not in ("none", "actions", "full"):
        raise ValueError("Sandbox mode must be 'none', 'actions', or 'full'")
    SANDBOX_MODE = mode
    if directory:
        SANDBOX_DIR = str(Path(directory).resolve())
    print(f"  [SANDBOX] Mode: {mode}, Directory: {SANDBOX_DIR or 'N/A'}")

def is_path_allowed(path: str, operation: str = "read") -> bool:
    """Check if path is allowed under current sandbox settings."""
    if SANDBOX_MODE == "none":
        return True

    if not SANDBOX_DIR:
        return True  # No sandbox dir set, allow all

    try:
        resolved = str(Path(path).resolve())
    except:
        return False

    # Always allow access to ~/.rhodes for config
    rhodes_dir = str(Path.home() / ".rhodes")
    if resolved.startswith(rhodes_dir):
        return True

    if SANDBOX_MODE == "actions":
        # Read anywhere, write only in sandbox
        if operation == "read":
            return True
        return resolved.startswith(SANDBOX_DIR)

    elif SANDBOX_MODE == "full":
        # Everything restricted to sandbox
        return resolved.startswith(SANDBOX_DIR)

    return True

def sandbox_check(path: str, operation: str = "write"):
    """Raise error if path not allowed."""
    if not is_path_allowed(path, operation):
        raise PermissionError(f"Sandbox: {operation} not allowed outside {SANDBOX_DIR}")

# Settings file for persistent config
SETTINGS_FILE = CONFIG_DIR / "settings.json"

def load_settings():
    """Load settings from file."""
    global SANDBOX_MODE, SANDBOX_DIR
    try:
        if SETTINGS_FILE.exists():
            import json
            settings = json.loads(SETTINGS_FILE.read_text())
            SANDBOX_MODE = settings.get("sandbox_mode", "none")
            SANDBOX_DIR = settings.get("sandbox_dir", None)
            if _DEBUG_MODE:
                debug_log(f"Loaded settings: sandbox={SANDBOX_MODE}, dir={SANDBOX_DIR}")
    except Exception as e:
        if _DEBUG_MODE:
            debug_log(f"Failed to load settings: {e}", "WARN")

def save_settings():
    """Save current settings to file."""
    try:
        import json
        settings = {
            "sandbox_mode": SANDBOX_MODE,
            "sandbox_dir": SANDBOX_DIR,
        }
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        SETTINGS_FILE.write_text(json.dumps(settings, indent=2))
        if _DEBUG_MODE:
            debug_log("Settings saved")
    except Exception as e:
        if _DEBUG_MODE:
            debug_log(f"Failed to save settings: {e}", "ERROR")

def get_settings_dict():
    """Get current settings as dict for UI."""
    return {
        "sandbox_mode": SANDBOX_MODE,
        "sandbox_dir": SANDBOX_DIR,
    }

def update_settings(new_settings: dict):
    """Update settings from UI."""
    global SANDBOX_MODE, SANDBOX_DIR
    if "sandbox_mode" in new_settings:
        mode = new_settings["sandbox_mode"]
        if mode in ("none", "actions", "full"):
            SANDBOX_MODE = mode
    if "sandbox_dir" in new_settings:
        SANDBOX_DIR = new_settings["sandbox_dir"] if new_settings["sandbox_dir"] else None
    save_settings()
    return get_settings_dict()



# Debug telemetry - sends logs to server for admin debugging
_DEBUG_LOG = []
_MAX_DEBUG_LOG = 100

def debug_log(msg: str, level: str = "INFO"):
    """Log debug message and send to server if admin."""
    import time
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    entry = {"ts": timestamp, "level": level, "msg": msg}
    _DEBUG_LOG.append(entry)
    if len(_DEBUG_LOG) > _MAX_DEBUG_LOG:
        _DEBUG_LOG.pop(0)
    if _DEBUG_MODE:
        print(f"  [{level}] {msg}")


# Push notification support
PUSH_POLL_INTERVAL = 300  # Check every 5 minutes
_last_push_check = 0

def check_push_notifications():
    """Check server for push notifications (update alerts, announcements)."""
    global _last_push_check
    import time
    now = time.time()
    if now - _last_push_check < PUSH_POLL_INTERVAL:
        return None
    _last_push_check = now

    try:
        req = urllib.request.Request(
            "https://rhodesagi.com/api/desktop/notifications",
            headers={'User-Agent': f'RhodesDesktop/{VERSION}'}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            return data.get("notifications", [])
    except:
        return None

def show_desktop_notification(title: str, message: str):
    """Show a desktop notification."""
    import subprocess
    import sys
    try:
        if sys.platform == "linux":
            subprocess.run(['notify-send', '-i', 'dialog-information', title, message],
                          capture_output=True, timeout=5)
        elif sys.platform == "darwin":
            subprocess.run(['osascript', '-e',
                          f'display notification "{message}" with title "{title}"'],
                          capture_output=True, timeout=5)
        # Windows notifications would need win10toast or similar
    except:
        pass


def send_debug_report(error: str = None):
    """Send debug report to server (admin only)."""
    if not _DEBUG_MODE:
        return
    try:
        import json
        import urllib.request
        import platform
        import sys

        # Get token
        token = ""
        try:
            cfg_file = Path.home() / ".rhodes" / "config.json"
            if cfg_file.exists():
                token = json.loads(cfg_file.read_text()).get("token", "")
        except:
            pass

        report = {
            "version": VERSION,
            "platform": platform.system(),
            "python": sys.version,
            "error": error,
            "log": _DEBUG_LOG[-50:],  # Last 50 entries
        }

        req = urllib.request.Request(
            "https://rhodesagi.com/api/debug/report",
            data=json.dumps(report).encode(),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
        )
        urllib.request.urlopen(req, timeout=5)
        debug_log("Debug report sent to server", "DEBUG")
    except Exception as e:
        pass  # Silent fail



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
Name=RHODES_CODE
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

def uninstall():
    """Completely remove RHODES_CODE from the system."""
    print("\n  RHODES_CODE Uninstaller")
    print("  " + "=" * 30)

    removed = []

    # Remove config directory (~/.rhodes)
    if CONFIG_DIR.exists():
        shutil.rmtree(CONFIG_DIR, ignore_errors=True)
        removed.append(str(CONFIG_DIR))

    # Remove local share directory (~/.local/share/rhodes-desktop)
    local_share = Path.home() / ".local" / "share" / "rhodes-desktop"
    if local_share.exists():
        shutil.rmtree(local_share, ignore_errors=True)
        removed.append(str(local_share))

    # Remove autostart entry
    if AUTOSTART_FILE.exists():
        AUTOSTART_FILE.unlink()
        removed.append(str(AUTOSTART_FILE))

    # Remove cached assets
    if ASSETS_DIR.exists():
        shutil.rmtree(ASSETS_DIR, ignore_errors=True)
        removed.append(str(ASSETS_DIR))

    # Try to stop any running instance
    try:
        import subprocess
        subprocess.run(["pkill", "-f", "rhodes_agent.py"], capture_output=True, timeout=5)
        subprocess.run(["pkill", "-f", "rhodes-linux.py"], capture_output=True, timeout=5)
    except:
        pass

    if removed:
        print("\n  Removed:")
        for path in removed:
            print(f"    - {path}")
    else:
        print("\n  Nothing to remove (already clean)")

    print("\n  [✓] RHODES_CODE uninstalled")
    print("  To reinstall: curl -O https://rhodesagi.com/download/rhodes-linux.py && python3 rhodes-linux.py")
    print()

# Try websockets, install if missing with robust fallbacks
try:
    import websockets
    HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False
    print("Installing websockets...")
    # Try with --user first (most likely to succeed on macOS/Linux)
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "websockets", "-q"])
    except subprocess.CalledProcessError:
        # Try without --user (may require sudo, but we try anyway)
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets", "-q"])
        except subprocess.CalledProcessError:
            # Try with --break-system-packages for newer pip where user install is restricted
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--break-system-packages", "websockets", "-q"])
            except subprocess.CalledProcessError as e:
                print("Failed to install websockets. Please install manually:")
                print("  python3 -m pip install --user websockets")
                sys.exit(1)
    # After installation, attempt import again
    try:
        import websockets
        HAS_WEBSOCKETS = True
    except ImportError:
        # If still failing, maybe the module is installed in a different location
        # Add user site-packages to sys.path
        import site
        site.addsitedir(site.getusersitepackages())
        try:
            import websockets
            HAS_WEBSOCKETS = True
        except ImportError:
            print("Websockets installed but cannot be imported. Please check your Python environment.")
            sys.exit(1)

# ============================================================
# WEB UI COMPONENTS
# ============================================================

VPS_HOST = 'rhodesagi.com'
ASSETS_DIR = Path.home() / ".rhodes" / "assets"
UI_PORT = 8800

REQUIRED_ASSETS = ['index.html', 'rhodes.js', 'rhodes.css', 'credentials-popup.js']

FALLBACK_HTML = '''<!DOCTYPE html>
<html><head><title>RHODES_CODE</title>
<style>body{font-family:system-ui;background:#0a0a12;color:#e0e0e0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}a{color:#60a5fa}</style>
</head><body><div style="text-align:center"><h1>RHODES_CODE</h1><p>Could not load assets. Visit <a href="https://rhodesagi.com">rhodesagi.com</a></p></div></body></html>'''

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
                    # Check config.json first (where installer saves token)
                    config_json = CONFIG_DIR / "config.json"
                    if config_json.exists():
                        try:
                            cfg = json.loads(config_json.read_text())
                            token = cfg.get("token", "")
                        except: pass
                    # Fallback to agent.json (legacy)
                    if not token and CONFIG_FILE.exists():
                        try:
                            cfg = json.loads(CONFIG_FILE.read_text())
                            token = cfg.get("token", "")
                        except: pass
                    if token and "<head>" in html:
                        script = "<head>\n<script>window.__RHODES_DESKTOP_TOKEN__=\"" + token + "\";window.__RHODES_DESKTOP_MODE__=true;try{localStorage.clear();localStorage.setItem(\"rhodes_user_token\",\"" + token + "\");localStorage.setItem(\"rhodes_token\",\"" + token + "\");}catch(e){}</script>"
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
    import shutil
    time.sleep(2)  # Wait for window to be created

    # Check if wmctrl is available
    if not shutil.which("wmctrl"):
        # wmctrl not installed - silently skip
        return

    try:
        result = subprocess.run(["wmctrl", "-l"], capture_output=True, text=True, timeout=5)
        for line in result.stdout.strip().split("\n"):
            if "RHODES_CODE" in line or "Rhodes" in line:
                wid = line.split()[0]
                subprocess.run(["wmctrl", "-i", "-r", wid, "-b", "add,sticky"], timeout=5)
                break
    except Exception:
        pass  # Silently ignore - sticky is just a nice-to-have


def launch_ui(token, port=UI_PORT):
    global _DEBUG_MODE
    _DEBUG_MODE = is_admin_user(token)
    if _DEBUG_MODE:
        print("  [DEBUG] Admin mode enabled - debug panel available (Right-click > Inspect)")
    debug_log(f"App launched - version {VERSION}", "INFO")

    """Launch native window with web UI + run agent in background."""
    import threading

    # Install pywebview if needed
    # Suppress GTK/WebKit warnings at GLib level BEFORE anything loads
    import os
    import sys
    import warnings
    warnings.filterwarnings("ignore")

    # Force software rendering to avoid GLX/GPU errors on VMs
    os.environ["LIBGL_ALWAYS_SOFTWARE"] = "1"
    os.environ["WEBKIT_DISABLE_COMPOSITING_MODE"] = "1"
    os.environ["MESA_GL_VERSION_OVERRIDE"] = "3.3"

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
            # Filter out all GTK/WebKit/GLib/GLX warnings
            if any(x in msg_str for x in [
                "pywebview", "WebKit", "GLib", "gi.repository", "Gtk-WARNING",
                "GTK_DEBUG", "G_DEBUG", "WARNING **", "glx:", "failed to load driver",
                "virtio_gpu", "dri3", "MESA", "libGL", "EGL", "Could not make window sticky"
            ]):
                return
            _original_stderr.write(msg)
        def flush(self):
            _original_stderr.flush()
    sys.stderr = QuietStderr()

    # Use pywebview on all platforms
    # - Mac: WebKit (built-in)
    # - Windows 10+: EdgeChromium (built-in, no extras needed)
    # - Linux: GTK WebKit
    try:
        import webview
    except ImportError:
        print("  Installing UI framework (pywebview)...")
        # Plain pywebview - no extras, uses system webview
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "--user", "pywebview"],
            timeout=120
        )
        if result.returncode != 0:
            # Try without --user
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "pywebview"],
                timeout=120
            )
        try:
            import webview
        except ImportError:
            print("\n  [ERROR] pywebview installation failed!")
            print("  Please run manually:")
            print("    pip install pywebview")
            print("  Then try again: python rhodes.py --ui")
            sys.exit(1)

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
    print("  Opening RHODES_CODE...")

    api = RhodesAPI()
    window = webview.create_window(
        'RHODES_CODE',
        f'http://localhost:{port}',
        width=1200,
        height=800,
        resizable=True,
        min_size=(800, 600),
        js_api=api
    )

    # Suppress pywebview internal warnings
    class SuppressWebviewErrors:
        def write(self, msg):
            if "WebKitJavascriptError" not in msg and "pywebview" not in msg:
                sys.__stderr__.write(msg)
        def flush(self):
            sys.__stderr__.flush()
    sys.stderr = SuppressWebviewErrors()

    # Start sticky thread in background (Linux only)
    if sys.platform == "linux":
        sticky_thread = threading.Thread(target=make_sticky, daemon=True)
        sticky_thread.start()

    webview.start(debug=_DEBUG_MODE)
    print("  RHODES_CODE closed.")

CONFIG_DIR = Path.home() / ".rhodes"
CONFIG_FILE = CONFIG_DIR / "agent.json"
CREDENTIALS_FILE = CONFIG_DIR / "credentials.json"
RHODES_WS = "wss://rhodesagi.com/ws"

# Custom slash commands support
COMMANDS_DIR = CONFIG_DIR / "commands"


def request_macos_permissions():
    """Request file system permissions upfront on macOS."""
    if platform.system() != "Darwin":
        return
    print("  Requesting file system access...")
    protected_dirs = [
        Path.home() / "Desktop",
        Path.home() / "Documents",
        Path.home() / "Downloads",
    ]
    accessed = 0
    for d in protected_dirs:
        try:
            if d.exists():
                list(d.iterdir())
                accessed += 1
        except:
            pass
    if accessed > 0:
        print(f"  ✓ File access requested for {accessed} directories")


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

    def open_url(self, url):
        """Open URL in the system's default browser."""
        import webbrowser
        import subprocess
        try:
            # Try webbrowser module first (cross-platform)
            webbrowser.open(url)
            return {"success": True, "url": url}
        except Exception as e:
            # Fallback to xdg-open on Linux
            try:
                subprocess.Popen(['xdg-open', url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return {"success": True, "url": url}
            except:
                return {"success": False, "error": str(e)}

    def create_window(self, url, title="Rhodes"):
        """Create a new pywebview window - enables popups in desktop app."""
        try:
            import webview
            webview.create_window(title, url, width=1200, height=800)
            return {"success": True, "url": url}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def clear_cache(self):
        """Clear cached assets."""
        cleared = []
        try:
            assets_dir = Path.home() / ".rhodes" / "assets"
            if assets_dir.exists():
                for f in assets_dir.iterdir():
                    if f.is_file() and f.suffix in [".html", ".js", ".css", ".png"]:
                        f.unlink()
                        cleared.append(f.name)
            return {"success": True, "cleared": cleared, "message": f"Cleared {len(cleared)} files. Restart to reload."}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def execute_command(self, cmd, args=""):
        if cmd in ["clear-cache", "clearcache", "refresh-assets"]:
            return self.clear_cache()
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
        print("   ██████╗ ██████╗ ██████╗ ███████╗")
        print("  ██╔════╝██╔═══██╗██╔══██╗██╔════╝")
        print("  ██║     ██║   ██║██║  ██║█████╗  ")
        print("  ██║     ██║   ██║██║  ██║██╔══╝  ")
        print("  ╚██████╗╚██████╔╝██████╔╝███████╗")
        print("   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝")
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
                    confirm = input("  Exit RHODES_CODE? [y/N]: ").strip().lower()
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
    """Get token from config. Checks multiple locations."""
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

    # Check ~/.rhodes/config.json (installer saves here)
    rhodes_config = CONFIG_DIR / "config.json"
    if rhodes_config.exists():
        try:
            config = json.loads(rhodes_config.read_text())
            if config.get("token"):
                print(f"Using token from {rhodes_config}")
                return config["token"]
        except:
            pass

    # Fall back to ~/.rhodes/agent.json (legacy)
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



# === Installation Functions ===

def create_desktop_shortcut():
    """Create desktop shortcut for RHODES_CODE."""
    import platform
    system = platform.system()
    script_path = Path(__file__).resolve()
    
    try:
        if system == "Linux":
            applications_dir = Path.home() / ".local" / "share" / "applications"
            applications_dir.mkdir(parents=True, exist_ok=True)
            
            icon_path = Path.home() / ".rhodes" / "assets" / "Rhodes-R-Icon-180.png"
            icon_str = str(icon_path) if icon_path.exists() else "utilities-terminal"
            
            lines = [
                "[Desktop Entry]",
                "Name=RHODES_CODE", 
                "Comment=Rhodes AGI Desktop Client",
                "Exec=python3 " + str(script_path),
                "Icon=" + icon_str,
                "Terminal=false",
                "Type=Application",
                "Categories=Network;Chat;Development;",
                "Keywords=rhodes;agi;ai;chat;code;",
                "StartupNotify=true"
            ]
            desktop_entry = "\n".join(lines) + "\n"
            
            app_file = applications_dir / "rhodes-code.desktop"
            app_file.write_text(desktop_entry)
            app_file.chmod(0o755)
            
            desktop_dir = Path.home() / "Desktop"
            if desktop_dir.exists():
                desktop_file = desktop_dir / "RHODES_CODE.desktop"
                desktop_file.write_text(desktop_entry)
                desktop_file.chmod(0o755)
            
            print("  [✓] Desktop shortcut created")
            
        elif system == "Darwin":
            applications_dir = Path.home() / "Applications"
            applications_dir.mkdir(exist_ok=True)
            
            app_path = applications_dir / "RHODES_CODE.app"
            contents_dir = app_path / "Contents" / "MacOS"
            contents_dir.mkdir(parents=True, exist_ok=True)
            
            launcher = contents_dir / "RHODES_CODE"
            launcher.write_text("#!/bin/bash\ncd ~\npython3 \"" + str(script_path) + "\"\n")
            launcher.chmod(0o755)
            
            plist = app_path / "Contents" / "Info.plist"
            plist.write_text("""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key><string>RHODES_CODE</string>
    <key>CFBundleName</key><string>RHODES_CODE</string>
    <key>CFBundleIdentifier</key><string>com.rhodesagi.code</string>
</dict>
</plist>""")
            print("  [✓] macOS app created")
            
        elif system == "Windows":
            desktop = Path.home() / "Desktop"
            shortcut_path = desktop / "RHODES_CODE.lnk"
            ps = "$s = (New-Object -COM WScript.Shell).CreateShortcut( + str(shortcut_path) + );"
            ps += "$s.TargetPath=pythonw.exe;"
            ps += "$s.Arguments=" + str(script_path) + ";"
            ps += "$s.Save()"
            subprocess.run(["powershell", "-Command", ps], capture_output=True)
            print("  [✓] Desktop shortcut created")
            
    except Exception as e:
        print(f"  [!] Shortcut error: {e}")


def add_to_path():
    """Add rhodes command to PATH."""
    import platform
    system = platform.system()
    script_path = Path(__file__).resolve()

    try:
        if system in ("Linux", "Darwin"):
            # Copy script to stable location
            install_dir = Path.home() / ".rhodes"
            install_dir.mkdir(parents=True, exist_ok=True)
            installed_script = install_dir / "rhodes_agent.py"

            # Copy current script to stable location
            if script_path != installed_script:
                shutil.copy2(script_path, installed_script)
                installed_script.chmod(0o755)

            # Create command wrapper pointing to stable location
            bin_dir = Path.home() / ".local" / "bin"
            bin_dir.mkdir(parents=True, exist_ok=True)

            link_path = bin_dir / "rhodes"
            if link_path.exists() or link_path.is_symlink():
                link_path.unlink()

            wrapper = "#!/usr/bin/env python3\nimport subprocess, sys\n"
            wrapper += "subprocess.call([sys.executable, \"" + str(installed_script) + "\"] + sys.argv[1:])\n"
            link_path.write_text(wrapper)
            link_path.chmod(0o755)

            print("  [✓] Installed to ~/.rhodes/")
            print("  [✓] Command 'rhodes' added to ~/.local/bin/")

            # Check if ~/.local/bin is in PATH
            if str(bin_dir) not in os.environ.get("PATH", ""):
                print("  [!] Add to PATH: export PATH=\"$HOME/.local/bin:$PATH\"")
            
        elif system == "Windows":
            bin_dir = Path.home() / ".rhodes" / "bin"
            bin_dir.mkdir(parents=True, exist_ok=True)
            
            bat_path = bin_dir / "rhodes.bat"
            bat_path.write_text("@echo off\npythonw \"" + str(script_path) + "\" %*\n")
            
            ps = "$p=[Environment]::GetEnvironmentVariable(PATH,User);"
            ps += "if($p-notlike* + str(bin_dir) + *){"
            ps += "[Environment]::SetEnvironmentVariable(PATH,\"$p;" + str(bin_dir) + "\",User)}"
            subprocess.run(["powershell", "-Command", ps], capture_output=True)
            print("  [✓] Command rhodes added to PATH")
            
    except Exception as e:
        print(f"  [!] PATH error: {e}")


def first_run_setup():
    """Run first-time setup."""
    marker = Path.home() / ".rhodes" / ".installed"
    if not marker.exists():
        print("\n  RHODES_CODE - First Run Setup")
        print("  " + "="*30)
        create_desktop_shortcut()
        add_to_path()
        marker.parent.mkdir(parents=True, exist_ok=True)
        marker.write_text("installed")
        print("  " + "="*30 + "\n")


def main():
    global RHODES_WS
    import argparse
    parser = argparse.ArgumentParser(description="RHODES_CODE - Full UI + Agent")
    parser.add_argument("-t", "--token", help="User token from Rhodes Web")
    parser.add_argument("--ui", action="store_true", help="(default, kept for compatibility)")
    parser.add_argument("--no-ui", action="store_true", help="Run without UI (agent only)")
    parser.add_argument("--login", action="store_true", help="Interactive login")
    parser.add_argument("--server", default=RHODES_WS, help="WebSocket server URL")
    parser.add_argument("--version", action="store_true", help="Show version")
    parser.add_argument("--sandbox", type=str, metavar="DIR", help="Sandbox mode: write/execute only in DIR, read anywhere")
    parser.add_argument("--sandbox-full", type=str, metavar="DIR", help="Full sandbox: read and write only in DIR")
    parser.add_argument("--update", action="store_true", help="Force update check")
    parser.add_argument("--no-update", action="store_true", help="Skip auto-update check")
    parser.add_argument("--autostart-on", action="store_true", help="Enable autostart on login")
    parser.add_argument("--autostart-off", action="store_true", help="Disable autostart on login")
    parser.add_argument("--background", "-b", action="store_true", help="Run in background (daemonize)")
    parser.add_argument("--stop", action="store_true", help="Stop background RHODES_CODE")
    parser.add_argument("--uninstall", action="store_true", help="Completely remove RHODES_CODE")
    parser.add_argument("--port", type=int, default=UI_PORT, help="UI server port")
    args = parser.parse_args()

    # Uninstall
    if args.uninstall:
        uninstall()
        sys.exit(0)

    # Version flag
    if args.version:
        print(f"RHODES_CODE v{VERSION}")
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
            print("  [✓] RHODES_CODE stopped")
        else:
            print("  [!] No background RHODES_CODE found")
        sys.exit(0)

    # Update check
    if args.update:
        check_for_updates(force=True)
        sys.exit(0)

    # First run setup (desktop shortcut, PATH)
    first_run_setup()
    
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
                          'RHODES_CODE',
                          'Running in background.'],
                         capture_output=True)
        except:
            pass

    # Auto-update on startup (unless disabled)
    if not args.no_update:
        check_for_updates()

    RHODES_WS = args.server

    # Get token
    # Initialize sandbox if requested
    if args.sandbox:
        set_sandbox("actions", args.sandbox)
    elif args.sandbox_full:
        set_sandbox("full", args.sandbox_full)

    token = args.token or get_token()
    
    # Save token if provided via command line
    if args.token:
        save_token(args.token)

    if args.login or not token:
        print("Rhodes Local Agent Setup")
        print("=" * 40)
        print()
        import urllib.request, urllib.error, json as _json, getpass
        username = input("Username or email: ").strip()
        password = getpass.getpass("Password: ")
        if not username or not password:
            print("Username and password required.")
            sys.exit(1)
        try:
            req = urllib.request.Request(
                "https://rhodesagi.com/api/user/login",
                data=_json.dumps({"username": username, "password": password}).encode(),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                token = _json.loads(resp.read().decode()).get("token")
                if token:
                    save_token(token)
                    print("[OK] Logged in!")
                else:
                    print("Login failed.")
                    sys.exit(1)
        except urllib.error.HTTPError as e:
            print(f"Login failed: {e.reason}")
            sys.exit(1)
        except Exception as e:
            print(f"Login failed: {e}")
            sys.exit(1)

    # UI mode: launch native window with web UI + agent
    if not getattr(args, "no_ui", False) and not args.background:
        launch_ui(token, port=args.port)
        sys.exit(0)

    # Agent-only mode
    agent = RhodesAgent(token, background=args.background)
    try:
        asyncio.run(agent.run())
    except KeyboardInterrupt:
        pass


def _global_exception_handler(exc_type, exc_value, exc_tb):
    import traceback
    error = "".join(traceback.format_exception(exc_type, exc_value, exc_tb))
    debug_log(f"Uncaught exception: {exc_value}", "CRITICAL")
    send_debug_report(error)
    sys.__excepthook__(exc_type, exc_value, exc_tb)

if __name__ == "__main__":
    sys.excepthook = _global_exception_handler
    main()