#![deny(unused_crate_dependencies)]

use anyhow::Result;

use clap::Parser;
use frame_metadata::RuntimeMetadata;
use jsonrpsee::core::client::ClientT;
use jsonrpsee::{rpc_params, ws_client::WsClientBuilder};
use lazy_static::lazy_static;
use parity_scale_codec::Decode;
use regex::Regex;
use serde_json::value::Value;
use sp_core::{twox_128, H256};
mod error;

use substrate_parser::{
    cards::{Event, ParsedData, Sequence},
    decode_blob_as_type,
};

const MODULE_NAME: &str = "ExoSys";
const EXECUTION_REQUEST_NAME: &str = "ExecutionRequest";
const WHO: &str = "who";
const HASH: &str = "hash";
const URL: &str = "url";

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

pub fn unhex(hex_input: &str, what: error::NotHex) -> Result<Vec<u8>, error::Error> {
    let hex_input_trimmed = {
        if let Some(hex_input_stripped) = hex_input.strip_prefix("0x") {
            hex_input_stripped
        } else {
            hex_input
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

    let address = address_with_port(&args.url);
    let client = WsClientBuilder::default().build(&address).await?;

    let mut uptime = 0;
    let mut last_block = String::new();
    loop {
        let params = rpc_params![];
        let block_hash_data: Value = client.request("chain_getBlockHash", params).await?;
        let block_hash = if let Value::String(a) = block_hash_data {
            a
        } else {
            println!("Unexpected block hash format.");
            continue;
        };

        if last_block == block_hash {
            continue;
        } else {
            last_block = block_hash.clone();
        }

        let metadata: Value = client
            .request("state_getMetadata", rpc_params![&block_hash])
            .await?;

        let metadata_v14 = if let Value::String(hex_meta) = metadata {
            let meta = unhex(&hex_meta, error::NotHex::Value).unwrap();
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

        let events = client
            .request(
                "state_getStorage",
                rpc_params![
                    &format!(
                        "0x{}{}",
                        hex::encode(twox_128(b"System")),
                        hex::encode(twox_128(b"Events"))
                    ),
                    &block_hash
                ],
            )
            .await?;

        //TODO: turn this into separate crate, this is so reusable!
        for pallet in metadata_v14.pallets.iter() {
            if let Some(storage) = &pallet.storage {
                if storage.prefix == "System" {
                    for entry in storage.entries.iter() {
                        if entry.name == "Events" {
                            if let Value::String(ref hex_data) = events {
                                let mut data = unhex(hex_data, error::NotHex::Value).unwrap();
                                let ty_symbol = match entry.ty {
                                    frame_metadata::v14::StorageEntryType::Plain(a) => a,
                                    frame_metadata::v14::StorageEntryType::Map {
                                        hashers: _,
                                        key: _,
                                        value,
                                    } => value,
                                };
                                match decode_blob_as_type(&ty_symbol, &mut data, &metadata_v14) {
                                    Ok(data_parsed) => {
                                        if !data.is_empty() {
                                            println!("Not empty data when done")
                                        }
                                        if let ParsedData::SequenceRaw(a) = data_parsed.data {
                                            for i in a.data {
                                                if let ParsedData::Composite(b) = i {
                                                    for j in b {
                                                        if j.field_name == Some("event".to_string())
                                                        {
                                                            if let ParsedData::Event(Event(c)) =
                                                                j.data.data
                                                            {
                                                                if c.pallet_name == MODULE_NAME
                                                                    && c.variant_name
                                                                        == EXECUTION_REQUEST_NAME
                                                                {
                                                                    let mut who: Option<sp_core::crypto::AccountId32> = None;
                                                                    let mut hash: Option<H256> =
                                                                        None;
                                                                    let mut url: Option<String> =
                                                                        None;
                                                                    for l in c.fields {
                                                                        if let Some(e) =
                                                                            l.field_name
                                                                        {
                                                                            match e.as_str() {
                                                                                WHO => if let ParsedData::Id(f) = l.data.data {
                                                                                    who = Some(f);
                                                                                },
                                                                                HASH => if let ParsedData::H256(f) = l.data.data {
                                                                                    hash = Some(f)
                                                                                },
                                                                                URL => if let ParsedData::Sequence(f) = l.data.data {
                                                                                    if let Sequence::U8(g) = f.data {
                                                                                        if let Ok(url_string) = String::from_utf8(g) {
                                                                                            url = Some(url_string);
                                                                                        } else {
                                                                                            println!("Error! url is not UTF-8");
                                                                                        }
                                                                                    }
                                                                                },
                                                                                _ => println!("warning: unknown field in execution request event"),
                                                                            }
                                                                        }
                                                                    }
                                                                    if let Some(arg_who) = who {
                                                                        if let Some(arg_hash) = hash
                                                                        {
                                                                            if let Some(arg_url) =
                                                                                url
                                                                            {
                                                                                println!(
                                                                                    "who: {:?}",
                                                                                    arg_who
                                                                                );
                                                                                println!(
                                                                                    "hash: {:?}",
                                                                                    arg_hash
                                                                                );
                                                                                println!(
                                                                                    "url: {:?}",
                                                                                    arg_url
                                                                                );

                                                                                let arg_full_hash=format!("{:?}", arg_hash);
                                                                                println!(
                                                                                    "Author with ID {:?} requested to run exotool: {:?}",
                                                                                    arg_who,
                                                                                    std::process::Command::new("../exotools/exotool.sh")
                                                                                        .args([arg_url, arg_full_hash])
                                                                                        .spawn());
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    Err(e) => println!("Error: {:?}", e),
                                }
                            }
                        }
                    }
                }
            }
        }
        println!("block: {}", block_hash);
        println!("======= uptime: {} =======", uptime);
        uptime += 1;
        /*
        if uptime > 2 {
        }
        */
        std::thread::sleep(std::time::Duration::from_secs(1));
    }
}
