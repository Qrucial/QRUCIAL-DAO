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
type git >/dev/null || { echo >&2 "> git is missing. Please install it." ; exit 1;}
type cargo >/dev/null || { echo >&2 "> cargo is missing. Please install it." ; exit 1;}
type docker >/dev/null || { echo >&2 "> docker is missing. Please install it." ; exit 1;}
type python3 >/dev/null || { echo >&2 "> python3 is missing. Please install it." ; exit 1;}
type curl >/dev/null || { echo >&2 "> curl is missing. Please install it." ; exit 1;}
type tmux >/dev/null || { echo >&2 "> tmux is missing. Please install it." ; exit 1;}
type keccak256 >/dev/null || { echo >&2 "> keccak256 is missing. Please install it." ; exit 1;}
type gcc >/dev/null || { echo >&2 "> gcc is missing. Please install it." ; exit 1;}
type make >/dev/null || { echo >&2 "> make is missing. Please install it." ; exit 1;}
type pip3 >/dev/null || { echo >&2 "> make is missing. Please install it." ; exit 1;}

# Pip
pip3 install Flask

# Get from git and checkout correct branch (later from IPFS?)
if [ -d "qdao-node" ]; then
  echo "> Found qdao-node directory, assuming we are already in git repo."
  git fetch
  cd qdao-node
else
  echo "> We are having a clean start, starting with git clone."
  cd ~
  git clone https://github.com/Qrucial/QRUCIAL-DAO
  cd QRUCIAL-DAO/qdao-node
fi
git checkout dev

# Build the node
cargo build

# Build ExoSys Daemon
echo "> Building ExoSys Daemon"
cd ../exosysd/
cargo build
chmod +x target/debug/qdao-exosysd
cd ../

# Start the node in backgroundtmux
echo "> Starting the full node services in tmux sessions."
chmod +x ./qdao-node/target/debug/qdao-node
tmux new-session -d -s qdao-node './qdao-node/target/debug/qdao-node --dev'
sleep 7  # Wait for node start

# Start ExoSys Daemon in background/tmux
tmux new-session -d -s qdao-exosysd './exosysd/target/debug/qdao-exosysd'

# Start the QDAO API
tmux new-session -d -s qdao-api 'python3 exotools/lar.py'


# Print results
if [ -z "$(pgrep exosysd)" ] # We are checking exosysd, as it only runs in the node runs
  then
      echo "> There was an error running node setup. Please check the output above and the logs."
  else
      echo "> Your local QDAO dev node has been prepared. Your tmux sessions are the following:"
      tmux ls
fi

# Run health check
python3 node-health-check.py