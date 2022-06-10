# QRUCIAL-DAO
Web3 security DAO.

Built on top of Substrate, Qrucial DAO is a system for transparent audits and certifications, issuing non-transferable NFTs to the audited systems themselves.


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
