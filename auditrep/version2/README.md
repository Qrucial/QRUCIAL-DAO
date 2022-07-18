# rust-elo

[![Build Status](https://travis-ci.org/ivpusic/rust-elo.svg?branch=master)](https://travis-ci.org/ivpusic/rust-elo)

Rust crate for calculating player rating based on elo ranking system

## Installation

Add to your `Cargo.toml`

```bash
[dependencies]
elo = "0.2.1"
```

## Example usage

```rust
extern crate elo;

use elo::EloRank;

fn main() {
    let elo = EloRank { k: 32 };
    let winner = 1200.0;
    let looser = 1400.0;

    let (winner_new_score, looser_new_score) = elo.calculate(winner, looser);
}
```
