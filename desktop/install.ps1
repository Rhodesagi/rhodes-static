# RHODES DESKTOP MINI - Windows Installer
Write-Host ''
Write-Host '  RHODES DESKTOP MINI - Windows Installer' -ForegroundColor Cyan
Write-Host ''

$InstallDir = "$env:USERPROFILE\.rhodes-desktop"
$BinDir = "$env:USERPROFILE\.local\bin"

Write-Host '[1/4] Creating directories...'
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

Write-Host '[2/4] Downloading agent...'
Invoke-WebRequest -Uri 'https://rhodesagi.com/desktop/rhodes-windows.py' -OutFile "$InstallDir\rhodes_agent.py"

Write-Host '[3/4] Creating launcher...'
@'
@echo off
cd /d "%~dp0"
python rhodes_agent.py %*
'@ | Out-File -FilePath "$InstallDir\rhodes.bat" -Encoding ASCII

# Add to PATH if not already there
$UserPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($UserPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable('Path', "$UserPath;$InstallDir", 'User')
    Write-Host '  Added to PATH (restart terminal to use)'
}

Write-Host '[4/4] Installing dependencies...'
pip install websockets pyautogui mss pillow -q 2>$null
if ($LASTEXITCODE -ne 0) {
    python -m pip install websockets pyautogui mss pillow -q 2>$null
}

Write-Host ''
Write-Host 'Installation complete!' -ForegroundColor Green
Write-Host ''
Write-Host 'Run: rhodes' -ForegroundColor Yellow
Write-Host '(Or restart terminal first if rhodes not found)'
Write-Host ''
