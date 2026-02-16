@echo off
echo.
echo ========================================
echo  Blue Carbon Admin GUI
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if required packages are installed
echo Checking dependencies...
python -c "import flask, web3" >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    pip install -r requirements.txt
)

REM Start the Flask app
echo.
echo Starting Blue Carbon Admin GUI...
echo.
echo Access the interface at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

python admin_gui.py
pause
