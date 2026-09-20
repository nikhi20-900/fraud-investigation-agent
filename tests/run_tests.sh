#!/usr/bin/env bash
set -e

echo "=== 1. Validating Synthetic Data Generator ==="
python3 data/generate_fraud_data.py

echo "=== 2. Running Graph & Backend Unit Tests ==="
cd backend
.venv/bin/python -m unittest discover -s tests -p "test_*.py"
cd ..

echo "=== 3. Validating Frontend Build ==="
cd frontend
npm run build
cd ..

echo "=== All Tests Passed Successfully! ==="
