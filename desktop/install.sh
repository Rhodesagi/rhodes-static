#!/bin/bash
echo ""
echo "  ╦═╗  ╦ ╦  ╔═╗  ╔╦╗  ╔═╗  ╔═╗"
echo "  ╠╦╝  ╠═╣  ║ ║   ║║  ║╣   ╚═╗"
echo "  ╩╚═  ╩ ╩  ╚═╝  ═╩╝  ╚═╝  ╚═╝"
echo "       DESKTOP MINI INSTALLER"
echo ""

INSTALL_DIR="$HOME/.local/share/rhodes-desktop-mini"
BIN_DIR="$HOME/.local/bin"

echo "[1/4] Creating directories..."
mkdir -p "$INSTALL_DIR" "$BIN_DIR"

echo "[2/4] Downloading agent..."
curl -sL https://rhodesagi.com/desktop/rhodes-linux.py -o "$INSTALL_DIR/rhodes_agent.py"

echo "[3/4] Creating launcher..."
cat > "$INSTALL_DIR/rhodes-desktop-mini" << "LAUNCHER"
#!/bin/bash
cd "$(dirname "$(readlink -f "$0")")"
exec python3 rhodes_agent.py "$@"
LAUNCHER
chmod +x "$INSTALL_DIR/rhodes-desktop-mini"

# Create symlinks - use rhodes-desktop-mini, NOT rhodes (rhodes = rhodes-code)
ln -sf "$INSTALL_DIR/rhodes-desktop-mini" "$BIN_DIR/rhodes-desktop-mini"
ln -sf "$INSTALL_DIR/rhodes-desktop-mini" "$BIN_DIR/dsml"

echo "[4/4] Installing dependencies..."
pip3 install -q websockets pyautogui mss pillow 2>/dev/null || pip install -q websockets pyautogui mss pillow 2>/dev/null || echo "  (Install manually: pip install websockets pyautogui mss pillow)"

echo ""
echo "✓ Installation complete!"
echo ""
echo "Run: rhodes-desktop-mini"
echo "  or: dsml"
echo ""
echo "Note: The \"rhodes\" command is reserved for Rhodes Code (full CLI)."
echo "      Install Rhodes Code from: rhodesagi.com/download/"
echo ""
