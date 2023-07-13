#!/bin/bash
# QDAO start script
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

# Start the node in background tmux
echo "> Starting the full node services in tmux sessions."
chmod +x ./qdao-node/target/debug/qdao-node
tmux new-session -d -s qdao-node './qdao-node/target/debug/qdao-node --dev'
sleep 7  # Wait for node start

# Start ExoSys Daemon in background/tmux
tmux new-session -d -s qdao-exosysd './exosysd/target/debug/qdao-exosysd'

# Start the QDAO API
tmux new-session -d -s qdao-api 'python3 exotools/lar.py'

# Start the frontend
cd frontend/substrate-front-end-template/
yarn install
tmux new-session -d -s qfe 'yarn start'
cd ../../

# Print results
if [ -z "$(pgrep exosysd)" ] # We are checking exosysd, as it only runs in the node runs
  then
      echo "> There was an error running node setup. Please check the output above and the logs."
  else
      echo "> Your local QDAO dev node has been prepared. Your tmux sessions are the following:"
      tmux ls
fi

# Run health check
sleep 8 # Need to wait for nodejs start...
python3 node-health-check.py
