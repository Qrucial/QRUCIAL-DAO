#!/bin/bash
# ExoTool for QDAO
#
# Description: This script is called by ExoSys Daemon
#
# Author: QDAO Team
# License: GNU AFFERO GENERAL PUBLIC LICENSE - Version 3, 19 November 2007

# Check if we have the arguments
if [ -z "$1" ]; then
  echo "Requires 2 arguments: <URL> <HASH>"
  exit 1
fi

if [ $# -ne 2 ]; then
  echo "Wrong number of arguments entered. Exit."
  exit 1
fi

# TBA Check if arguments are PATH and sha512sum

# Dependency checks
type curl >/dev/null || { echo >&2 "curl is missing. please install it." ; exit 1;}
type docker >/dev/null || { echo >&2 "docker is missing. please install it." ; exit 1;}
type sha512sum >/dev/null || { echo >&2 "sha512sum is missing. please install it." ; exit 1;}

# Check $URL and $HASH for validity
# TBA


## Prepare the folder

# > establish a few global variables
#   > SCRIPT_PATH  = directory of where the script is at starting at root
#   > DATE          = Unix time, IE: 123456789
#     > this should be used when it doesent matter if people can read it.
#   > DATE_READABLE = Time in a human-readable format, IE: 17_08_2022
#     > the readable date should be used where its more important for it to be recognisable than efficent
SCRIPT_PATH=$(dirname $(realpath "${BASH_SOURCE:-$0}"))
DATE="$(date +%s)"
DATE_READABLE=$(date +'%d-%m-%Y_%H-%M-%S')

URL=$1
HASH=$2

# XTPATH=audit_files/"$HASH""_$(date +%s)"
#   > the path where the audit is saved in should not have time, it would just take up extra space,


function prep_folder {
  mkdir -p "$SCRIPT_PATH"/audits/"$HASH"/audit_files/ \
    "$SCRIPT_PATH"/audits/"$HASH"/reports/
}


## Take URL (tar) and HASH
function get_audit_files {
  DOWNLOAD_PATH="$SCRIPT_PATH"/audits/"$HASH"/audit_files/program.tar
  curl -s "$URL" --output "$DOWNLOAD_PATH"

  # Check if it is the right file, by hash
  CUR_SUM=$(sha512sum "$DOWNLOAD_PATH" | cut -d' ' -f1)
  sha512sum "$DOWNLOAD_PATH"

  if [ "$HASH" = "$CUR_SUM" ]; then
     echo "Checkum correct!"
  else
      echo "Wrong checksum!"
      exit 1
  fi    

  # Check if it is a tar file
  FTYPE=$(file "$DOWNLOAD_PATH" | grep -o 'POSIX tar archive')
  FTYPEreq="POSIX tar archive"
  if [ "$FTYPE" = "$FTYPEreq" ]; then
    echo "ok, lets move to execution..."
  else
    echo "Error, not a tar file!"
    exit 1
  fi
  # https://unix.stackexchange.com/questions/457117/how-to-unshare-network-for-current-process
}

## Docker prep
# > Sets up the dir structure.
# > Builds an image called exotools from the dockerfile located at ./dockerfiles/
# > Creates a docker container called auditor, mounted at dir, from the image exotools
# > starts container
function docker_prep {
  mkdir -p auditdir/programs -p auditdir/reports
  docker build -t exotools ./dockerfiles/         ## !! This should not be run every time. only when there is no image. also should not use ./
  docker create --name=auditor -v $(pwd)/auditdir:/auditdir exotools ## !! This is a 'dangerous' line pwd is goint to print the dir the user is in.
  docker start -a auditor # > ./auditdir/reports/abc.json ## Very basic functionality
  ## To-Do: Hash based logs, Generate logs in docker container.

  # Create Timestamp dir, add json, etc.
  # Report dir should also get a link or the json.
  # Create system snaphot o fthe container.

}



#get_audit_files
prep_folder
get_audit_files

#docker_prep # !! untested in this context
# docker_prep should build an image if needed
#   > edit the dockerfile mount dir to be: exotool/audits/hash/
#     > the docker can then fair


## check if the hash is same

    ## extract tar
    
    ## check for currect folder/file structure
        #Inital build creates image called "rusttop"
        #docker build -t rusttop ~/dockertests/ # first step
            # requires: folder exists
            # requires: dockerfile
        #This runs the image that we just built in the container "auditor" and mounts a local dir "datadir"
        #docker run --name=auditor -v $(pwd)/datadir:/rustvol-testing rusttop
        # docker start -a auditor ## executes from running image

    ## execute docker with audit tools

## ExecutionLogger --> Monitors for new audits!
