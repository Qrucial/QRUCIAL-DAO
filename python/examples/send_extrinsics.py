from substrateinterface import SubstrateInterface, Keypair
from substrateinterface.exceptions import SubstrateRequestException
from scalecodec.base import ScaleBytes, ScaleDecoder, RuntimeConfiguration

substrate = SubstrateInterface(
    url="ws://127.0.0.1:9944",
#    ss58_format=42,
#    type_registry_preset='default'
)
substrate.init_runtime()
#print(substrate.runtime_config.implements_scale_info)
#print(substrate.runtime_config.type_registry['types'])

#enc_data = '0x080000000000'
enc_data = '0x0500001cbd2d43530a44705ad088af313e18f80b53ef16b36177cd4b77b846f2a5f07cced65a1d'
c = substrate.runtime_config
call_decoder = c.type_registry['types']['call']
call_decoder.runtime_config = c
xx = call_decoder(ScaleBytes(enc_data))

#xx = substrate.runtime_config.create_scale_object('Call', data = ScaleBytes(enc_data))
print(xx)
#enc_hash = '0x5384d4099b9c6cbdddec5900df7b28ef85e9ba75fd6aa0cc47f5bb8246c2de96'

exit()

# RPC call for metadata json
#get_meta = substrate.rpc_request(method="state_getMetadata", params=[])
#print(ScaleBytes(get_meta['result']))

#substrate.metadata_decoder = RuntimeConfiguration().create_scale_object(
#            'MetadataVersioned', data=ScaleBytes(get_meta['result'])
#        )
#substrate.metadata_decoder = substrate.get_block_metadata(block_hash=runtime_block_hash, decode=True)
#substrate.metadata_decoder.decode()
#print(substrate.metadata_decoder)
#exit()

keypair = Keypair.create_from_uri('bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice')
#print(keypair.ss58_address)
#exit()

call = substrate.compose_call(
    call_module='Balances',
    call_function='transfer',
#    call_module='TemplateModule',
#    call_function='toolExecReq',
    call_params={
        'dest': '5E9oDs9PjpsBbxXxRE9uMaZZhnBAV38n2ouLB28oecBDdeQo',
#        'toolId': '0',
        'value': 1 * 10**9
    }
)

extrinsic = substrate.create_signed_extrinsic(call=call, keypair=keypair)
print(extrinsic)

try:
    receipt = substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)
    print("Extrinsic '{}' sent and included in block '{}'".format(receipt.extrinsic_hash, receipt.block_hash))

except SubstrateRequestException as e:
    print("Failed to send: {}".format(e))
