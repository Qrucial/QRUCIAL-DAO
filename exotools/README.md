# EXOTOOL SYSTEM &middot; [![GitHub license](https://img.shields.io/badge/license-GPL3%2FApache2-blue)](#LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.adoc)


# 💡 High level summary
This set of tools, that runs in a docker container, is used to automaticaly detect and report venerabilities. as well as tools to assist in auditing programs.
- exotool.sh Script that is called by ExoSys daemon
- lar.py handles logging and reporting to blockchain, also includes the API for the front-end

# ⚙️  Tool execution Flow
Run 
```bash
exotool.sh "<URL>" "<HASH>"
```
- Creates folder based on hash of program downloaded from url
  - └> contains: audit_files, reports, timestamps.
- check for new dockerfile(?)
- Build an image based on the dockerfile
- Create docker container based on image that was built.
- run docker container that will run cargo audit.
  - └> save output into the report/report.json
- convert the docker container back into image, store that in timestamp.
- prune the image saving up space, reduce clutter.
- notify lar.py for signing extrinsics and sending it to ExoSys


# 🔭 Overview
| Current Directory  | Description                                                                  |
|------------------- |----------------------------------------------------------------------------- |
| static             | This folder is used to store the audits.                                     |
| docker             | This folder is where the various dockerfile and docker images will be stored |
| exotool.sh         | This script will orchistrate the audit vesrions, timestamps and docker setup |

```
/auditors ['GET'] # Returns all auditors and their data
/auditor-data ['GET'] # Returns only 1 auditor's data
/profile_update ['POST'] # Profile update, called at signup and profile update, takes JSON
/request-audit ['POST'] # Adds the audit request to db, takes JSON
/audit-requests ['GET'] # List of all audit requests
/take_audit ['POST'] # Called when auditor wants to take an audit, takes JSON or parameter (to be decided)
/get_report ['GET'] # Get a single audit report, takes a parameter with ID
/send_report ['POST'] # Called when auditor send in final report, takes JSON (logic to be decided)
```

## ExoTool Logger and Extrinsic reporter
ExoTool sends succ/fail HTTP POST --> Logger checks it through API key --> Uses sube to send extrinsic to qdao-node

# 📚 Wiki:

EXOTOOL wiki [can be found here](https://github.com/Qrucial/QRUCIAL-DAO/wiki/ExoTool).   
