use anyhow::Result;

use jsonrpsee::ws_client::WsClientBuilder;
use async_stream::try_stream;
use clap::Parser;
use frame_metadata::{RuntimeMetadata, RuntimeMetadataV14};
use futures::stream::Stream;
use futures_util::{pin_mut, stream::StreamExt};
use serde_json::value::Value;
use subxt::{
    rpc::{rpc_params, ClientT as _},
    sp_core, sp_runtime, Client, ClientBuilder, Config as SubConfig,
};
use tokio_scoped::scope;
mod error;

/// QDAO ExoSys deamon
#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
pub struct Args {
    // wss connection is indefinitely stuck, because the node does not respond anything when WSS is not configured properly on it.
    #[clap(short, long, default_value_t = String::from("ws://127.0.0.1:9944"))]
    pub url: String,
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

pub fn unhex(hex_input: &str, what: error::NotHex) -> Result<Vec<u8>, Error> {
    let hex_input_trimmed = {
        if hex_input.starts_with("0x") {
            &hex_input[2..]
        } else {
            &hex_input
        }
    };
    hex::decode(hex_input_trimmed).map_err(|_| Error::NotHex(what))
}

fn finalized_blocks(
    rpc_client: &Client<Config>,
) -> impl Stream<Item = Result<<Config as SubConfig>::Header>> + '_ {
    try_stream! {
        let subscription = rpc_client.rpc().subscribe_finalized_blocks().await?;
        for await header_res in subscription {
            let header = header_res?;
            yield header;
        }
    }
}

async fn dump_finalized_headers(rpc_client: &Client<Config>) -> () {
    let bytes: sp_core::Bytes = rpc_client
        .rpc()
        .client
        .request("state_getMetadata", rpc_params![])
        .await
        .unwrap();
    let mut decoder = desub::Decoder::new();
    let version = 14;
    decoder.register_version(version, &bytes).unwrap();

    let header_stream = finalized_blocks(rpc_client).take(5);
    pin_mut!(header_stream);
    while let Some(res) = header_stream.next().await {
        match res {
            Ok(header) => {
                let hash =
                    <<Config as SubConfig>::Hashing as sp_runtime::traits::Hash>::hash_of(&header);
                println!("Block #{} was finalized", hash);

                let block = rpc_client.rpc().block(Some(hash)).await;
                let extrinsics = block.unwrap().unwrap().block.extrinsics;
                println!("  extrinsics: {:?}", extrinsics);
                let extrinsics_bytes = subxt::codec::Encode::encode(&extrinsics);

                let extrinsics_cursor = &mut &extrinsics_bytes[..];
                let x = decoder
                    .decode_extrinsics(version, extrinsics_cursor)
                    .unwrap();
                //println!("{}", serde_json::to_string_pretty(&x).unwrap());

                let events = subxt::events::at::<Config, sp_core::Bytes>(rpc_client, hash)
                    .await
                    .unwrap();

                for event in events.iter_raw() {
                    println!("{:?}", &event);
                }
            }
            Err(err) => println!("Error: {}", err),
        }
    }
}

#[tokio::main]
pub async fn block_hash(
    str_address: &str,
    optional_block_number: Option<u32>,
) -> Result<String, Box<dyn std::error::Error>> {
    let address = address_with_port(str_address);
    let client = WsClientBuilder::default().build(&address).await?;
    let params = match optional_block_number {
        Some(a) => rpc_params![a],
        None => rpc_params![],
    };
    let block_hash_data: Value = client.request("chain_getBlockHash", params).await?;
    if let Value::String(a) = block_hash_data {
        Ok(a)
    } else {
        Err(Box::from("Unexpected block hash format."))
    }
}

#[tokio::main]
pub async fn block_metadata_v14(
    str_address: &str,
    optional_block_hash: Option<&str>,
) -> Result<RuntimeMetadataV14, Box<dyn std::error::Error>> {
    let address = address_with_port(str_address);
    let client = WsClientBuilder::default().build(&address).await?;
    let metadata: Value = match optional_block_hash {
        Some(block_hash) => {
            client
                .request("state_getMetadata", rpc_params![&block_hash])
                .await?
        }
        None => client.request("state_getMetadata", rpc_params![]).await?,
    };
    if let Value::String(hex_meta) = metadata {
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
            Ok(RuntimeMetadata::V14(out)) => Ok(out),
            Ok(_) => Err(Box::from("Version not v14")),
            Err(_) => Err(Box::from("Unable to decode metadata")),
        }
    } else {
        Err(Box::from("Unexpected metadata format"))
    }
}

#[tokio::main]
pub async fn get_value_from_storage(
    str_address: &str,
    whole_key: &str,
    block_hash: &str,
) -> Result<Value, Box<dyn std::error::Error>> {
    let address = address_with_port(str_address);
    let client = WsClientBuilder::default().build(&address).await?;
    let value: Value = client
        .request("state_getStorage", rpc_params![whole_key, block_hash])
        .await?;
    Ok(value)
}

#[tokio::main(worker_threads = 8)]
async fn main() -> Result<()> {
    let args = Args::parse();
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

    let block_hash = block_hash(address, optional_block_number).unwrap();

    let metadata_v14 = block_metadata_v14(address, Some(&block_hash)).unwrap();

    let metadata: Value = match optional_block_hash {
        Some(block_hash) => {
            client
                .request("state_getMetadata", rpc_params![&block_hash])
                .await?
        }
        None => client.request("state_getMetadata", rpc_params![]).await?,
    };

    let events = get_value_from_storage(
        address,
        &format!(
            "0x{}{}",
            hex::encode(twox_128(b"System")),
            hex::encode(twox_128(b"Events"))
        ),
        &block_hash,
    )
    .unwrap();

    if let Value::String(hex_data) = example_value {
        let mut data =
            unhex(&hex_data, error::NotHex::Value).unwrap();
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
                    method.push_str(&x.card.show_no_docs(x.indent, &short_specs));
                }
                println!("{}", method);
            }
            Err(e) => println!("Error: {:?}", e),
        }
    }

    Ok(())
}
