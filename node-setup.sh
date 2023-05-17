#!/bin/bash
# ExoTool for QDAO
#
# Description: This script is called setting up a QRUCIAL DAO node
#
# Author: QDAO Team
# License: GNU AFFERO GENERAL PUBLIC LICENSE - Version 3, 19 November 2007

# Don't run as root
if [ "$EUID" -eq 0 ]
  then echo "You must not run this as root. Please apply basic hardening and create the qdao user."
  exit
fi

# Dependency checks
type git >/dev/null || { echo >&2 "git is missing. Please install it." ; exit 1;}
type cargo >/dev/null || { echo >&2 "cargo is missing. Please install it." ; exit 1;}
type docker >/dev/null || { echo >&2 "docker is missing. Please install it." ; exit 1;}
type python3 >/dev/null || { echo >&2 "python3 is missing. Please install it." ; exit 1;}
type curl >/dev/null || { echo >&2 "curl is missing. Please install it." ; exit 1;}
type tmux >/dev/null || { echo >&2 "tmux is missing. Please install it." ; exit 1;}
type keccak256 >/dev/null || { echo >&2 "keccak256 is missing. Please install it." ; exit 1;}
type gcc >/dev/null || { echo >&2 "gcc is missing. Please install it." ; exit 1;}
type make >/dev/null || { echo >&2 "make is missing. Please install it." ; exit 1;}

# Get from git (later from IPFS?)
cd ~
git clone https://github.com/Qrucial/QRUCIAL-DAO
cd QRUCIAL-DAO/qdao-node
git checkout milestone2

# Build the node
cargo build

# Build ExoSys Daemon
cd ../exosysd/
cargo build
chmod +x target/debug/qdao-exosysd
cd ../

# Start the node in backgroundtmux
chmod +x ./qdao-node/target/debug/qdao-node
tmux new-session -d -s qdao-node './qdao-node/target/debug/qdao-node --dev'
sleep 5  # Wait for node start, TBA

# Start ExoSys Daemon in background/tmux
cd exosysd/target/debug/
tmux new-session -d -s qdao-exosysd './qdao-exosysd'

# Start the QDAO API
cd ~/QRUCIAL-DAO/
tmux new-session -d -s qdao-api 'python3 exotools/lar.py'


# Print results
if [ -z "$(pgrep qdao)" ]
  then
      echo "There was an error runntng node setup. Please check the output above and the logs."
  else
      echo "Your local QDAO dev node has been prepared. Your tmux sessions:"
      tmux ls
fi
