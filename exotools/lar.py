#!/usr/bin/python3
# QDAO API
# Author: six

from flask import Flask, jsonify, request
from flask import send_from_directory
import os
from subprocess import run
from substrateinterface import SubstrateInterface, Keypair
from substrateinterface.exceptions import SubstrateRequestException
import time
import logging
import sqlite3
import json

## Development mode and settings
debugState = True
dummyMode = True
DontHakit = "Donthakit"
dbFile = "temp.db"

## Logging to stdout for testing/debugging (TODO, log to files)
class CustomFormatter(logging.Formatter):
    grey = "\x1b[38;20m"
    yellow = "\x1b[33;20m"
    red = "\x1b[31;20m"
    bold_red = "\x1b[31;1m"
    reset = "\x1b[0m"
    format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s (%(filename)s:%(lineno)d)"

    FORMATS = {
        logging.DEBUG: grey + format + reset,
        logging.INFO: grey + format + reset,
        logging.WARNING: yellow + format + reset,
        logging.ERROR: red + format + reset,
        logging.CRITICAL: bold_red + format + reset
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)

# Create logger 
logger = logging.getLogger("qdao")
logger.setLevel(logging.DEBUG)

# Create console handler with a higher log level for debugging
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
ch.setFormatter(CustomFormatter())
logger.addHandler(ch)
if debugState == True:
    logger.debug("QDAO's lar.py is running in debug mode!")

# Create temporary database for testing/development purposes
logger.debug("Development database is being initialized")
def init_db():
    try:
        my_file = open("temp.db")
        return #jajjdecsunyaezitt
    except IOError:
        pass
    conn = sqlite3.connect(dbFile)
    c = conn.cursor()
    # Create inbuilt auditors
    c.execute('CREATE TABLE IF NOT EXISTS auditors (address text, profileHash text, name text, picUrl text, webUrl text, bio text, auditsDone text)')
    c.execute("INSERT INTO auditors VALUES ('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', '0x00', 'Alice', 'https://git.hsbp.org/avatars/8e4b4863a9f70ff176538149e61ce1e6?size=870', 'https://qrucial.io/', 'Bio of X user is text.', 'Feature to be added in milestone 3.')")
    c.execute("INSERT INTO auditors VALUES ('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', '0x00', 'Bob', 'https://git.hsbp.org/avatars/8e4b4863a9f70ff176538149e61ce1e6?size=870', 'https://qrucial.io/', 'Bio of Y user is text.', 'Feature to be added in milestone 3.')")
    c.execute("INSERT INTO auditors VALUES ('5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y', '0x00', 'Charlie', 'https://git.hsbp.org/avatars/8e4b4863a9f70ff176538149e61ce1e6?size=870', 'https://qrucial.io/', 'Bio of Z user is text.', 'Feature to be added in milestone 3.')")
    c.execute("INSERT INTO auditors VALUES ('5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy', '0x00', 'Dave', 'https://git.hsbp.org/avatars/8e4b4863a9f70ff176538149e61ce1e6?size=870', 'https://qrucial.io/', 'Bio of W user is text.', 'Feature to be added in milestone 3.')")
    c.execute("INSERT INTO auditors VALUES ('5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw', '0x00', 'Eve', 'https://git.hsbp.org/avatars/8e4b4863a9f70ff176538149e61ce1e6?size=870', 'https://qrucial.io/', 'Bio of T user is text.', 'Feature to be added in milestone 3.')")
    c.execute("INSERT INTO auditors VALUES ('5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL', '0x00', 'Ferdie', 'https://git.hsbp.org/avatars/8e4b4863a9f70ff176538149e61ce1e6?size=870', 'https://qrucial.io/', 'Bio of S user is text.', 'Feature to be added in milestone 3.')")
    c.execute("INSERT INTO auditors VALUES ('5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY', '0x00', 'Alice//stash', 'https://git.hsbp.org/avatars/8e4b4863a9f70ff176538149e61ce1e6?size=870', 'https://qrucial.io/', 'Bio of user is text.', 'Feature to be added in milestone 3.')")
    c.execute("INSERT INTO auditors VALUES ('5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc', '0x00', 'Bob//stash', 'https://git.hsbp.org/avatars/8e4b4863a9f70ff176538149e61ce1e6?size=870', 'https://qrucial.io/', 'Bio of user is text.', 'Feature to be added in milestone 3.')")
    c.execute("INSERT INTO auditors VALUES ('5Ck5SLSHYac6WFt5UZRSsdJjwmpSZq85fd5TRNAdZQVzEAPT', '0x00', 'Charlie//stash', 'https://git.hsbp.org/avatars/8e4b4863a9f70ff176538149e61ce1e6?size=870', 'https://qrucial.io/', 'Bio of user is text.', 'Feature to be added in milestone 3.')")
    c.execute("INSERT INTO auditors VALUES ('5HKPmK9GYtE1PSLsS1qiYU9xQ9Si1NcEhdeCq9sw5bqu4ns8', '0x00', 'Dave//stash', 'https://git.hsbp.org/avatars/8e4b4863a9f70ff176538149e61ce1e6?size=870', 'https://qrucial.io/', 'Bio of user is text.', 'Feature to be added in milestone 3.')")
    c.execute("INSERT INTO auditors VALUES ('5FCfAonRZgTFrTd9HREEyeJjDpT397KMzizE6T3DvebLFE7n', '0x00', 'Eve//stash', 'https://git.hsbp.org/avatars/8e4b4863a9f70ff176538149e61ce1e6?size=870', 'https://qrucial.io/', 'Bio of user is text.', 'Feature to be added in milestone 3.')")
    c.execute("INSERT INTO auditors VALUES ('5CRmqmsiNFExV6VbdmPJViVxrWmkaXXvBrSX8oqBT8R9vmWk', '0x00', 'Ferdie//stash', 'https://git.hsbp.org/avatars/8e4b4863a9f70ff176538149e61ce1e6?size=870', 'https://qrucial.io/', 'Bio of user is text.', 'Feature to be added in milestone 3.')")
    # Create audit db 
    c.execute('CREATE TABLE IF NOT EXISTS auditStates (hash text, projectUrl text, state text, autoReport text, manualReport text, topAuditor text, challenger text)')
    c.execute("INSERT INTO auditStates VALUES('0x11', 'https://v-space.hu/s/exotestflipper.tar', 'In progress', 'Not submitted yet', 'Not submitted yet', 'Eve', 'No challenger')")
    c.execute("INSERT INTO auditStates VALUES('0x11', 'https://v-space.hu/s/exotestflipper.tar', 'In progress', 'Not submitted yet', 'Not submitted yet', 'h4xor', 'No challenger')")
    conn.commit()
    conn.close()
