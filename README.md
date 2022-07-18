# QRUCIAL-DAO
Web3 security DAO. 

Built on top of Substrate, Qrucial DAO is a system for transparent audits and certifications, issuing non-transferable NFTs to the audited systems themselves.

Tool execution flow: Signed extrinsic incoming -> Verification -> Listing in QDAO State -> Event triggered (exosys reads JSON RPC) -> Execution and result output -> ExoSys Extrinsic -> Aggregate and verify restuls -> Report delivery (encrypted, details tba)

We have a W3F grant approved and are working on the 1st milestone: [Proposal Repository](https://github.com/smilingSix/Grants-Program)

QDAO wiki [can be found here](https://github.com/Qrucial/QRUCIAL-DAO/wiki).


## Development notes

### 2022.06.10. - Runtime and core system
Participants: six, wigy
- Review of plans, topologies and Substrate runtime/crates config
- Planning native NT-NFT (non transferrable, non fungible token) to the system runtime
- Ideas on incentivizing DHT/storage for storing the reports
- Decided to use Aura over BABE
- HTTPS git paths added
- Runtime test build for QDAO
- Turns out we need to manually follow Substrate code changes
- Security notifications to be followed: [Polkadot releases](https://github.com/paritytech/polkadot/releases)
- Idea on sending release notifications to QDAO Dev Matrix (requested advice from Parity)
- Next step: runnable node PoC, with the relevant pallets

### 2022.06.14. - ExoSys PoC
Participants: six, wigy
- We were using Python3 and the SubstrateInterface module
- Decided to use WSS over HTTP POST
- Successfully connected to the WSS endpoint of QRUCIAL DAO node
- Successfully subscribed to event updates
- When the TemplatePallet is called through an extrinsics, the message is cought and the execution proceeds
- PoC can be tested by running
  - $ ./qdao-node --dev
  - $ python3 exotools_poc.py
  - $ nc -nvlp 8080
  - Executing the extrinsics from https://polkadot.js.org/apps/

### 2022.06.15. - Keystore management for ExoSys
Participants: six, wigy
- Rewriting the grant request as W3F requested
- Decision to use separate private key for each node (from the native keystore)
- AppCrypto, --key-type --> exos (unique to this project). Generate with:
    - ./qdao-node key insert --key-type exos --scheme sr25519
    - File path example: .local/share/qdao-node/chains/local_testnet/keystore/65786f7346ebddef8cd9bb167dc30878d7113b7e168e6f0646beffd77d69d39bad76b47a
    - So this SCALE encodes to filename
    - This can be enumerated from the pallet
- Next step: using the generated key for ExoSys

### 2022.06.17. - Sending extrinsics to ExoSys pallet
Participants: six, wigy
- Staying consistent in names, so we don't use "glue", but ExoSys as main term
- Implementing QDAO version of: https://github.com/polkascan/py-substrate-interface#create-and-send-signed-extrinsics
- We have tested sending our own Call, but we were receiving errors
- Debugging issue of py-substrate-interface returning None for call_decoder(ScaleBytes(enc_data))
- Analyzing the RPC WS connection and how RPC works with network sniffer
- Clearing up the python PoC code
- New grant idea: py-substrate-interface is not async. Could be done with asyncio.
- Next step: finish python PoC and consider switching to rust/subxt for ExoSys

### 2022.07.07. - Grant Milestone 1. Kickoff
Participants: six, ra33it0, wigy, knockoff
- Introduction to milestone requirements to the team
- Docker setup kickoff: we deliver ExoTool as docker and we deliver Substrate as docker (alternatively with a compilation guide). To be researched deeper by knockoff. We found GitLab's docker setup similar to what we need.
    - https://docs.gitlab.com/ee/ci/docker/using_docker_build.html
- Substrate runtime: we need to extend current runtime with reputation based governance. Assigned to: wigy and six 
    - Refactor: governance influencing the Elo score
- AuditorRep: auditors will be able to enter the Reputation system by succeeding a hacking challenge or by getting listed through by QDAO members (bad behaviour of invited person makes the invitor slashed). Multiple invitations can be done only over reputation 1000 (this number might change). Low rep members can only invite one. 
- Report Storage: nodes provide it through HTTP API. QDAO filesystem. Signed/encrypted.
- Frontend for milestone 1: polkadotjs + minimal frontend + integration tests

### 2022.07.11. - ExoTool testing
Participants: knockoff, six
- Docker is the main system to handle execution, on top of Ubuntu
- On the long run we might support NixOS, Alpine and others
- Considering https://github.com/trailofbits/eth-security-toolbox --> for EVM later
- qdao-dev0 server setup with docker / ExoTool
    - Ubuntu VPS
    - Install Docker: https://docs.docker.com/engine/install/ubuntu/
    - Create QDAO ExoTool image: https://docs.docker.com/develop/develop-images/baseimages/
        - Base from: https://docs.docker.com/get-started/
        - Then add the security tools. See wiki: https://github.com/Qrucial/QRUCIAL-DAO/wiki
    - ink! smart contract "cargo audit --json" testing with QDAO ExoTool image: https://docs.substrate.io/tutorials/smart-contracts/first-smart-contract/
- Design solution for QDAO: distribute a script that grabs the node binary, installs requirements (docker) and connects them together.
- TBA for future: how to distribute images?
- Next steps: automatize the whole process and then connect it to ExoSys
    - Make "cargo audit --json" working with a standard rust project
        - This requires to be able to receive the files of the project (eg. Docker connected FS)
        - Where/how to save the output (eg. report folder)

### 2022.07.14. - ExoSys and ExoTool connection development
Participants: wigy, six, ra33it0
- In ExoSys: we can now make a distiction between Extrinsics Success and Failure.
- In ExoSys: We already have the scale encoded data.
- Plan created with the following todo points:
    - Save runtime metadata of QDAO into source code of ExoSys Daemon.
        - Note: whenever the runtime changes we need to updated the ExoSys Daemon as well.
        - Note: we need to make sure no block's event is missed aka spec verion. To be checked with Alexander.
    - Log the successful events to disk and also the arguments of extrinsics calls.
    - Based on the result
        - If extrinsics call is a success
            - If balance transfer is success (we burn with balances pallet's reduce) 
                - If smart contract path is valid: then execute the tools.
    - We need to look into:
        - Tokio process

2022.07.18. - Élő score security and implementation draft
Participants: ra33it0, six

We talked about possible exploitation methods.
Most attack vectors are already remediated, but the multi-acc farming
At this stage the CCTF pool solves this for us
QRUCIAL ambassadors can also solve it as one source of auditor
Further sources to be defined
Example implementation by other team
https://urcra.github.io/skill-rating/doc/skill_rating/elo/index.html
https://github.com/ivpusic/rust-elo
