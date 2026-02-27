#!/usr/bin/env python3
"""
Desktop Calculator App using pywebview
A clean, modern calculator with full keyboard support
"""

import webview
import os
import sys


def create_calculator():
    """Create and run the calculator window"""
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    html_path = os.path.join(script_dir, 'calculator.html')
    
    # Ensure the HTML file exists
    if not os.path.exists(html_path):
        print(f"Error: calculator.html not found at {html_path}")
        sys.exit(1)
    
    # Create the webview window
    window = webview.create_window(
        title='Calculator',
        url=html_path,
        width=420,
        height=700,
        resizable=False,
        min_size=(420, 700),
        background_color='#0f0f23'
    )
    
    # Start the application
    webview.start(
        debug=False,
        gui='qt' if sys.platform == 'darwin' else None
    )


if __name__ == '__main__':
    create_calculator()
