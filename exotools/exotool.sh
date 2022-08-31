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
  >&2 echo "incorrect number of args, use: \n\texotool.sh <URL> <HASH>"
fi

# Check if URL is valid
regex='(https?)://[-[:alnum:]\+&@#/%?=~_|!:,.;]*[-[:alnum:]\+&@#/%=~_|]'
if [[ ! $1 =~ $regex ]]
then 
  echo "Invalid URL"
  exit 1
fi

# Step back because it is started from Daemon TODO: change this to fix path
cd ../exotools/
pwd

# > SCRIPT_PATH  = directory of where the script is at starting at root
#   > this should be used when doing filesysem changes. if not used the wrong directory might be used
#     > ie: PWD the user executes the tools when not in the same directory as the script.
#
# > DATE_READABLE = Time in a human-readable format, IE: 17_08_2022-16_20_43
#   > the readable date should be used where its more important for it to be recognisable than efficent
#
# > DATE = Unix time, IE: 
#   > this should be used when it doesent matter if people can read it.

SCRIPT_PATH=$(dirname $(realpath "${BASH_SOURCE:-$0}"))
DATE="$(date +%s)"
DATE_READABLE=$(date +'%d-%m-%Y_%H-%M-%S')
URL=$1
SUPPLIED_HASH=$2


# needs to run after get_audit_files, that function sets the hash
function prep_folders {
  
  if [[ ! $HASH ]]; then echo "Hash is not set, Fix code flow"; exit 1; fi
  
  MOUNTPOINT="$SCRIPT_PATH"./static/"$HASH"
  TIMESTAMP_PATH="$MOUNTPOINT"./reports/"$DATE_READABLE"/
  EXTRACT_PATH="$MOUNTPOINT"./audit_files/extract/
  DOWNLOAD_PATH="$MONTPOINT"./audit_files/download/
  REPORT_PATH="$MOUNTPOINT"./latest_report/
  mkdir -p "$TIMESTAMP_PATH" "$EXTRACT_PATH" "$REPORT_PATH" "$DOWNLOAD_PATH"

}


# Downloads the files from the URL
function get_audit_files {
  
  echo "Retrieve Audit Files"
  echo ""

  PROGRAM_NAME="${URL##*/}"
  TEMP_PATH="/tmp/qrucial"
  mkdir -p "$TEMP_PATH"/
  TEMP_PATH="$TEMP_PATH"/"$PROGRAM_NAME" # this gets the final parts of url, hopefully the filename
  curl -s "$URL" --output "$TEMP_PATH"
  echo "$TEMP_PATH"

  # Get hash of file.
  HASH=$(cat "$TEMP_PATH" | keccak256)
  prep_folders
  mv "$TEMP_PATH" "$DOWNLOAD_PATH"

  if ! { tar ztf "$DOWNLOAD_PATH"/"$PROGRAM_NAME" || tar tf "$DOWNLOAD_PATH"/"$PROGRAM_NAME"; } >/dev/null 2>&1; then
    echo "$DOWNLOAD_PATH is not a tar file"
    exit 1
  fi
  
  # Extract file. to program dir (to root directory of the docker/)
  tar xf "$DOWNLOAD_PATH"/"$PROGRAM_NAME" --directory=$EXTRACT_PATH


  # https://unix.stackexchange.com/questions/457117/how-to-unshare-network-for-current-process
}

## Docker prep
# > Creates a docker container called auditor, mounted at dir, from the image exotools
# > Creates container
function docker_prep () {
  echo "Preping Docker"
  echo ""
  if [[ $1 == 1 ]]; then
    docker build -t exotools "$SCRIPT_PATH"/docker/docker_files/
  fi
}
# Safe crash, stop docker and anything that should be cleaned up.
function safe_crash () {
  echo "~~~"
  echo "Exiting, stopping running processes..."
  echo "~~~"
  docker container stop "$HASH"
  if [[ ! ($1 == 1 || $1 == 2) ]]; then return; fi
  echo "Removing docker container"
  docker container rm "$HASH" 
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
## docker run $HASH parmiters x y z
  docker run --name="$HASH" -v "$MOUNTPOINT":/exotools exotools \
    /usr/exotools/audit_script.sh \
    -h $HASH \
    -d $DATE \
    -D $DATE_READABLE \
    --debug
  # Hopefully works...
}

function call_logger {
  # Target HTTP service of --> ../logger_and_reporter/python/lar.py
  curl -X POST "http://127.0.0.1:9999/notify_logger?key=x7roVhBsiZ18Dg3DX3iCm9pXhXdbZWx2"  # TODO Add correct arguments! What do we pass here? succ/fail/info
}

function check_hash {
  echo "Hash Check"
  echo ""
  if [[ ! $HASH == $SUPPLIED_HASH ]]; then
    echo "Hashes don't match: $HASH != $SUPPLIED_HASH"
    exit 1
  fi
  echo "Hashes Match"
  echo ""
}

# Execute functions

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
## [TODO] Document
#call_logger

# Would it be smart to offload some of the logic here into the docker file?
# we could Have a bash script that gets loaded into the docker


# exit
safe_crash 1

## ExecutionLogger --> Monitors for new static!
