@echo off
REM MTN IN Operations Portal - Setup Verification Script (Windows)

echo =========================================
echo MTN IN Operations Portal Setup
echo =========================================
echo.

REM Check Node.js version
echo Checking Node.js version...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    node -v
    echo Node.js is installed
) else (
    echo Node.js not found! Please install Node.js 18+ or 20+
    pause
    exit /b 1
)

REM Check npm version
echo Checking npm version...
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    npm -v
    echo npm is installed
) else (
    echo npm not found!
    pause
    exit /b 1
)

echo.
echo =========================================
echo Checking project files...
echo =========================================
echo.

if exist "package.json" (echo Found: package.json) else (echo MISSING: package.json)
if exist "vite.config.ts" (echo Found: vite.config.ts) else (echo MISSING: vite.config.ts)
if exist "tsconfig.json" (echo Found: tsconfig.json) else (echo MISSING: tsconfig.json)
if exist "tailwind.config.js" (echo Found: tailwind.config.js) else (echo MISSING: tailwind.config.js)
if exist "src\main.tsx" (echo Found: src\main.tsx) else (echo MISSING: src\main.tsx)
if exist "src\App.tsx" (echo Found: src\App.tsx) else (echo MISSING: src\App.tsx)
if exist "src\index.css" (echo Found: src\index.css) else (echo MISSING: src\index.css)

echo.
echo Checking component files...
if exist "src\components\user-support\charging-profile\OffersTab.tsx" (
    echo Found: OffersTab.tsx
) else (
    echo MISSING: OffersTab.tsx
    echo Please copy OffersTab.tsx from the outputs directory to:
    echo src\components\user-support\charging-profile\OffersTab.tsx
)

if exist "src\components\common\Sidebar.tsx" (echo Found: Sidebar.tsx) else (echo MISSING: Sidebar.tsx)

echo.
echo =========================================
echo Next Steps:
echo =========================================
echo.
echo 1. Copy OffersTab.tsx to correct location if missing
echo 2. Install dependencies: npm install
echo 3. Start development server: npm run dev
echo 4. Open browser to: http://localhost:5173
echo.
echo =========================================

pause