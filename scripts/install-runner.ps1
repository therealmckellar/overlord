##############################################################################
# install-runner.ps1
# Run this ONCE on Overlord's machine to register it as a GitHub Actions
# self-hosted runner for therealmckellar/overlord.
#
# BEFORE running this script:
# 1. Go to: https://github.com/therealmckellar/overlord/settings/actions/runners
# 2. Click "New self-hosted runner"
# 3. Choose: Windows | x64
# 4. Copy the --token value from the "Configure" section
# 5. Run this script:
#
#   cd C:\Users\840_G8\Cursor\Overlord
#   .\scripts\install-runner.ps1 -Token YOUR_TOKEN_HERE
##############################################################################

param(
    [Parameter(Mandatory = $true, HelpMessage = "Runner registration token from GitHub")]
    [string]$Token
)

$ErrorActionPreference = "Stop"
$RunnerDir  = "C:\actions-runner"
$RunnerZip  = "$RunnerDir\actions-runner.zip"
# Keep this version in sync with https://github.com/actions/runner/releases
$RunnerVer  = "2.323.0"
$RunnerUrl  = "https://github.com/actions/runner/releases/download/v$RunnerVer/actions-runner-win-x64-$RunnerVer.zip"

Write-Host ""
Write-Host "==> Creating runner directory: $RunnerDir" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $RunnerDir | Out-Null
Set-Location $RunnerDir

Write-Host "==> Downloading GitHub Actions runner v$RunnerVer..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $RunnerUrl -OutFile $RunnerZip -UseBasicParsing

Write-Host "==> Extracting..." -ForegroundColor Cyan
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($RunnerZip, $RunnerDir)
Remove-Item $RunnerZip -Force

Write-Host "==> Configuring runner..." -ForegroundColor Cyan
# Label 'overlord' matches the runs-on in deploy.yml
.\config.cmd `
    --url   "https://github.com/therealmckellar/overlord" `
    --token "$Token" `
    --name  "overlord-host" `
    --labels "self-hosted,windows,overlord" `
    --work  "_work" `
    --unattended

Write-Host ""
Write-Host "==> Installing runner as a Windows Service (auto-starts on reboot)..." -ForegroundColor Cyan
.\svc.cmd install
.\svc.cmd start

Write-Host ""
Write-Host "Runner is live!" -ForegroundColor Green
Write-Host "Check: https://github.com/therealmckellar/overlord/settings/actions/runners" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Next step: run .\scripts\setup-pm2.ps1 to put the app under pm2." -ForegroundColor Yellow
