#!/bin/bash
# ExoTool for QDAO
#
# Description: This script is called by ExoSys Daemon
#
# Author: QDAO Team
# License: GNU AFFERO GENERAL PUBLIC LICENSE - Version 3, 19 November 2007
        
# Dependency checks
type curl >/dev/null || { echo >&2 "curl is missing. please install it." ; exit 1;}
type docker >/dev/null || { echo >&2 "docker is missing. please install it." ; exit 1;}
type sha512sum >/dev/null || { echo >&2 "sha512sum is missing. please install it." ; exit 1;}

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

# needs to run after get_audit_files, that function sets the hash
function prep_folders {
  
  if [[ ! $HASH ]]; then echo "Hash is not set, Fix code flow"; exit 1; fi
  
  TIMESTAMP_DIR="$SCRIPT_PATH"/static/"$HASH"/"$DATE_READABLE"/
  PROGRAM_DIR="$SCRIPT_PATH"/static/"$HASH"/audit_files/program/
  REPORT_DIR="$SCRIPT_PATH"/static/"$HASH"/reports/

  mkdir -p "$TIMESTAMP_DIR" "$PROGRAM_DIR" "$REPORT_DIR"

}

# Downloads the files from the URL
function get_audit_files {
  PROGRAM_NAME="${URL##*/}"
  TEMP_PATH="/tmp/qrucial"
  mkdir -p "$TEMP_PATH"/
  TEMP_PATH="$TEMP_PATH"/"$PROGRAM_NAME" # this gets the final parts of url, hopefully the filename
  curl -s "$URL" --output "$TEMP_PATH"
  echo "$TEMP_PATH"

  # Get hash of file.
  HASH=$(sha512sum "$TEMP_PATH" | cut -d' ' -f1)
  DOWNLOAD_PATH="$SCRIPT_PATH"/static/"$HASH"/audit_files/
  prep_folders
  mv "$TEMP_PATH" "$DOWNLOAD_PATH"

  if ! { tar ztf "$DOWNLOAD_PATH" || tar tf "$DOWNLOAD_PATH"; } >/dev/null 2>&1; then
    echo "$DOWNLOAD_PATH is not a tar file"
    exit 1
  fi
  
  # Extract file. to program dir (to root directory of the docker/)
  tar xf "$DOWNLOAD_PATH"/"$PROGRAM_NAME" --directory=$PROGRAM_DIR

  echo "ok, lets move to execution..."

  # https://unix.stackexchange.com/questions/457117/how-to-unshare-network-for-current-process
}

## Docker prep
# > Creates a docker container called auditor, mounted at dir, from the image exotools
# > Creates container
function docker_prep {
  
  docker build -t exotools "$SCRIPT_PATH"/docker/docker_files/
  docker create --name="$HASH" -v "$PROGRAM_DIR":/auditdir exotools
}


# Run the proper commands to generate a report
function exec_audit {
  if [[ ! $HASH ]]; then echo "Hash is not set, Fix code flow"; exit 1; fi

  # start the docker so we can later execute commands 
  docker start "$HASH"

  # Generate Lock file if it cannot be found
  docker exec "$HASH" "cargo generate-lockfile" 

  # Start an automated audit, save output.
  docker exec "$HASH" "cargo audit --json" > "$REPORT_DIR"/report.json # better save method. (?)

  # cp or symlink, whatever is better
  cp "$REPORT_DIR"/report.json "$TIMESTAMP_DIR"/

  # Stop docker
  docker stop "$HASH"

  # Delete docker? 

}

function call_logger {
  # Target HTTP service of --> ../logger_and_reporter/python/lar.py
  curl -X POST "http://127.0.0.1:9999/notify_logger?key=x7roVhBsiZ18Dg3DX3iCm9pXhXdbZWx2"  # TODO Add correct arguments! What do we pass here? succ/fail/info
}

function check_hash {
  if [[ ! $HASH == $2 ]]
    echo "$HASH != $2"
  fi
}



# Execute functions

## Download, files from url
get_audit_files
## Check Hash of the script vs download > run after get_audit_files
check_hash
## Sets up folder structure > run after check_hash
prep_folder
## Setup docker, build image, etc
docker_prep 
## Run Auditor, cargo audit
exec_audit
## [TODO] Document
#call_logger



## ExecutionLogger --> Monitors for new static!
