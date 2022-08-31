#!/bin/bash
# ExoTool for QDAO
#
# Description: This script is called setting up a QRUCIAL DAO node
#
# Author: QDAO Team
# License: GNU AFFERO GENERAL PUBLIC LICENSE - Version 3, 19 November 2007

# Don't run as root
if [ "$EUID" -eq 0 ]
  then echo "You must not run this as root. Please apply basic hardening."
  exit
fi

# Dependency checks
type git >/dev/null || { echo >&2 "git is missing. please install it." ; exit 1;}
type cargo >/dev/null || { echo >&2 "cargo is missing. please install it." ; exit 1;}
type docker >/dev/null || { echo >&2 "docker is missing. please install it." ; exit 1;}
type python3 >/dev/null || { echo >&2 "python3 is missing. please install it." ; exit 1;}
type curl >/dev/null || { echo >&2 "curl is missing. please install it." ; exit 1;}
type tmux >/dev/null || { echo >&2 "tmux is missing. please install it." ; exit 1;}
type keccak256 >/dev/null || { echo >&2 "keccak256 is missing. please install it." ; exit 1;}

# If dep missing ask for install? TBA

# Get from git (later from IPFS?)
git clone https://github.com/Qrucial/QRUCIAL-DAO
cd QRUCIAL-DAO/qdao-node

# Build the node
cargo build

# Build ExoSys Daemon
cd ../exosysd/
cargo build
chmod +x target/debug/qdao-exosysd
cd ../

# Start the node in backgroundtmux
chomod +x target/debug/qdao-node
tmux new-session -d -s qdao-node './qdao-node/target/debug/qdao-node --dev'
sleep 7  # Wait for node start, TBA 

# Start ExoSys Daemon in background/tmux
tmux new-session -d -s qdao-exosysd './exosysd/target/debug/qdao-exosysd'

# Start the QDAO API
cd ..
tmux new-session -d -s qdao-api 'python3 exotools/lar.py'

# Print results
echo "Your local QDAO dev node has been prepared. Please check your tmux sessions: $ tmux ls"
