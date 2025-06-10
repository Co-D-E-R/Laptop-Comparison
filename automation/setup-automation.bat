@echo off
REM Laptop Comparison Scraping Automation Setup Script for Windows
REM This script sets up scheduled tasks for automated scraping

setlocal enabledelayedexpansion

REM Configuration
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%..\"
set "NODE_PATH="
set "TASK_NAME=LaptopScrapingAutomation"

REM Colors for output
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

echo %BLUE%Laptop Comparison Scraping Automation Setup%NC%
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo %YELLOW%Running as administrator%NC%
) else (
    echo %RED%This script should be run as administrator for proper setup%NC%
    echo %YELLOW%Please right-click and "Run as administrator"%NC%
    pause
    exit /b 1
)

REM Find Node.js
echo %BLUE%Checking dependencies...%NC%
for %%i in (node.exe) do set "NODE_PATH=%%~$PATH:i"
if not defined NODE_PATH (
    echo %RED%Node.js is not installed or not in PATH%NC%
    echo Please install Node.js first: https://nodejs.org/
    pause
    exit /b 1
)

echo %GREEN%Node.js found: %NODE_PATH%%NC%

REM Check npm
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%npm is not available%NC%
    pause
    exit /b 1
)

echo %GREEN%npm is available%NC%

REM Create directories
echo %BLUE%Setting up directories...%NC%
if not exist "%SCRIPT_DIR%logs" mkdir "%SCRIPT_DIR%logs"
if not exist "%PROJECT_DIR%server\Data" mkdir "%PROJECT_DIR%server\Data"
if not exist "%PROJECT_DIR%Scrapping\backups" mkdir "%PROJECT_DIR%Scrapping\backups"

REM Install dependencies
echo %BLUE%Installing automation dependencies...%NC%
cd /d "%SCRIPT_DIR%"
call npm install

REM Create environment file
if not exist "%SCRIPT_DIR%.env" (
    echo %BLUE%Creating environment file...%NC%
    copy "%SCRIPT_DIR%.env.example" "%SCRIPT_DIR%.env"
    echo %YELLOW%Please edit .env file to configure your settings%NC%
)

REM Create batch wrapper script
echo %BLUE%Creating batch wrapper script...%NC%
set "WRAPPER_SCRIPT=%SCRIPT_DIR%run-scraping.bat"

(
echo @echo off
echo REM Laptop Scraping Scheduled Task Wrapper
echo.
echo cd /d "%SCRIPT_DIR%"
echo.
echo REM Load environment and run scraping
echo set LOG_FILE=logs\task-%%date:~-4,4%%%%date:~-10,2%%%%date:~-7,2%%.log
echo echo %%date%% %%time%% - Starting scheduled scraping... ^>^> "%%LOG_FILE%%"
echo.
echo "%NODE_PATH%" scrape-scheduler.js ^>^> "%%LOG_FILE%%" 2^>^&1
echo.
echo if %%errorlevel%% equ 0 ^(
echo     echo %%date%% %%time%% - Scraping completed successfully ^>^> "%%LOG_FILE%%"
echo ^) else ^(
echo     echo %%date%% %%time%% - Scraping failed with exit code %%errorlevel%% ^>^> "%%LOG_FILE%%"
echo ^)
echo.
echo REM Cleanup old logs ^(keep last 30 days^)
echo forfiles /p logs /c "cmd /c Del @path" /m task-*.log /d -30 2^>nul
) > "%WRAPPER_SCRIPT%"

REM Create scheduled task
echo %BLUE%Creating scheduled task...%NC%

REM Delete existing task if it exists
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

REM Create new scheduled task (every 3 days at 2 AM)
schtasks /create /tn "%TASK_NAME%" /tr "\"%WRAPPER_SCRIPT%\"" /sc daily /mo 3 /st 02:00 /ru "SYSTEM" /rl highest /f

if %errorLevel% equ 0 (
    echo %GREEN%Scheduled task created successfully%NC%
    echo Task will run every 3 days at 2:00 AM
) else (
    echo %RED%Failed to create scheduled task%NC%
    pause
    exit /b 1
)

REM Create monitoring script
echo %BLUE%Creating monitoring script...%NC%
set "MONITOR_SCRIPT=%SCRIPT_DIR%monitor-scraping.bat"

