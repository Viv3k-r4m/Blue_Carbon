#!/bin/bash

echo ""
echo "========================================"
echo "  Blue Carbon Admin GUI"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Check if required packages are installed
echo "Checking dependencies..."
python3 -c "import flask, web3" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing required packages..."
    pip install -r requirements.txt
fi

# Start the Flask app
echo ""
echo "Starting Blue Carbon Admin GUI..."
echo ""
echo "Access the interface at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 admin_gui.py
