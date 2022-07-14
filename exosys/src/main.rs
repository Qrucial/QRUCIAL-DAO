use anyhow::Result;

use async_stream::try_stream;
use clap::Parser;
use futures::stream::Stream;
use futures_util::{pin_mut, stream::StreamExt};
use subxt::{
    rpc::{rpc_params, ClientT as _},
    sp_core, sp_runtime, Client, ClientBuilder, Config as SubConfig,
};
use tokio_scoped::scope;

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

#[tokio::main(worker_threads = 8)]
async fn main() -> Result<()> {
    let args = Args::parse();
    let ws_client = jsonrpsee::ws_client::WsClientBuilder::default()
        .connection_timeout(std::time::Duration::from_secs(10))
        .request_timeout(std::time::Duration::from_secs(5))
        .add_header("X-format", "my own proprietary format")
        .build(args.url)
        .await?;
    let rpc_client: Client<Config> = ClientBuilder::default()
        .set_client(ws_client)
        .build()
        .await?;
    
        let types = rpc_client.metadata().runtime_metadata().types.types();
        for r#type in types {
            println!(
                "{:02x}: {:?} ({})",
                r#type.id(),
                r#type.ty().type_def(), //.path(),
                r#type.ty().docs().join(" ")
            );
        }
        return Ok(());
    

    /*scope(|s| {
        s.spawn(dump_finalized_headers(&rpc_client));
        /*for i in 1..=8 {
            s.spawn(dump_finalized(&rpc_client, i));
        }*/
    });*/

    Ok(())
}