(
echo @echo off
echo echo === Laptop Scraping Automation Status ===
echo echo.
echo.
echo echo Scheduled Task Status:
echo schtasks /query /tn "%TASK_NAME%" /fo table /nh 2^>nul
echo if %%errorlevel%% equ 0 ^(
echo     echo Task is configured
echo ^) else ^(
echo     echo Task not found
echo ^)
echo echo.
echo.
echo echo Recent Activity:
echo if exist "%SCRIPT_DIR%logs" ^(
echo     echo Latest log files:
echo     dir /od /b "%SCRIPT_DIR%logs\task-*.log" 2^>nul ^| findstr /v "^$"
echo     echo.
echo     echo Last 10 lines of latest log:
echo     for /f %%i in ^('dir /od /b "%SCRIPT_DIR%logs\task-*.log" 2^>nul ^| findstr /v "^$"'^) do set "LATEST=%%i"
echo     if defined LATEST ^(
echo         powershell "Get-Content '%SCRIPT_DIR%logs\!LATEST!' -Tail 10"
echo     ^)
echo ^) else ^(
echo     echo No logs directory found
echo ^)
echo echo.
echo.
echo echo Data Files Status:
echo if exist "%PROJECT_DIR%server\Data\final_laptops.json" ^(
echo     echo final_laptops.json: Found
echo ^) else ^(
echo     echo final_laptops.json: Not found
echo ^)
echo if exist "%PROJECT_DIR%server\Data\matched_laptops.json" ^(
echo     echo matched_laptops.json: Found
echo ^) else ^(
echo     echo matched_laptops.json: Not found
echo ^)
echo echo.
echo.
echo echo Server Status:
echo curl -s "http://localhost:8080/api/check-auth" ^>nul 2^>^&1
echo if %%errorlevel%% equ 0 ^(
echo     echo Server is running
echo ^) else ^(
echo     echo Server is not responding
echo ^)
echo.
echo pause
) > "%MONITOR_SCRIPT%"

REM Create uninstall script
echo %BLUE%Creating uninstall script...%NC%
set "UNINSTALL_SCRIPT=%SCRIPT_DIR%uninstall-automation.bat"

(
echo @echo off
echo echo === Uninstalling Laptop Scraping Automation ===
echo echo.
echo.
echo echo Removing scheduled task...
echo schtasks /delete /tn "%TASK_NAME%" /f
echo if %%errorlevel%% equ 0 ^(
echo     echo Scheduled task removed successfully
echo ^) else ^(
echo     echo No scheduled task found
echo ^)
echo echo.
echo.
echo set /p "REMOVE_DATA=Do you want to remove logs and backup data? (y/N): "
echo if /i "%%REMOVE_DATA%%"=="y" ^(
echo     rmdir /s /q "%SCRIPT_DIR%logs" 2^>nul
echo     rmdir /s /q "%PROJECT_DIR%Scrapping\backups" 2^>nul
echo     echo Logs and backups removed
echo ^)
echo echo.
echo echo Automation uninstalled successfully
echo echo Note: The main scraping scripts and data files are preserved
echo echo.
echo pause
) > "%UNINSTALL_SCRIPT%"

REM Test the setup
echo %BLUE%Testing the setup...%NC%
"%NODE_PATH%" --check "%SCRIPT_DIR%scrape-scheduler.js"
if %errorLevel% equ 0 (
    echo %GREEN%Scraping script syntax is valid%NC%
) else (
    echo %RED%Scraping script has syntax errors%NC%
    pause
    exit /b 1
)

REM Display summary
echo.
echo %GREEN%=== Setup Complete ===%NC%
echo.
echo %GREEN%Laptop scraping automation has been configured successfully!%NC%
echo.
echo Management Commands:
echo   • Monitor status: "%MONITOR_SCRIPT%"
echo   • View tasks: schtasks /query /tn "%TASK_NAME%"
echo   • Run manually: "%WRAPPER_SCRIPT%"
echo   • Uninstall: "%UNINSTALL_SCRIPT%"
echo.
echo Files Created:
echo   • %SCRIPT_DIR%scrape-scheduler.js (main script)
echo   • %WRAPPER_SCRIPT% (task wrapper)
echo   • %MONITOR_SCRIPT% (monitoring)
echo   • %SCRIPT_DIR%.env (configuration)
echo.
echo Important Notes:
echo   • Task runs every 3 days at 2:00 AM
echo   • Make sure your server is running before scheduled time
echo   • Check logs regularly for any issues
echo   • Configure notifications in .env file
echo.
echo %YELLOW%To run immediately for testing: "%WRAPPER_SCRIPT%"%NC%
echo.
pause
