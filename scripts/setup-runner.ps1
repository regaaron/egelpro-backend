    <#
  scripts/setup-runner.ps1
  Automates download/configuration of a GitHub Actions self-hosted runner on Windows.
  Usage examples:
    # Use gh to request token automatically (gh must be installed and auth'd):
    .\scripts\setup-runner.ps1 -Repo "https://github.com/regaaron/egelpro-backend" -RunnerName "dev-windows-runner"

    # Provide a token explicitly and install as service with NSSM:
    .\scripts\setup-runner.ps1 -Repo "https://github.com/regaaron/egelpro-backend" -Token "<TOKEN>" -InstallService -NssmPath "C:\nssm\nssm.exe"
#>

param(
  [string]$Repo = "https://github.com/regaaron/egelpro-backend",
  [string]$Token = "",
  [string]$RunnerName = "dev-windows-runner",
  [string]$Labels = "self-hosted,windows,dev",
  [switch]$InstallService,
  [string]$NssmPath = "C:\\nssm\\nssm.exe"
)

Set-StrictMode -Version Latest

function Exit-WithMessage([string]$msg, [int]$code = 1) {
  Write-Host $msg
  exit $code
}

# If Token not provided, try to get via gh CLI
if ([string]::IsNullOrWhiteSpace($Token)) {
  if (Get-Command gh -ErrorAction SilentlyContinue) {
    Write-Host "Requesting registration token via 'gh'..."
    # Expect Repo like https://github.com/owner/repo
    $ownerRepo = $Repo -replace '^https://github.com/', ''
    $parts = $ownerRepo.Split('/')
    if ($parts.Length -lt 2) { Exit-WithMessage "Repo URL seems invalid: $Repo" }
    $owner = $parts[0]; $repo = $parts[1]
    $resp = gh api -X POST "/repos/$owner/$repo/actions/runners/registration-token" --jq .token
    if (-not $resp) { Exit-WithMessage "Failed to get token via gh." }
    $Token = $resp.Trim()
    Write-Host "Token retrieved via gh."
  } else {
    Exit-WithMessage "No token provided and 'gh' CLI not available. Provide -Token or install/authorize gh." 2
  }
}

# Prepare runner directory (next to script: ../actions-runner)
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$runnerDir = Join-Path $scriptRoot "..\actions-runner" | Resolve-Path -Relative
New-Item -ItemType Directory -Path $runnerDir -Force | Out-Null
Set-Location $runnerDir

# Download latest runner release for Windows x64
Write-Host "Querying GitHub for latest runner release..."
$release = Invoke-RestMethod -UseBasicParsing -Uri "https://api.github.com/repos/actions/runner/releases/latest"
$asset = $release.assets | Where-Object { $_.name -like 'actions-runner-win-x64-*.zip' } | Select-Object -First 1
if (-not $asset) { Exit-WithMessage "Could not find windows runner asset in latest release." }
$downloadUrl = $asset.browser_download_url
$zipFile = Join-Path $runnerDir 'actions-runner.zip'
Write-Host "Downloading runner $($asset.name) ..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile

Write-Host "Extracting..."
Expand-Archive -Path $zipFile -DestinationPath $runnerDir -Force

# Configure the runner
Write-Host "Configuring runner in $runnerDir ..."
$configureCmd = Join-Path $runnerDir 'config.cmd'
& $configureCmd --url $Repo --token $Token --name $RunnerName --work _work --labels $Labels --unattended

if ($InstallService) {
  if (-not (Test-Path $NssmPath)) {
    Write-Host "NSSM not found at $NssmPath. Attempting to download NSSM..."
    $tmp = Join-Path $env:TEMP "nssm-download"
    New-Item -ItemType Directory -Path $tmp -Force | Out-Null
    $nssmZip = Join-Path $tmp 'nssm.zip'
    # Try known release URL (kohsuke mirror). If this changes in the future, update the URL.
    $nssmUrl = 'https://github.com/kohsuke/nssm/releases/download/2.24/nssm-2.24.zip'
    try {
      Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip -UseBasicParsing
      Expand-Archive -Path $nssmZip -DestinationPath $tmp -Force
      # Search for nssm.exe in extracted folders
      $found = Get-ChildItem -Path $tmp -Recurse -Filter 'nssm.exe' | Select-Object -First 1
      if ($found) {
        $NssmPath = $found.FullName
        Write-Host "Found nssm at $NssmPath"
      } else {
        Exit-WithMessage "Downloaded NSSM but could not find nssm.exe inside the archive. Please install NSSM manually." 4
      }
    } catch {
      Exit-WithMessage "Failed to download or extract NSSM: $_" 5
    }
  }
  Write-Host "Installing runner as Windows service using NSSM ($NssmPath)..."
  & $NssmPath install $RunnerName (Join-Path $runnerDir 'run.cmd')
  & $NssmPath set $RunnerName AppDirectory $runnerDir
  & $NssmPath start $RunnerName
  Write-Host "Service '$RunnerName' installed and started."
} else {
  Write-Host "Runner configured. To run interactively, execute:"
  Write-Host "  Set-Location '$runnerDir'"
  Write-Host "  .\\run.cmd"
}

Write-Host "Done. Check GitHub repository Settings -> Actions -> Runners to verify the runner shows as online." 
