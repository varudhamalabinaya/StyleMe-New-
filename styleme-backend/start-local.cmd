@echo off
REM Start StyleMe backend locally (no global Maven required)
setlocal
cd /d "%~dp0"

if "%OPENAI_API_KEY%"=="" (
  echo ERROR: Set OPENAI_API_KEY before starting.
  echo   set OPENAI_API_KEY=your-key-here
  exit /b 1
)

if "%STYLEME_PUBLIC_BASE_URL%"=="" (
  set STYLEME_PUBLIC_BASE_URL=http://localhost:8080
)

netstat -ano | findstr /R /C:":8080 .*LISTENING" >nul 2>&1
if %ERRORLEVEL%==0 (
  echo ERROR: Port 8080 is already in use — likely a previous backend still running.
  echo Close the other terminal, or run in PowerShell:
  echo   Get-NetTCPConnection -LocalPort 8080 ^| %% { Stop-Process -Id $_.OwningProcess -Force }
  exit /b 1
)

call mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local" "-Dspring-boot.run.jvmArguments=-Dstyleme.public-base-url=%STYLEME_PUBLIC_BASE_URL%"
