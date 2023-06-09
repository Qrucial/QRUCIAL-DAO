#!/bin/sh
killall qdao-node
killall qdao-exosysd
killall lar.py
#docker kill $(docker ps -q)
#docker rm $(docker ps -a -q)
#docker rmi $(docker images -q)
docker system prune
docker system prune -af
