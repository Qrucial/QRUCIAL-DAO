# QRUCIAL-DAO
Web3 security DAO. 

Built on top of Substrate, Qrucial DAO is a system for transparent audits and certifications, issuing non-transferable NFTs to the audited systems themselves.

Tool execution flow: Signed extrinsic incoming -> Verification -> Listing in QDAO State -> Event triggered (glue reads JSON RPC) -> Execution and result output -> Glue Extrinsic -> Aggregate and verify restuls -> Report delivery (encrypted, details tba)

We are currently in the process of requesting a grant from W3F: [Proposal Repository](https://github.com/smilingSix/Grants-Program)

## Development notes

### 2022.06.10. - Runtime and core system
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

### 2022.06.14. - ExoGlue PoC
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
- Rewriting the grant request as W3F requested
- Decision to use separate private key for each node (from the native keystore)
- AppCrypto, --key-type --> exos (unique to this project). Generate with:
    - ./qdao-node key insert --key-type exos --scheme sr25519
    - File path example: .local/share/qdao-node/chains/local_testnet/keystore/65786f7346ebddef8cd9bb167dc30878d7113b7e168e6f0646beffd77d69d39bad76b47a
    - So this SCALE encodes to filename
    - This can be enumerated from the pallet
- Next step: using the generated key for ExoSys