init_db()

## Interface for QDAO
substrate=None
if dummyMode == False:
    logger.debug("Connecting to local QDAO node")
    while substrate==None:
        try:
            substrate = SubstrateInterface(
                url="ws://127.0.0.1:9944",
                ss58_format=42,
                type_registry_preset='kusama'
            )
            logger.info("Successfullly connected to QDAO chain!")
        except Exception as e:
            logger.info("Couldn't connect to QDAO's WebSocket. Trying again in 5 seconds.")
            time.sleep(5)
        pass
else:
    logger.warning("Dummy mode is ON, not connecting to QDAO node")

## Security keys !! TODO make them unique and stored only in mem !! and securely share with exotool.sh
# Tip: subkey inspect-key //Alice
# SS58 Address: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
logger.warning("We are using Alice's key!")
keypair = Keypair.create_from_seed('0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a') # Alice
api_key = 'x7roVhBsiZ18Dg3DX3iCm9pXhXdbZWx2'

## Flask app and routes
app=Flask(__name__)

# Only allow whitelisted characters in the database
address_whitelist = [
'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
'1','2','3','4','5','6','7','8','9','0']
text_whitelist = [
'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
'1','2','3','4','5','6','7','8','9','0',
'-',':','.',',','/','?','_','&','#', ' ']

def check_address(_address):
    counter = 0
    for char in _address:
        counter = counter + 1
        if counter > 256:
            return False
        if char in address_whitelist:
            pass
        else:
            return False
    return True

def check_text(_text):
    counter = 0
    for char in _text:
        counter = counter + 1
        if counter > 256:
            return False
        if char in text_whitelist:
            pass
        else:
            return False
    return True

# Route used for testing that the service is running
@app.route("/",methods=['GET'])
def index():
    if request.method == 'GET':
        arg_t = request.args.get('test')
        if arg_t == "works":
            logger.debug("GET test result: HTTP API is working!")
            return jsonify("OK, it works.")
        return jsonify("OK, try ?test=works")
    else:
        logger.debug("GET test result: HTTP API error 400")
        return jsonify({'Error':"This is a GET API method"}), 400

# ExoTool calls this, letting lar.py know some execution has finished
# curl -X POST "http://127.0.0.1:9999/notify_logger?key=x7roVhBsiZ18Dg3DX3iCm9pXhXdbZWx2&hash=0x9b945af23f0701cddcdb7dabcd72c9c7ffd3a155ace237a084b65460a9d36322&hash=0xa03f6ba3eb8141f0f8daee4ea016d4144f44fc4cba9e7477a4c1f041aaeb6c38&result=1"
@app.route("/notify_logger", methods=['POST'])
def notif():
    if request.remote_addr == '127.0.0.1':
        pass
    else:
        return "IP address not allowed."
    if request.method == 'POST':
        api_key_received = request.args.get('key')
        hash_received = request.args.get('hash')        # TODO check validity, if it is keccak256
        result_received = request.args.get('result')    # TODO be more specific + validity + dont accept req without these
        if api_key == api_key_received:
            pass
        else:
            return jsonify("Wrong API key!")
        try:
            run( [ '/usr/bin/touch', '/tmp/lar_report.log' ] )         # TODO, Sample and debugging
        except:
            logger.warning("Couldn't touch ~/QRUCIAL-DAO/exotools/static/reports/, there is an execution error probably.")

        # Call QDAO chain and notify it about the execution and the status
        logger.info("Sending extrinsic to QDAO node.")
        call = substrate.compose_call(
        call_module='ExoSys',
        call_function='tool_exec_auto_report',
        call_params={
            'hash': str(hash_received),
            'result': str(result_received)
        })

        # Create the extrinsic itself
        extrinsic = substrate.create_signed_extrinsic(call=call, keypair=keypair)

        try:
            receipt = substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)
            logger.info("Extrinsic '{}' sent and included in block '{}'".format(receipt.extrinsic_hash, receipt.block_hash))
            return jsonify("Extrinsic has been sent.")

        except SubstrateRequestException as e:
            logger.info("Failed to send: {}".format(e))
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

