#!/bin/python3
# ExoGlue PoC

from substrateinterface import *
import subprocess

substrate = SubstrateInterface(
    url="ws://127.0.0.1:9944",
    ss58_format=42,
#    type_registry_preset='substrate-node-template'
)

#def subscribe_block_headers(self, subscription_handler: callable, ignore_decoding_errors: bool = False,
#                                include_author: bool = False, finalized_only=False):
def subscription_handler(obj, update_nr, subscription_id):
    #print(f">> New block #{obj['header']['number']} produced by {obj['header']}")
    block_id = obj['header']['number']
    print(f">> New finalized block = #{block_id}")

    #  get_block_hash(self, block_id: int) -> str:
    block_hash = substrate.get_block_hash(block_id)

    # def get_events(self, block_hash: str = None) -> list:
    events = substrate.get_events(block_hash)

    # event type is <class 'abc.scale_info::16'>
    for event in events:
        #print(type(event))#['event']['module_id'])
        #print(events)
        # https://github.com/polkascan/py-scale-codec/blob/master/scalecodec/types.py#L2204
        module_event = event.value_object['event'][0]
        if module_event == "TemplateModule":
            print(event.value_object['event'])
            subprocess.run(["/usr/bin/nmap", "127.0.0.1"], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
            # check by nc -nlvp 8080

    
    if update_nr > 33:
        return {'message': 'Subscription will cancel when a value is returned', 'updates_processed': update_nr}

result = substrate.subscribe_block_headers(subscription_handler, finalized_only=True)
# Then comes output, report generation, encryption, proposal at fixed block, release, verification against other executions, manual audit


# Comments for debug/research
        #curr_event = event.value_object['event'].value_object#['module_id']
        # {'event_index': '0800', 'module_id': 'TemplateModule', 'event_id': 'ExecutionRequest', 'attributes': (66666666, '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')}

        #print(event.value_object['event'].value_object['module_id'].value_object)
#        print(type(curr_event))
#        print(curr_event)
#        if event.value_object['event']['module_id'] == "TemplateModule":
#            print()

#{'event_index': '0800', 'module_id': 'TemplateModule', 'event_id': 'ExecutionRequest', 'attributes': (66666666, '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')}

# What happens on raw wss level
# {"id":13,"jsonrpc":"2.0","method":"chain_subscribeFinalizedHeads","params":[]}
# {"jsonrpc":"2.0","result":"1XhxY49mKPhY114T","id":13}
# {"jsonrpc":"2.0","method":"chain_finalizedHead","params":{"subscription":"O00wYWJ9bNCx22cr","result":{"parentHash":"0x104813bb06c0c2c4a2bb6aa0ef97fa0ff7057bf20004a43a009d4c76b63010b7","number":"0x22e","stateRoot":"0x558785d0f608615e9c91303a61e89c305210e5588fe691b2d718d6404deea4ed","extrinsicsRoot":"0xfae4ab5907139f87707541ca145fa7f04fbd3e59d8ddc38d1622a8deb51b56a7","digest":{"logs":["0x0661757261203065711000000000","0x056175726101016046f13193381060db65ea3afebe1f78f82c97cbf23950541a91af3306e9055761c304116b7fa41af6e7c38902d13fe5dd52da5034b2d892b5ed276c4a56bc87"]}}}}

# Calculate block hash
# https://github.com/polkascan/py-substrate-interface/blob/204a523602fdced3f2c19ab7401698a77bb710ed/substrateinterface/base.py#L893
