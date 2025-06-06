#!/usr/bin/env bash
# Setup script for the MJD Automation project
# Checks for internet connectivity and installs Node.js dependencies
set -euo pipefail

check_internet() {
  echo "Checking internet connection..."
  if curl -s https://registry.npmjs.org >/dev/null; then
    echo "Internet connection available."
  else
    echo "No internet connection. Please connect and retry." >&2
    exit 1
  fi
}

install_node() {
  if ! command -v node >/dev/null; then
    echo "Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
  fi
}

install_dependencies() {
  echo "Installing backend dependencies..."
  (cd backend && npm install)

  echo "Installing frontend dependencies..."
  (cd frontend && npm install)
}

check_internet
install_node
install_dependencies

echo "Setup complete."
