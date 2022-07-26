#!/bin/bash
# ExoTool for QDAO
#
# Description: This script is called by ExoSys Daemon
#
# Author: QDAO Team
# License: GNU AFFERO GENERAL PUBLIC LICENSE - Version 3, 19 November 2007

# Check if we have the arguments
if [ -z "$1" ]
  then
    echo "No argument provided. Exit."
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
URL=$1
HASH=$2
# TBA


## Prepare the folder
XTPATH=audit_files/$(echo $HASH)_$(date +%s)
function prep_folder {
    mkdir $XTPATH
}

## Take URL (tar) and HASH

function get_audit_files {
    XTFILE=$XTPATH/$(echo "auditpack.tar") # TBA dont echo
    curl -s $URL --output $XTFILE

    # Check if it is the right file, by hash
    CUR_SUM=$(sha512sum $XTFILE | cut -d' ' -f1)
    sha512sum $XTFILE

    if [ "$HASH" = "$CUR_SUM" ]; then
        echo "Checkum correct!"
    else
        echo "Wrong checksum!"
        exit 1
    fi    

    # Check if it is a tar file
    FTYPE=$(file $XTFILE | grep -o 'POSIX tar archive')
    FTYPEreq=$(echo "POSIX tar archive")
    if [ "$FTYPE" = "$FTYPEreq" ]; then
        echo "ok, lets move to execution..."
    else
        echo "Error, not a tar file!"
        exit 1
    fi
    # TBA check if hash is the same
    # TBA check if file is tar
        # https://unix.stackexchange.com/questions/457117/how-to-unshare-network-for-current-process
}

#get_audit_files
prep_folder
get_audit_files



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
