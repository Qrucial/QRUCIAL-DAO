#!/usr/bin/python3

# Monitor JSON RPC
# https://pypi.org/project/jsonrpc-requests/
# https://docs.substrate.io/v3/runtime/custom-rpcs/
# $ curl -H "Content-Type: application/json" -d '{"id":1, "jsonrpc":"2.0", "method": "state_getMetadata"}' http://localhost:9933/
import json
import requests    

def check_rpc():
    url = "http://localhost:9933/"
    headers = {'content-type': "application/json", 'cache-control': "no-cache"}
    payload = json.dumps({"id":1, "jsonrpc":"2.0", "method": "state_getMetadata"})
    print(payload)

    try:
        response = requests.request("POST", url, data=payload, headers=headers)
        return json.loads(response.text)
    except requests.exceptions.RequestException as e:
        print(e)
    except:
        print('Exeption raised.')

resp = check_rpc()
#print(resp)
print(resp['result'])
#print(bytes.fromhex(resp['result']).decode('utf-8'))

# if resp...

# Execute tool
#import subprocess

#subprocess.run(["nmap", "127.0.0.1"], stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
# check by nc -nlvp 8080

# then comes output, report generation, encryption, proposal at fixed block, release, verification against other executions, manual audit
