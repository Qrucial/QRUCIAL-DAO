# AUDITREP-PALLET &middot; [![GitHub license](https://img.shields.io/badge/license-GPL3%2FApache2-blue)](#LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.adoc)


# 💡 High level summary
This pallet handles the sign up as well as the reputation of auditors.


# ⚙️  Auditrep execution Flow
## New auditor signup
1. New user requests auditor status, the auditor provides as part of the request some profile information about him in markdown format(extrinsic receives a hash of it). As long as the auditor is not approved, his/her reputation score is `None`. The user must stake and amount of `$AUDITOR_STAKE` tokens in order to request and mantain the auditor status. 
2. 3 Author's with auditor status and a reputation score above `$APPROVAL_THRESHOLD` approve the auditor request.
3. The 3.rd approval assigns the auditor an initial reputation score `$INIT_SCORE`.
4. The user can always cancel the approval process and claim back his `$AUDITOR_STAKE` amount of tokens then.


# 🔭 Overview
| Current Directory  | Description                                                                  |
|------------------- |----------------------------------------------------------------------------- |
| lib.rs          | TBA |
| benchmarking    | TBA |
| mock.rs         | TBA |
| tests.rs        | TBA |

# 📚 Wiki:

AUDITREP-PALLET wiki [can be found here](https://github.com/Qrucial/QRUCIAL-DAO/wiki/Auditrep).   
