#!/bin/python3
# ExoSys Daemon PoC

from substrateinterface import *
import subprocess

substrate = SubstrateInterface(
    url="ws://127.0.0.1:9944",
    ss58_format=42,
)

def subscription_handler(obj, update_nr, subscription_id):
    block_id = obj['header']['number']
    block_hash = substrate.get_block_hash(block_id)
    events = substrate.get_events(block_hash)
    #print(f">> New finalized block = #{block_id}")

    for event in events:
        # https://github.com/polkascan/py-scale-codec/blob/master/scalecodec/types.py#L2204
        module_event = event.value_object['event'][0]
        if module_event == "TemplateModule":
            print(event.value_object['event'])
            # TBA: check ID of extrinsics
            # Based on whitelist, execute the tool
            # Plus extrinsics requestor should be able to specify a whitelisted parameter
            subprocess.run(["/usr/bin/sleep", "50"], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
            # check by nc -nlvp 8080
    
    if update_nr > 33:
        return {'message': 'Subscription will cancel when a value is returned', 'updates_processed': update_nr}

result = substrate.subscribe_block_headers(subscription_handler, finalized_only=True)
# Then comes output, report generation, encryption, proposal at fixed block, release, verification against other executions, manual audit
