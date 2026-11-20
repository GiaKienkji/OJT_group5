@echo off
setlocal
cd /d "%~dp0"

set "DOTNET_EXE=%USERPROFILE%\.dotnet\dotnet.exe"
if not exist "%DOTNET_EXE%" (
  echo .NET 8 SDK not found at %DOTNET_EXE%.
  exit /b 1
)
echo Using dotnet: %DOTNET_EXE%

if not exist ".env" (
  echo Missing .env. Copy .env.example to .env and set ConnectionStrings__DefaultConnection.
  exit /b 1
)
for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do set "%%A=%%B"
if "!ConnectionStrings__DefaultConnection!"=="" (
  echo ConnectionStrings__DefaultConnection is empty in .env.
  exit /b 1
)
set "ASPNETCORE_ENVIRONMENT=Development"
set "ASPNETCORE_URLS=http://localhost:5062"

echo Starting backend on http://localhost:5062
start "SOMS Backend" cmd /k "cd /d ""%~dp0backend"" && ""%DOTNET_EXE%"" run --project SOMS.Api\SOMS.Api.csproj"
echo Starting frontend on http://localhost:5173
start "SOMS Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev -- --host 0.0.0.0"
