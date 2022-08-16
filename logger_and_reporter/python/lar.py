#!/usr/bin/python3
# QDAO Logger and Notifier API
# Author: six

from flask import Flask, jsonify, request
from flask import send_from_directory
import os
from subprocess import run

 
app=Flask(__name__)
 
@app.route("/",methods=['GET'])
def index():
    if request.method == 'GET':
        arg_t = request.args.get('test')
        if arg_t == "works":
            return jsonify("OK, it works.")
        return jsonify("OK, try ?test=works")
    else:
        return jsonify({'Error':"This is a GET API method"})

# ExoTool calls this
api_key = 'gNLqjRqYkjn4msReKhXwuGnNr4' # TODO change this, generate for each instance!
@app.route("/notify_logger", methods=['POST'])
def notif():
    if request.method == 'POST':
        api_key_received = request.args.get('key')
        if api_key == api_key_received:
            pass
        else:
            return jsonify("Wrong API key!")
        run( [ '/usr/bin/touch', '/tmp/OK' ] )
        # Send extrinsics through subxt/sube #TODO
        return jsonify("Do the Work!")
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
    app.run(debug=True,host='0.0.0.0', port=9999)
