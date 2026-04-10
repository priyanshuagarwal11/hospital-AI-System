#!/usr/bin/env python3
"""
============================================================
generate_datasets.py
Standalone script to generate all 4 CSV training datasets.
Run: python generate_datasets.py
Output: ./datasets/ folder with 4 CSV files
============================================================
"""

import sys
import os

# Add ai-service to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai-service'))

from utils.data_generator import generate_all_datasets

if __name__ == '__main__':
    output_dir = os.path.join(os.path.dirname(__file__), 'datasets')
    print("🏥 Hospital AI System – Dataset Generator")
    print("=" * 45)
    paths = generate_all_datasets(output_dir)
    print("\n📂 Files created:")
    for name, path in paths.items():
        size = os.path.getsize(path)
        print(f"  {name:25s} → {path} ({size:,} bytes)")
    print("\n✅ Done! Use these CSVs for AI model training.")