# API routes for frontend

# Get user data as json, ID: substrate address
# Example: http://127.0.0.1:9999/auditors
@app.route('/auditors', methods=['GET'])
def get_auditors():
    conn = sqlite3.connect(dbFile)
    c = conn.cursor()
    c.execute('SELECT * FROM auditors')
    auditors = c.fetchall()
    conn.close()
    return jsonify(auditors)

# Example: http://127.0.0.1:9999/auditor-data?address=5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
@app.route('/auditor-data', methods=['GET'])
def get_auditordata():
    address = request.args.get('address', default = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", type = str)
    
    if check_address(address): pass
    else: return DontHakit

    conn = sqlite3.connect(dbFile)
    c = conn.cursor()
    c.execute('SELECT * FROM auditors WHERE address = "%s"' % address)
    auditorData = c.fetchall()
    conn.close()
    return jsonify(auditorData)

# Called at signup and profile update
# Button -> open polkadotJS -> sign message -> POST to API
# !!! TBA!! Check signature of the message and it must be POST ss58 address == ss58 signer !!! in dev we accept everything, but this needs to be changes in prod
# Test: curl -X POST -H "Content-type: application/json" -d "{\"address\" : \"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY\", \"profileHash\" : \"0x001x1x0\", \"name\" : \"n4me\", \"picUrl\" : \"userx.me/a.ng\", \"webUrl\" : \"nmexxa.org\", \"bio\" : \"Teh Bio of user aX\"}" "127.0.0.1:9999/profile_update" 
@app.route('/profile_update', methods=['POST'])
def profileUpdate():
    content_type = request.headers.get('Content-Type')
    if (content_type == 'application/json'):
        profile_data = request.json
        
        # Check input
        if check_address(profile_data['address']): pass
        else: return DontHakit

        if check_text(profile_data['profileHash']): pass
        else: return DontHakit        

        if check_text(profile_data['name']): pass
        else: return DontHakit

        if check_text(profile_data['picUrl']): pass
        else: return DontHakit

        if check_text(profile_data['webUrl']): pass
        else: return DontHakit

        if check_text(profile_data['bio']): pass
        else: return DontHakit

        conn = sqlite3.connect(dbFile)
        c = conn.cursor()
        c.execute('UPDATE auditors SET profileHash = "{}", name = "{}", picUrl = "{}", webUrl = "{}", bio = "{}" WHERE address = "{}"'.format(profile_data['profileHash'], profile_data['name'], profile_data['picUrl'], profile_data['webUrl'], profile_data['bio'], profile_data['address']))
        conn.commit()
        conn.close()
        return profile_data
    else:
        return 'Content-Type not supported!'

# TBA to be figured out, this needs to check blockchain data because we only want to save those entries that are valid/paid
@app.route('/request-audit', methods=['POST'])
def requestAudit():
    content_type = request.headers.get('Content-Type')
    if (content_type == 'application/json'):
        take_audit = request.json
        # TBA write data to DB
        return json
    else:
        return 'Content-Type not supported!'

# Get user data as json, ID: substrate address
# To be selected
# Example: 127.0.0.1:9999/audit-requests
@app.route('/audit-requests', methods=['GET'])
def get_auditRequests():
    conn = sqlite3.connect(dbFile)
    c = conn.cursor()
    c.execute('SELECT * FROM auditStates')
    auditRequests = c.fetchall()
    conn.close()
    # return hash and id
    return jsonify(auditRequests)

# TBA to be figured out
@app.route('/take_audit', methods=['POST'])
def takeAudit():
    content_type = request.headers.get('Content-Type')
    if (content_type == 'application/json'):
        take_audit = request.json
        # TBA write data to DB
        return json
    else:
        return 'Content-Type not supported!'

# TBA to be figured out
@app.route('/send_report', methods=['POST'])
def sendReport():
    content_type = request.headers.get('Content-Type')
    if (content_type == 'application/json'):
        report_data = request.json
        # TBA write data to DB
        return json
    else:
        return 'Content-Type not supported!'

# TBA to be figured out
# Example: http://127.0.0.1:9999/get-reports
@app.route('/get-reports', methods=['GET'])
def get_report():
    conn = sqlite3.connect(dbFile)
    c = conn.cursor()
    c.execute('SELECT * FROM auditStates')
    auditRequests = c.fetchall()
    conn.close()
    # return hash and id
    return jsonify(auditRequests)

if __name__ == '__main__':
    app.run(debug=debugState,host='127.0.0.1', port=9999)
