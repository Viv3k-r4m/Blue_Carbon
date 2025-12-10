import os, json
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

RPC = os.getenv("RPC_URL", "http://127.0.0.1:8545")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
OWNER_ADDRESS = os.getenv("OWNER_ADDRESS")

w3 = Web3(Web3.HTTPProvider(RPC))
if not w3.is_connected():
    raise RuntimeError("Cannot connect to RPC at " + RPC)

def load_abi(path):
    with open(path, 'r') as f:
        artifact = json.load(f)
        return artifact["abi"]

def load_addresses(path):
    with open(path, "r") as f:
        return json.load(f)

def get_account():
    return w3.to_checksum_address(OWNER_ADDRESS)

def sign_and_send_raw(txn):
    # txn built and already contains 'to', 'data', 'value' etc.
    acct = get_account()
    nonce = w3.eth.get_transaction_count(acct)
    txn.update({'nonce': nonce, 'gas': 3_000_000, 'maxPriorityFeePerGas': w3.to_wei(2, 'gwei'), 'maxFeePerGas': w3.to_wei(30, 'gwei')})
    signed = w3.eth.account.sign_transaction(txn, PRIVATE_KEY)
    txh = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(txh)
    return receipt
