#!/bin/bash
# ExoTool for QDAO
#
# Description: This script is called by ExoSys Daemon
#
# Author: QDAO Team
# License: GNU AFFERO GENERAL PUBLIC LICENSE - Version 3, 19 November 2007




# Process Args
# just one at the moment, URL
# Check if URL is valid
# what is a valid url, is it a specific file type?
regex='(https?)://[-[:alnum:]\+&@#/%?=~_|!:,.;]*[-[:alnum:]\+&@#/%=~_|]'
if [[ $1 =~ $regex ]]
then 
   URL=$1
else
   echo "Invalid URL"
   exit 1
fi





# Dependency checks
type curl >/dev/null || { echo >&2 "curl is missing. please install it." ; exit 1;}
type docker >/dev/null || { echo >&2 "docker is missing. please install it." ; exit 1;}
type sha512sum >/dev/null || { echo >&2 "sha512sum is missing. please install it." ; exit 1;}



# > establish a few global variables
#   > SCRIPT_PATH  = directory of where the script is at starting at root
#   > DATE          = Unix time, IE: 123456789
#     > this should be used when it doesent matter if people can read it.
#   > DATE_READABLE = Time in a human-readable format, IE: 17_08_2022
#     > the readable date should be used where its more important for it to be recognisable than efficent
SCRIPT_PATH=$(dirname $(realpath "${BASH_SOURCE:-$0}"))
DATE="$(date +%s)"
DATE_READABLE=$(date +'%d-%m-%Y_%H-%M-%S')


function prep_folders {
  TIMESTAMP_DIR="$SCRIPT_PATH"/audits/"$HASH"/"$DATE_READABLE"/
  PROGRAM_DIR="$SCRIPT_PATH"/audits/"$HASH"/audit_files/program/
  REPORT_DIR="$SCRIPT_PATH"/audits/"$HASH"/reports/

  mkdir -p "$TIMESTAMP_DIR" "$PROGRAM_DIR" "$REPORT_DIR"

}

# Downloads the files from the URL
function get_audit_files {
  
  # What are we downloading? an archive, a single .rs file?
  TEMP_PATH="/tmp/qrucial"
  mkdir -p "$TEMP_PATH"/
  TEMP_PATH="$TEMP_PATH"/"${URL##*/}" # this gets the final parts of url, hopefully the filename
  curl -s "$URL" --output "$TEMP_PATH"
  echo "$TEMP_PATH"
  # Get hash of file.
  HASH=$(sha512sum "$TEMP_PATH" | cut -d' ' -f1)
  DOWNLOAD_PATH="$SCRIPT_PATH"/audits/"$HASH"/audit_files/
  prep_folders
  mv "$TEMP_PATH" "$DOWNLOAD_PATH"

  # Check if it is a tar file
  # Why are we checking if its a tar?
  # what we are downloading will likely just be a rust file .rs

  #if ! { tar ztf "$DOWNLOAD_PATH" || tar tf "$DOWNLOAD_PATH"; } >/dev/null 2>&1; then
  #  echo "$DOWNLOAD_PATH is not a tar file"
  #  exit 1
  #fi

  echo "ok, lets move to execution..."


  # https://unix.stackexchange.com/questions/457117/how-to-unshare-network-for-current-process
}

## Docker prep
# > Sets up the dir structure.
# > Builds an image called exotools from the dockerfile located at ./dockerfiles/
# > Creates a docker container called auditor, mounted at dir, from the image exotools
# > starts container
function docker_prep {
  
  docker build -t exotools "$SCRIPT_PATH"/docker/docker_files/
  
  # This Could be useful, but 99% of the time its wasteful
  #  > better would be to extract and archive only useful data, IE: .history
  #docker save --output "$SCRIPT_PATH"/docker_images/file.tar exotools

  docker create --name="$HASH" -v "$PROGRAM_DIR":/auditdir exotools
  
}


# Run the proper comands to generate a report
function exec_audit {
   # start the docker so we can later execute commands 
   docker start "$HASH"
   # docker exec... :
      # > Cargo build
      # > cargo audit
      # > place in correct folders
   
   # docker exec cargo build
   ## > im gonna need help on this i think.
   ## > inorder to build it we need to do a few complicated things automatically.
   ## > maybe its up to the user to compile it then present our program the Cargo.lock?

   
   # Start an automated audit, save output.
   docker exec cargo audit "$HASH" > "$REPORT_DIR"/report.json # Should come up with a better save method. 
   cp "$REPORT_DIR"/report.json "$TIMESTAMP_DIR"/
   # cp or symlink, whatever is better
}

function call_logger {
   # Target HTTP service of --> ../logger_and_reporter/python/lar.py
   curl -X POST "http://127.0.0.1:9999/notify_logger?key=x7roVhBsiZ18Dg3DX3iCm9pXhXdbZWx2"  # TODO Add correct arguments! What do we pass here? succ/fail/info
}

function check_hash {
   # [TODO] Decide if this is necessary in the current state
   # if it is necessary could we implament it together so i get a better idea of whats going on
   echo "$HASH"
}



## Check hash? - why is it necessary to check the hash?
# > i think in its current state it doesent make sense, i might be wrong but:
# > the process of conducting an audit (with the hash) is:
#   > Find a file you want to audit
#   > download the file (manually)
#   > sha256 it (manually) to get a hash
#   > use the output to execute this script
#   > this script then does the exact same command and then returns true (or false which woulden happen?)
#   > is there a better way to implement this?
# > the way we used it before was completely trusting that the hash was correct,
#   > it used the hash the user gave to generate a directory \
#     when it should be based on the hash of the downloaded file
#   > this removes the point of checking a hash. 

## Sets up folder structure
#prep_folder
## Download, files from url
get_audit_files
## [TODO] Document
#call_logger
## Setup docker, build image, etc
docker_prep 
## Run Auditor, cargo build, cargo audit
exec_audit



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
