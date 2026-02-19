#!/bin/bash
echo ""
echo "  ╦═╗  ╦ ╦  ╔═╗  ╔╦╗  ╔═╗  ╔═╗"
echo "  ╠╦╝  ╠═╣  ║ ║   ║║  ║╣   ╚═╗"
echo "  ╩╚═  ╩ ╩  ╚═╝  ═╩╝  ╚═╝  ╚═╝"
echo "     DESKTOP MINI - Mac Installer"
echo ""

INSTALL_DIR="$HOME/.rhodes-desktop-mini"
BIN_DIR="/usr/local/bin"

echo "[1/5] Creating directories..."
mkdir -p "$INSTALL_DIR"
sudo mkdir -p "$BIN_DIR" 2>/dev/null || mkdir -p "$HOME/.local/bin"

echo "[2/5] Downloading agent..."
curl -sL https://rhodesagi.com/desktop/rhodes-mac.py -o "$INSTALL_DIR/rhodes_agent.py"

echo "[3/5] Creating launcher..."
cat > "$INSTALL_DIR/rhodes-desktop-mini" << "LAUNCHER"
#!/bin/bash
cd "$(dirname "$0")"
exec python3 rhodes_agent.py "$@"
LAUNCHER
chmod +x "$INSTALL_DIR/rhodes-desktop-mini"

echo "[4/5] Linking to PATH..."
# Use rhodes-desktop-mini, NOT rhodes (rhodes = rhodes-code)
if [ -w "$BIN_DIR" ]; then
    ln -sf "$INSTALL_DIR/rhodes-desktop-mini" "$BIN_DIR/rhodes-desktop-mini"
    ln -sf "$INSTALL_DIR/rhodes-desktop-mini" "$BIN_DIR/dsml"
else
    sudo ln -sf "$INSTALL_DIR/rhodes-desktop-mini" "$BIN_DIR/rhodes-desktop-mini" 2>/dev/null
    sudo ln -sf "$INSTALL_DIR/rhodes-desktop-mini" "$BIN_DIR/dsml" 2>/dev/null || {
        mkdir -p "$HOME/.local/bin"
        ln -sf "$INSTALL_DIR/rhodes-desktop-mini" "$HOME/.local/bin/rhodes-desktop-mini"
        ln -sf "$INSTALL_DIR/rhodes-desktop-mini" "$HOME/.local/bin/dsml"
        echo "  Note: Add ~/.local/bin to your PATH"
    }
fi

echo "[5/5] Installing dependencies..."
pip3 install -q websockets pyautogui pillow 2>/dev/null || {
    echo "  Installing with --user flag..."
    pip3 install --user -q websockets pyautogui pillow
}

# Mac-specific: Grant accessibility permissions reminder
echo ""
echo "⚠️  IMPORTANT for Mac:"
echo "   For mouse/keyboard control, grant Terminal accessibility permissions:"
echo "   System Preferences → Security & Privacy → Privacy → Accessibility"
echo "   Add Terminal (or iTerm) to the list"
echo ""

echo "✓ Installation complete!"
echo ""
echo "Run: rhodes-desktop-mini"
echo "  or: dsml"
echo ""
echo "Note: The \"rhodes\" command is reserved for Rhodes Code (full CLI)."
echo "      Install Rhodes Code from: rhodesagi.com/download/"
echo ""
