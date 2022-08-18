# EXOTOOLS-PALLET &middot; [![GitHub license](https://img.shields.io/badge/license-GPL3%2FApache2-blue)](#LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.adoc)


# 💡 High level summary
This set of tools, that runs in a docker container, is used to automaticaly detect and report venerabilities. as well as tools to assist in auditing programs.
- exotool.sh Script that is called by ExoSys daemon

# ⚙️  Tool execution Flow
Run `exotool.sh \<URL\> \<HASH\>`
  > Creates folder based on hash of program downloaded from url
    > contains: audit_files, reports, timestamps.
  > check for new dockerfile(?)
  > Build an image based on the dockerfile
  > Create docker container based on image that was built.
  > run docker container that will run cargo audit.
    > save output into the report/report.json
  > convert the docker container back into image, store that in timestamp.
  > prune the image saving up space, reduce clutter.


# 🔭 Overview
| Current Directory  | Description                                                                  |
|------------------- |----------------------------------------------------------------------------- |
| audits             | This folder is used to store the audits.                                     |
| docker             | This folder is where the various dockerfile and docker images will be stored |
| exotool.sh        | This script will orchistrate the audit vesrions, timestamps and docker setup |


# 📚 Wiki:

EXOTOOLS-PALLET wiki [can be found here](https://github.com/Qrucial/QRUCIAL-DAO/wiki/ExoTool).   



