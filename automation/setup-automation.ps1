# Laptop Comparison Scraping Automation Setup Script for Windows PowerShell
# This script sets up scheduled tasks for automated scraping

param(
    [switch]$Force,
    [string]$ServerUrl = "http://localhost:8080"
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$TaskName = "LaptopScrapingAutomation"

# Function to write colored output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green @args }
function Write-Error { Write-ColorOutput Red @args }
function Write-Warning { Write-ColorOutput Yellow @args }
function Write-Info { Write-ColorOutput Cyan @args }

Write-Info "=== Laptop Comparison Scraping Automation Setup ==="
Write-Info ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator."
    Write-Warning "Please right-click PowerShell and 'Run as Administrator'"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Success "Running as Administrator"

# Check Node.js
Write-Info "Checking dependencies..."
try {
    $nodeVersion = node --version
    Write-Success "Node.js found: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed or not in PATH"
    Write-Info "Please install Node.js from: https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm found: $npmVersion"
} catch {
    Write-Error "npm is not available"
    Read-Host "Press Enter to exit"
    exit 1
}

# Create directories
Write-Info "Setting up directories..."
$directories = @(
    "$ScriptDir\logs",
    "$ProjectDir\server\Data",
    "$ProjectDir\Scrapping\backups"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Info "Created directory: $dir"
    }
}

# Install dependencies
Write-Info "Installing automation dependencies..."
Push-Location $ScriptDir
try {
    npm install
    Write-Success "Dependencies installed successfully"
} catch {
    Write-Error "Failed to install dependencies"
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Pop-Location

# Create environment file
$envFile = "$ScriptDir\.env"
if (-not (Test-Path $envFile)) {
    Write-Info "Creating environment file..."
    Copy-Item "$ScriptDir\.env.example" $envFile
    Write-Warning "Please edit .env file to configure your settings"
    Write-Info "Environment file created: $envFile"
} else {
    Write-Info "Environment file already exists: $envFile"
}

# Create PowerShell wrapper script
Write-Info "Creating PowerShell wrapper script..."
$wrapperScript = "$ScriptDir\run-scraping.ps1"

$wrapperContent = @"
# Laptop Scraping Scheduled Task Wrapper (PowerShell)
param()

# Set location
Set-Location "$ScriptDir"

# Setup logging
`$LogDate = Get-Date -Format "yyyy-MM-dd"
`$LogFile = "logs\task-`$LogDate.log"
`$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Function to log messages
function Write-Log(`$Message) {
    `$LogEntry = "`$Timestamp - `$Message"
    Add-Content -Path `$LogFile -Value `$LogEntry
    Write-Output `$LogEntry
}

Write-Log "Starting scheduled scraping..."

