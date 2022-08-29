#!/bin/bash

# this should be stored in /qrucial/scripts
# this is inside the docker container.
# this runs just a few simple scripts.
# this can be the entry point perhaps? 
# this should do some basic args parsing to run in different modes?
  # mode default runs when no other option is selected.
  # mode debug? 
  # mode ...
  # debug flag - more logs

# this program should do none of the thinking. it should only execute commands and save it.
# things like hash checking and date getting should be done externaly


# global variables
# Date
# Date_Readable
# Hash 
#!/bin/bash

POSITIONAL_ARGS=()

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--hash)
      HASH="$2"
      shift # past argument
      shift # past value
      ;;
    -D|--date_readable)
      DATE_READABLE="$2"
      shift # past argument
      shift # past value
      ;;
    -d|--date)
      DATE="$2"
      shift # past argument
      shift # past value
      ;;
    --debug)
      DEBUG=1
      echo "~~~~~~~~~~~~~~~~~~ DEBUG ~~~~~~~~~~~~~~~~~~~"
      shift # past argument
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 1
      ;;
    *)
      POSITIONAL_ARGS+=("$1") # save positional arg
      shift # past argument
      ;;
  esac
done

set -- "${POSITIONAL_ARGS[@]}" # restore positional parameters
# We dont really need pos args but ill leave it in


if [[ ! ($HASH && $DATE_READABLE && $DATE) ]]; then echo "Variables are not set"; exit 1; fi

# Variables

# this variable is here so we can copy code back and forth and it will maintain compatibility
MOUNTPOINT=/exotools
TIMESTAMP_PATH=$MOUNTPOINT/reports/$DATE_READABLE/
EXTRACT_PATH=$MOUNTPOINT/audit_files/extract/
DOWNLOAD_PATH=$MOUNTPOINT/audit_files/download/
REPORT_PATH=$MOUNTPOINT/latest_report/
# These folders should already exist

# Run the proper commands to generate a report
function exec_audit {
  echo "Execute Audit"
  echo ""

  # Look for lock or toml file, It gets the absolute dir, not local
  if [[ $(find "$EXTRACT_PATH" -name Cargo.lock) ]]; then
    LOCK_FILE="$(find "$EXTRACT_PATH" -name Cargo.lock)"
  elif [[ $(find "$EXTRACT_PATH" -name Cargo.toml) ]]; then
    TOML_FILE="$(find "$EXTRACT_PATH" -name Cargo.toml)"
  else
    echo "Cannot Continue, neither Cargo.lock, or Cargo.toml was found"
    exit 1
  fi



  # If lock is not found
  if [[ ! $LOCK_FILE ]]; then
    echo "generate Lockfile: $(dirname $(to_local_dir $TOML_FILE))"
    #cd or remote shell into the correct dir

    #cargo generate-lockfile --manifest-path $(to_local_dir $TOML_FILE) -- 
    (cd $(dirname $TOML_FILE) && cargo generate-lockfile)
  fi


  touch "$REPORT_PATH"report.json
  cargo audit --json > "$REPORT_PATH""report.json" # better save method. (?)

  # cp or symlink, whatever is better
  cp -r "$REPORT_PATH" "$TIMESTAMP_PATH"

}









exec_audit






