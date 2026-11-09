#!/usr/bin/env python3
"""
ANALYST Agent v5.0.0 — Customizable Bolivia Remote Job Evaluator & On-the-Fly Results Generator
Evaluates opportunities dynamically based on user-selectable filters (Languages, Position Type,
Experience Level, Contract Modality, and 100% Remote from Bolivia eligibility).
"""

import argparse
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


def build_static_html() -> None:
    subprocess.run(["npm", "run", "build-html"], cwd=str(BASE_DIR), check=False, shell=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bolivia Remote Evaluator v5.0.0")
    parser.add_argument("--build-html", action="store_true", help="Rebuild self-contained index.html")
    args = parser.parse_args()
    build_static_html()
