# QRUCIAL-DAO
Web3 security DAO.

Built on top of Substrate, Qrucial DAO is a system for transparent audits and certifications, issuing non-transferable NFTs to the audited systems themselves.

Tool execution flow: Signed extrinsic incoming -> Verification -> Listing in QDAO State -> Event triggered (glue reads JSON RPC) -> Execution and result output -> Glue Extrinsic -> Aggregate and verify restuls -> Report delivery (encrypted, details tba)


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
