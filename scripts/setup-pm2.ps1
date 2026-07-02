##############################################################################
# setup-pm2.ps1
# Run this ONCE on Overlord's machine to put the app under pm2 management.
# After this, pm2 will own the process and auto-deploy can restart it cleanly.
#
# Usage:
#   cd C:\Users\840_G8\Cursor\Overlord
#   .\scripts\setup-pm2.ps1
##############################################################################

$ErrorActionPreference = "Stop"
$ProjectDir = "C:\Users\840_G8\Cursor\Overlord"

Write-Host ""
Write-Host "==> Installing pm2 globally..." -ForegroundColor Cyan
npm install -g pm2

Write-Host ""
Write-Host "==> Installing pm2-windows-startup (survives reboots)..." -ForegroundColor Cyan
npm install -g pm2-windows-startup
pm2-startup install

Write-Host ""
Write-Host "==> Stopping any existing 'overlord' pm2 process (if any)..." -ForegroundColor Cyan
pm2 delete overlord 2>$null; $true   # ignore error if not found

Write-Host ""
Write-Host "==> Starting Overlord in dev mode under pm2..." -ForegroundColor Cyan
Set-Location $ProjectDir
pm2 start npm --name overlord -- run dev

Write-Host ""
Write-Host "==> Saving pm2 process list so it restarts after reboot..." -ForegroundColor Cyan
pm2 save

Write-Host ""
Write-Host "All done!" -ForegroundColor Green
Write-Host "  pm2 status        -- see all processes" -ForegroundColor DarkGray
Write-Host "  pm2 logs overlord -- tail logs" -ForegroundColor DarkGray
Write-Host "  pm2 stop overlord -- stop the app" -ForegroundColor DarkGray