# Load environment variables if .env exists
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if (`$_ -match "^([^#][^=]*?)=(.*)$") {
            [Environment]::SetEnvironmentVariable(`$matches[1], `$matches[2], "Process")
        }
    }
}

# Run the scraping script
try {
    `$process = Start-Process -FilePath "node" -ArgumentList "scrape-scheduler.js" -Wait -PassThru -RedirectStandardOutput "temp-stdout.log" -RedirectStandardError "temp-stderr.log"
    
    # Append output to main log
    if (Test-Path "temp-stdout.log") {
        Get-Content "temp-stdout.log" | Add-Content -Path `$LogFile
        Remove-Item "temp-stdout.log"
    }
    
    if (Test-Path "temp-stderr.log") {
        Get-Content "temp-stderr.log" | Add-Content -Path `$LogFile
        Remove-Item "temp-stderr.log"
    }
    
    if (`$process.ExitCode -eq 0) {
        Write-Log "Scraping completed successfully"
    } else {
        Write-Log "Scraping failed with exit code `$(`$process.ExitCode)"
    }
    
    # Cleanup old logs (keep last 30 days)
    Get-ChildItem -Path "logs" -Name "task-*.log" | Where-Object {
        `$fileDate = [DateTime]::ParseExact((`$_ -replace "task-|\.log"), "yyyy-MM-dd", `$null)
        `$fileDate -lt (Get-Date).AddDays(-30)
    } | ForEach-Object {
        Remove-Item "logs\`$_" -Force
        Write-Log "Deleted old log: `$_"
    }
    
    exit `$process.ExitCode
    
} catch {
    Write-Log "Error running scraping script: `$(`$_.Exception.Message)"
    exit 1
}
"@

$wrapperContent | Out-File -FilePath $wrapperScript -Encoding UTF8
Write-Success "PowerShell wrapper script created: $wrapperScript"

# Create batch wrapper for Task Scheduler (since Task Scheduler works better with .bat files)
$batchWrapper = "$ScriptDir\run-scraping.bat"
$batchContent = @"
@echo off
cd /d "$ScriptDir"
powershell.exe -ExecutionPolicy Bypass -File "run-scraping.ps1"
"@
$batchContent | Out-File -FilePath $batchWrapper -Encoding ASCII
Write-Success "Batch wrapper created: $batchWrapper"

# Remove existing scheduled task if it exists
Write-Info "Setting up scheduled task..."
try {
    $existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        if ($Force) {
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
            Write-Info "Removed existing scheduled task"
        } else {
            Write-Warning "Scheduled task '$TaskName' already exists. Use -Force to overwrite."
            Read-Host "Press Enter to continue"
            exit 1
        }
    }
} catch {
    # Task doesn't exist, which is fine
}

# Create new scheduled task
$action = New-ScheduledTaskAction -Execute $batchWrapper
$trigger = New-ScheduledTaskTrigger -Daily -DaysInterval 3 -At "2:00 AM"
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Automated laptop data scraping and database update"
    Write-Success "Scheduled task created successfully"
    Write-Info "Task will run every 3 days at 2:00 AM"
} catch {
    Write-Error "Failed to create scheduled task: $($_.Exception.Message)"
    Read-Host "Press Enter to exit"
    exit 1
}

# Create monitoring script
Write-Info "Creating monitoring script..."
$monitorScript = "$ScriptDir\monitor-scraping.ps1"

$monitorContent = @"
# Laptop Scraping Automation Monitoring Script
param()

Write-Host "=== Laptop Scraping Automation Status ===" -ForegroundColor Cyan
Write-Host ""

# Check scheduled task
Write-Host "Scheduled Task Status:" -ForegroundColor Yellow
try {
    `$task = Get-ScheduledTask -TaskName "$TaskName" -ErrorAction Stop
    `$taskInfo = Get-ScheduledTaskInfo -TaskName "$TaskName"
    
    Write-Host "✅ Task is configured" -ForegroundColor Green
    Write-Host "   State: `$(`$task.State)" -ForegroundColor White
    Write-Host "   Last Run: `$(`$taskInfo.LastRunTime)" -ForegroundColor White
    Write-Host "   Next Run: `$(`$taskInfo.NextRunTime)" -ForegroundColor White
    Write-Host "   Last Result: `$(`$taskInfo.LastTaskResult)" -ForegroundColor White
} catch {
    Write-Host "❌ Task not found" -ForegroundColor Red
}

Write-Host ""

# Check recent logs
Write-Host "Recent Activity:" -ForegroundColor Yellow
if (Test-Path "$ScriptDir\logs") {
    `$latestLog = Get-ChildItem "$ScriptDir\logs\task-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (`$latestLog) {
        Write-Host "Latest log: `$(`$latestLog.Name)" -ForegroundColor White
        Write-Host "Last modified: `$(`$latestLog.LastWriteTime)" -ForegroundColor White
        Write-Host "Last 10 lines:" -ForegroundColor White
        Get-Content `$latestLog.FullName -Tail 10 | ForEach-Object { Write-Host "   `$_" -ForegroundColor Gray }
    } else {
        Write-Host "No task logs found" -ForegroundColor Gray
    }
} else {
    Write-Host "Log directory not found" -ForegroundColor Gray
}

Write-Host ""

# Check data files
Write-Host "Data Files Status:" -ForegroundColor Yellow
`$dataFiles = @(
    "$ProjectDir\server\Data\final_laptops.json",
    "$ProjectDir\server\Data\matched_laptops.json"
)

foreach (`$file in `$dataFiles) {
    if (Test-Path `$file) {
        `$fileInfo = Get-Item `$file
        `$size = if (`$fileInfo.Length -gt 1MB) { "{0:N1} MB" -f (`$fileInfo.Length / 1MB) } else { "{0:N0} KB" -f (`$fileInfo.Length / 1KB) }
        Write-Host "✅ `$(Split-Path `$file -Leaf): `$size (modified: `$(`$fileInfo.LastWriteTime))" -ForegroundColor Green
    } else {
        Write-Host "❌ `$(Split-Path `$file -Leaf): Not found" -ForegroundColor Red
    }
}

Write-Host ""

# Check server status
Write-Host "Server Status:" -ForegroundColor Yellow
try {
    `$response = Invoke-WebRequest -Uri "$ServerUrl/api/check-auth" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Server is running (HTTP `$(`$response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not responding" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to continue"
"@

$monitorContent | Out-File -FilePath $monitorScript -Encoding UTF8
Write-Success "Monitoring script created: $monitorScript"

# Create uninstall script
Write-Info "Creating uninstall script..."
$uninstallScript = "$ScriptDir\uninstall-automation.ps1"

$uninstallContent = @"
# Laptop Scraping Automation Uninstall Script
param([switch]`$Force)

Write-Host "=== Uninstalling Laptop Scraping Automation ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
`$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not `$isAdmin) {
    Write-Host "This script must be run as Administrator." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Remove scheduled task
Write-Host "Removing scheduled task..." -ForegroundColor Yellow
try {
    `$task = Get-ScheduledTask -TaskName "$TaskName" -ErrorAction Stop
    Unregister-ScheduledTask -TaskName "$TaskName" -Confirm:(-not `$Force)
    Write-Host "✅ Scheduled task removed" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No scheduled task found" -ForegroundColor Yellow
}

Write-Host ""

# Ask about removing data
if (-not `$Force) {
    `$removeData = Read-Host "Do you want to remove logs and backup data? (y/N)"
} else {
    `$removeData = "n"
}

if (`$removeData -eq "y" -or `$removeData -eq "Y") {
    if (Test-Path "$ScriptDir\logs") {
        Remove-Item "$ScriptDir\logs" -Recurse -Force
        Write-Host "✅ Logs removed" -ForegroundColor Green
    }
    if (Test-Path "$ProjectDir\Scrapping\backups") {
        Remove-Item "$ProjectDir\Scrapping\backups" -Recurse -Force
        Write-Host "✅ Backups removed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Automation uninstalled successfully" -ForegroundColor Green
Write-Host "Note: The main scraping scripts and data files are preserved" -ForegroundColor Yellow
Write-Host ""

if (-not `$Force) {
    Read-Host "Press Enter to continue"
}
"@

$uninstallContent | Out-File -FilePath $uninstallScript -Encoding UTF8
Write-Success "Uninstall script created: $uninstallScript"

# Test the setup
Write-Info "Testing the setup..."
try {
    $testResult = node --check "$ScriptDir\scrape-scheduler.js"
    Write-Success "Scraping script syntax is valid"
} catch {
    Write-Error "Scraping script has syntax errors"
    Write-Error $_.Exception.Message
    Read-Host "Press Enter to exit"
    exit 1
}

# Display summary
Write-Host ""
Write-Success "=== Setup Complete ==="
Write-Host ""
Write-Success "Laptop scraping automation has been configured successfully!" 
Write-Host ""
Write-Info "📋 Summary:"
Write-Host "  • Scheduled task configured to run every 3 days at 2:00 AM"
Write-Host "  • Logs will be stored in: $ScriptDir\logs\"
Write-Host "  • Data will be updated in: $ProjectDir\server\Data\"
Write-Host ""
Write-Info "🔧 Management Commands:"
Write-Host "  • Monitor status: powershell -File `"$monitorScript`""
Write-Host "  • View tasks: Get-ScheduledTask -TaskName '$TaskName'"
Write-Host "  • Run manually: powershell -File `"$wrapperScript`""
Write-Host "  • Uninstall: powershell -File `"$uninstallScript`""
Write-Host ""
Write-Info "📁 Files Created:"
Write-Host "  • $ScriptDir\scrape-scheduler.js (main script)"
Write-Host "  • $wrapperScript (PowerShell wrapper)"
Write-Host "  • $batchWrapper (batch wrapper)"
Write-Host "  • $monitorScript (monitoring)"
Write-Host "  • $ScriptDir\.env (configuration)"
Write-Host ""
Write-Warning "⚠️  Important Notes:"
Write-Host "  • Make sure your server is running before the scheduled time"
Write-Host "  • Check logs regularly for any issues"
Write-Host "  • Configure notifications in .env file"
Write-Host "  • The first run is scheduled for the next occurrence"
Write-Host ""
Write-Warning "To run immediately for testing:"
Write-Host "powershell -File `"$wrapperScript`""
Write-Host ""

Read-Host "Press Enter to finish"
