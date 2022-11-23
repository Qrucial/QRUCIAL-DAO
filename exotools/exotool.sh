#!/bin/bash
# ExoTool for QDAO
#
# Description: This script is called by ExoSys Daemon.
# For development efficiency we use bash now, in the future, this will be rewritten in python3 or rust.
#
# Author: QDAO Team
# License: GNU AFFERO GENERAL PUBLIC LICENSE - Version 3, 19 November 2007

# Dependency checks
type curl >/dev/null || { echo >&2 "curl is missing. please install it." ; exit 1;}
type docker >/dev/null || { echo >&2 "docker is missing. please install it." ; exit 1;}
type keccak256 >/dev/null || { echo >&2 "keccak256 is missing. please install it." ; exit 1;}

# Process Args
if (( $# != 2 )); then
  >&2 echo "[DEBUG] Incorrect number of args, use: \n\texotool.sh <URL> <HASH>"
fi

# Check if URL is valid
regex='(https?)://[-[:alnum:]\+&@#/%?=~_|!:,.;]*[-[:alnum:]\+&@#/%=~_|]'
if [[ ! $1 =~ $regex ]]
then
  echo "[DEBUG] Invalid URL was passed to ExoTool."
  exit 1
fi

# Step back because it is started from Daemon
echo '[DEBUG] We cd to ~/QRUCIAL-DAO/exotools/ or ../exotools'

if [ -d ~/QRUCIAL-DAO/exotools/  ]
then
    echo "[DEBUG] Assuming non-docker environment"
    cd ~/QRUCIAL-DAO/exotools/ # For non-docker environment
fi

if [ ! -d ~/QRUCIAL-DAO/exotools/  ]
then
    echo "[DEBUG] Assuming docker environment"
    cd ../exotools # For docker environment
fi

echo "[DEBUG] Location:"
pwd

# > SCRIPT_PATH  = Directory of where the script is at starting at root
#   > This should be used when doing filesysem changes. If not used the wrong directory might be used
#     > ie: PWD the user executes the tools when not in the same directory as the script.
#
# > DATE_READABLE = Time in a human-readable format, IE: 17_08_2022-16_20_43
#   > The readable date should be used where its more important for it to be recognisable than efficent
#
# > DATE = Unix time, IE:
#   > This should be used when it doesent matter if people can read it.

#SCRIPT_PATH=$(dirname $(realpath "${BASH_SOURCE:-$0}"))
echo "[DEBUG] Development version, using /tmp for audit files"
SCRIPT_PATH=$(pwd)
DATE="$(date +%s)"
DATE_READABLE=$(date +'%d-%m-%Y_%H-%M-%S')
URL=$1
SUPPLIED_HASH=$2

# Prepare the security audit working folders
function prep_folders {

  if [[ ! $HASH ]]; then echo "[DEBUG] Hash passed to ExoTool was not set correctly."; exit 1; fi

  MOUNTPOINT="$SCRIPT_PATH"/static/"$HASH"
  TIMESTAMP_PATH="$MOUNTPOINT"/reports/"$DATE_READABLE"/
  EXTRACT_PATH="$MOUNTPOINT"/audit_files/extract/
  DOWNLOAD_PATH="$MOUNTPOINT"/audit_files/download/
  REPORT_PATH="$MOUNTPOINT"/latest_report/
  mkdir -p "$TIMESTAMP_PATH" "$EXTRACT_PATH" "$REPORT_PATH" "$DOWNLOAD_PATH"

}

# Downloads the files from the URL given by ExosysD
function get_audit_files {
  echo "[DEBUG] Retrieve Audit Files: $URL"
  echo ""

  PROGRAM_NAME="${URL##*/}"
  TEMP_PATH="/tmp/qrucial"
  mkdir -p "$TEMP_PATH"/
  TEMP_PATH="$TEMP_PATH"/"$PROGRAM_NAME"   # This gets the final parts of url, should be the filename
  curl -s "$URL" --output "$TEMP_PATH"
  echo "$TEMP_PATH"

  # Get hash of file
  HASH=$(cat "$TEMP_PATH" | keccak256)
  prep_folders
  mv "$TEMP_PATH" "$DOWNLOAD_PATH"

  # The file needs to be a tar file
  if ! { tar ztf "$DOWNLOAD_PATH"/"$PROGRAM_NAME" || tar tf "$DOWNLOAD_PATH"/"$PROGRAM_NAME"; } >/dev/null 2>&1; then
    echo "[DEBUG] $DOWNLOAD_PATH is not a tar file"
    exit 1
  fi

  # Extract file. to program dir (to root directory of the docker/)
  echo '[DEBUG] Extractiong $PROGRAM_NAME to $EXTRACT_PATH'
  tar xf "$DOWNLOAD_PATH"/"$PROGRAM_NAME" --directory=$EXTRACT_PATH
  # Idea: https://unix.stackexchange.com/questions/457117/how-to-unshare-network-for-current-process
  # We don't want to provide network connection to the security audit files/processes.
}

## Prepare the docker environment
# > Creates a docker container called auditor, mounted at dir, from the image exotools
# > Creates container
function docker_prep () {
  echo "[DEBUG] Preparing Docker instance"
  echo ""
  if [[ $1 == 1 ]]; then
    docker build -t exotools "$SCRIPT_PATH"/docker/docker_files/
  fi
}

# Safe crash, stop docker and anything that should be cleaned up.
function safe_exit () {
  echo "[DEBUG] Exiting, stopping running processes..."

  if [[ $(docker container list | grep "$HASH") ]]; then
    docker container stop "$HASH"
    if [[ ! ($1 == 1 || $1 == 2) ]]; then return; fi
    echo "Removing docker container"
    docker container rm "$HASH"
  fi
  if [[ ! $1 == 2 ]]; then return; fi
  echo "removing generated files"
  rm -rf "$MOUNTPOINT"
}

function to_local_dir () {
  echo "/auditdir/""${1##*$MOUNTPOINT}"
}

function to_absolute_dir () {
  echo "${1##*/auditdir}"
}

# Run the proper commands to generate a report
function exec_audit {
## Docker run $HASH parmiters x y z
  docker run --name="$HASH" -v "$MOUNTPOINT":/exotools exotools \
    /usr/exotools/audit_script.sh \
    -h $HASH \
    -d $DATE \
    -D $DATE_READABLE \
    --debug
  # We should have more error handling here.
}

function call_logger {
  # Target HTTP service of --> ../logger_and_reporter/python/lar.py
  # exotestflipper.tar 0xa03f6ba3eb8141f0f8daee4ea016d4144f44fc4cba9e7477a4c1f041aaeb6c38
  # TODO check for result and make sure the passed arguments are accurate always
  # curl -X POST "http://127.0.0.1:9999/notify_logger?key=x7roVhBsiZ18Dg3DX3iCm9pXhXdbZWx2&hash=0xa03f6ba3eb8141f0f8daee4ea016d4144f44fc4cba9e7477a4c1f041aaeb6c38&result=1"
  echo "[DEBUG] Calling and reporting to logger with $HASH and result=1"
  curl -X POST "http://127.0.0.1:9999/notify_logger?key=x7roVhBsiZ18Dg3DX3iCm9pXhXdbZWx2&hash=$HASH&result=1"
}

function check_hash {
  echo "[DEBUG] Run hash check"
  echo ""
  if [[ ! $HASH == $SUPPLIED_HASH ]]; then
    echo "[DEBUG] Hashes don't match: $HASH != $SUPPLIED_HASH"
    exit 1
  fi
  echo "[DEBUG] Hashes received do match."
  echo ""
}

### Execution logic

## Download, files from url
get_audit_files
## Check Hash of the script vs download > run after get_audit_files
check_hash
## Sets up folder structure > run after check_hash
prep_folders
## Setup docker, build image, etc
docker_prep 1
## Run Auditor script bundled in the docker image
exec_audit
## Notify the logger about execution
call_logger

# Ideas: Would it be smart to offload some of the logic here into the docker file?
# We could Have a bash script that gets loaded into the docker

# Exit
safe_exit 1
