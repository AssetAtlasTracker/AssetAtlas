@echo off
setlocal enabledelayedexpansion

echo Running GHCR build and push script...

:: Check if parameters are provided
if "%~1"=="" (
    echo ERROR: GitHub organization or username not provided
    echo Usage: %0 ^<github_org_or_username^> [repository_name]
    echo Example for organization: %0 AssetAtlasTracker AssetAtlas
    echo Example for personal repo: %0 your-github-username assetatlas
    exit /b 1
)

:: Determine the current directory and script location
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_NAME=build-and-push-ghcr.sh"
set "FULL_SCRIPT_PATH=%SCRIPT_DIR%%SCRIPT_NAME%"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
cd /d "%PROJECT_ROOT%"

:: Adjust path for WSL
set "WSL_SCRIPT_PATH=%SCRIPT_NAME%"
if exist "%SCRIPT_DIR%%SCRIPT_NAME%" (
    echo Found script at: %SCRIPT_DIR%%SCRIPT_NAME%
) else (
    echo ERROR: Could not find %SCRIPT_NAME% in %SCRIPT_DIR%
    exit /b 1
)

:: Check if WSL is available
where wsl >nul 2>&1
if %errorlevel% equ 0 (
    echo Using WSL to run bash script...
    cd "%SCRIPT_DIR%"
    wsl bash "./%SCRIPT_NAME%" %*
    goto :end
)

:: Check if Git Bash is installed in common location
if exist "C:\Program Files\Git\bin\bash.exe" (
    echo Using Git Bash to run script...
    cd "%SCRIPT_DIR%"
    "C:\Program Files\Git\bin\bash.exe" "./%SCRIPT_NAME%" %*
    goto :end
)

:: If neither WSL nor Git Bash was found
echo ERROR: Could not find bash. Please install WSL or Git Bash.
echo Or manually run: bash "%SCRIPT_NAME%" %*
exit /b 1

:end
exit /b %errorlevel%
