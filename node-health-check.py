#!/usr/bin/python3
# QDAO System Health Check
# Author: six
import requests
import psutil

def checkIfProcessRunning(processName):
    '''
    Check if there is any running process that contains the given name processName.
    '''
    for proc in psutil.process_iter():
        try:
            if processName.lower() in proc.name().lower():
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return False;

# Qdao node
if checkIfProcessRunning("qdao-node") == True:
    pass
else:
    print("! Error with qdao-node, not running.")

r = requests.get('http://127.0.0.1:9933/')
if r.status_code == 405:
    pass
else:
    print("! Error with qdao node on 9933")
    print(r.status_code)

r = requests.get('http://127.0.0.1:9944/')
if r.status_code == 405:
    pass
else:
    print("! Error with qdao node on 9944")
    print(r.status_code)

# Exosysd
if checkIfProcessRunning("qdao-exosysd") == True:
    pass
else:
    print("! Error with qdao-exosysd, not running.")

# API
r = requests.get('http://127.0.0.1:9999/')
if r.status_code == 200:
    pass
else:
    print("! Error with API on GET http://127.0.0.1:9999/")
    print(r.status_code)


r = requests.get('http://127.0.0.1:9999/auditors')
if r.status_code == 200:
    pass
else:
    print("! Error with API on GET http://127.0.0.1:9999/auditors")
    print(r.status_code)


r = requests.get('http://127.0.0.1:9999/auditors404')
if r.status_code == 404:
    pass
else:
    print("! Error with API on GET http://127.0.0.1:9999/auditors404")
    print(r.status_code)


# Frontend
r = requests.get('http://127.0.0.1:8000/')
if r.status_code == 200:
    pass
else:
    print("! Error with FrontEnd on GET http://127.0.0.1:8000/")
    print(r.status_code)