#!/usr/bin/python3
# QDAO Logger and Notifier API
# Author: six

from flask import Flask, jsonify, request
from flask import send_from_directory
import os
from subprocess import run
from substrateinterface import SubstrateInterface, Keypair
from substrateinterface.exceptions import SubstrateRequestException


## Interface for QDAO
substrate = SubstrateInterface(
    url="ws://127.0.0.1:9944",
    ss58_format=42,
    type_registry_preset='kusama'
)

## Security keys !! TODO make them unique and stored only in mem !!
keypair = Keypair.create_from_mnemonic('bottom drive obey lake curtain smoke basket hold race lonely fit walk') # Alice
api_key = 'x7roVhBsiZ18Dg3DX3iCm9pXhXdbZWx2'

## Flask app and route
app=Flask(__name__)
 
@app.route("/",methods=['GET'])
def index():
    if request.method == 'GET':
        arg_t = request.args.get('test')
        if arg_t == "works":
            return jsonify("OK, it works.")
        return jsonify("OK, try ?test=works")
    else:
        return jsonify({'Error':"This is a GET API method"}), 400

# ExoTool calls this
# curl -X POST "http://127.0.0.1:9999/notify_logger?key=x7roVhBsiZ18Dg3DX3iCm9pXhXdbZWx2" 
@app.route("/notify_logger", methods=['POST'])
def notif():
    if request.remote_addr == '127.0.0.1':
        pass
    else:
        return ""
    if request.method == 'POST':
        api_key_received = request.args.get('key')
        if api_key == api_key_received:
            pass
        else:
            return jsonify("Wrong API key!")
        run( [ '/usr/bin/touch', '/tmp/OK' ] )

        # Send extrinsic !! TODO change this to QDAO's pallet extrinsic call !!
        call = substrate.compose_call(
        call_module='Balances',
        call_function='transfer',
        call_params={
            'dest': '5E9oDs9PjpsBbxXxRE9uMaZZhnBAV38n2ouLB28oecBDdeQo',
            'value': 1
        })

        extrinsic = substrate.create_signed_extrinsic(call=call, keypair=keypair)

        try:
            receipt = substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)
            print("Extrinsic '{}' sent and included in block '{}'".format(receipt.extrinsic_hash, receipt.block_hash))
            return jsonify("Extrinsic has been sent.")

        except SubstrateRequestException as e:
            print("Failed to send: {}".format(e))
            return jsonify("Extrinsic failed.")
    else:
        return jsonify("Wrong API request, we need POST here.")


# Return static files -> reports
static_file_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static') 
@app.route('/dir', methods=['GET'])
def serve_dir_directory_index():
    return send_from_directory(static_file_dir, 'index.html')
 
@app.route('/dir/<path:path>', methods=['GET'])
def serve_file_in_dir(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = os.path.join(path, 'index.html')
    return send_from_directory(static_file_dir, path) # Secure against dir trav
 
if __name__ == '__main__':
    app.run(debug=True,host='127.0.0.1', port=9999)
