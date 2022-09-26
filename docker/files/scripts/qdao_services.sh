#!/bin/sh
tmux new-session -d -s qdao-node '/opt/data/QRUCIAL-DAO/qdao-node/target/release/qdao-node --dev'
sleep 10 # Wait til node starts, TODO
tmux new-session -d -s qdao-exosysd '/opt/data/QRUCIAL-DAO/exosysd/target/release/qdao-exosysd'
tmux new-session -d -s qdao-api 'python3 /opt/data//QRUCIAL-DAO/exotools/lar.py'

# Required for persistant builds. will never recompile unless these files are deleted
cp -r /opt/data/* /opt/testing
sleep 999 # Debugging
