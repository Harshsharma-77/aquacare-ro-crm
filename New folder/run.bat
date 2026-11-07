@echo off
echo Installing requirements...
pip install -r backend\requirements.txt

echo Starting the Static Code Analyzer Server...
echo Please open http://localhost:8000/ in your browser once the server starts.
python backend\app.py
pause
