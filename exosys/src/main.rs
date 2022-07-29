use anyhow::Result;

use async_stream::try_stream;
use clap::Parser;
use frame_metadata::{RuntimeMetadata, RuntimeMetadataV14};
use futures::stream::Stream;
use futures_util::{pin_mut, stream::StreamExt};
use jsonrpsee::ws_client::{WsClient, WsClientBuilder};
use lazy_static::lazy_static;
use parity_scale_codec::Decode;
use regex::Regex;
use serde_json::value::Value;
use sp_core::twox_128;
use subxt::{
    rpc::{rpc_params, ClientT as _},
    sp_core, sp_runtime, Client, ClientBuilder, Config as SubConfig,
};
use tokio_scoped::scope;
mod error;

use parser::decode_blob_as_type;

/// QDAO ExoSys deamon
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
pub struct Args {
    // wss connection is indefinitely stuck, because the node does not respond anything when WSS is not configured properly on it.
    #[clap(short, long, default_value_t = String::from("ws://127.0.0.1:9944"))]
    pub url: String,
}

lazy_static! {
    /// Regex to add port to addresses that have no port specified.
    ///
    /// See tests for behavior examples.
    static ref PORT: Regex = Regex::new(r"^(?P<body>wss://[^/]*?)(?P<port>:[0-9]+)?(?P<tail>/.*)?$").expect("known value");
}

pub struct Config;

impl SubConfig for Config {
    type Index = u32;
    type BlockNumber = u32;
    type Hash = sp_core::H256;
    type Hashing = sp_runtime::traits::BlakeTwo256;
    type AccountId = sp_runtime::AccountId32;
    type Address = sp_runtime::MultiAddress<Self::AccountId, u32>;
    type Header = sp_runtime::generic::Header<Self::BlockNumber, sp_runtime::traits::BlakeTwo256>;
    type Signature = sp_runtime::MultiSignature;
    type Extrinsic = sp_runtime::OpaqueExtrinsic;
}

pub fn unhex(hex_input: &str, what: error::NotHex) -> Result<Vec<u8>, error::Error> {
    let hex_input_trimmed = {
        if hex_input.starts_with("0x") {
            &hex_input[2..]
        } else {
            &hex_input
        }
    };
    hex::decode(hex_input_trimmed).map_err(|_| error::Error::NotHex(what))
}

/// Supply address with port if needed.
///
/// Transform address as it is displayed to user in <https://polkadot.js.org/>
/// to address with port added if necessary that could be fed to `jsonrpsee`
/// client.
///
/// The port is set here to default 443 if there is no port specified in
/// address itself, since default port in `jsonrpsee` is unavailable for now.
///
/// See for details <https://github.com/paritytech/jsonrpsee/issues/554`>
///
/// Some addresses have port specified, and should be left as is.
fn address_with_port(str_address: &str) -> String {
    match PORT.captures(str_address) {
        Some(caps) => {
            if caps.name("port").is_some() {
                str_address.to_string()
            } else {
                match caps.name("tail") {
                    Some(tail) => format!("{}:443{}", &caps["body"], tail.as_str()),
                    None => format!("{}:443", &caps["body"]),
                }
            }
        }
        None => str_address.to_string(),
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();
    /*
    let ws_client = jsonrpsee::ws_client::WsClientBuilder::default()
        .connection_timeout(std::time::Duration::from_secs(10)) //Not sure these things are needed
        //here since it's local
        .request_timeout(std::time::Duration::from_secs(5))
        .build(args.url)
        .await?;
    let rpc_client: Client<Config> = ClientBuilder::default()
        .set_client(ws_client)
        .build()
        .await?;
    */

    let address = address_with_port(&args.url);
    let client = WsClientBuilder::default().build(&address).await?;

    //Placeholder
    let short_specs = definitions::network_specs::ShortSpecs {
        base58prefix: 42,
        decimals: 12,
        genesis_hash: [
            225, 67, 242, 56, 3, 172, 80, 232, 246, 248, 230, 38, 149, 209, 206, 158, 78, 29, 104,
            170, 54, 193, 205, 44, 253, 21, 52, 2, 19, 243, 66, 62,
        ]
        .into(),
        name: "westend".to_string(),
        unit: "WND".to_string(),
    };

    let mut uptime = 0;
    loop {
        let params = rpc_params![];
        let block_hash_data: Value = client.request("chain_getBlockHash", params).await?;
        let block_hash = if let Value::String(a) = block_hash_data {
            a
        } else {
            println!("Unexpected block hash format.");
            continue;
            "".to_string();
        };

        let metadata: Value = client
                    .request("state_getMetadata", rpc_params![&block_hash])
                    .await?;

        let metadata_v14 = if let Value::String(hex_meta) = metadata {
            let hex_meta = {
                if hex_meta.starts_with("0x") {
                    &hex_meta[2..]
                } else {
                    &hex_meta
                }
            };

            let meta = hex::decode(hex_meta)?;
            if !meta.starts_with(&[109, 101, 116, 97]) {
                return Err(Box::from("Wrong start"));
            }
            match RuntimeMetadata::decode(&mut &meta[4..]) {
                Ok(RuntimeMetadata::V14(out)) => out,
                Ok(_) => continue,
                Err(_) => continue,
            }
        } else {
            continue;
        };


        let events = client.request(
            "state_getStorage",
            rpc_params![
                &format!(
                    "0x{}{}",
                    hex::encode(twox_128(b"System")),
                    hex::encode(twox_128(b"Events"))
                ),
                &block_hash
            ]).await?;

        for pallet in metadata_v14.pallets.iter() {
            if let Some(storage) = &pallet.storage {
                if storage.prefix == "System" {
                    for entry in storage.entries.iter() {
                        if entry.name == "Events" {
                            if let Value::String(ref hex_data) = events {
                                let mut data = unhex(&hex_data, error::NotHex::Value).unwrap();
                                let ty_symbol = match entry.ty {
                                    frame_metadata::v14::StorageEntryType::Plain(a) => a,
                                    frame_metadata::v14::StorageEntryType::Map {
                                        hashers: _,
                                        key: _,
                                        value,
                                    } => value,
                                };
                                let ty = metadata_v14.types.resolve(ty_symbol.id()).unwrap();
                                match decode_blob_as_type(&mut data, &ty, &metadata_v14) {
                                    Ok(data_parsed) => {
                                        if !data.is_empty() {
                                            println!("Not empty data when done")
                                        }
                                        let mut method = String::new();
                                        for (i, x) in data_parsed.iter().enumerate() {
                                            if i > 0 {
                                                method.push_str(",\n");
                                            }
                                            method.push_str(
                                                &x.card.show_no_docs(x.indent, &short_specs),
                                            );
                                        }
                                        println!("{}", method);
                                    }
                                    Err(e) => println!("Error: {:?}", e),
                                }
                            }
                        }
                    }
                }
            }
        }
        println!("======= uptime: {} =======", uptime);
        uptime += 1;
        std::thread::sleep(std::time::Duration::from_secs(1));
    }

    Ok(())
}
