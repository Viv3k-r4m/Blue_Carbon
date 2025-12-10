import json, hashlib
from web3 import Web3
from contract_interface import w3, get_account, sign_and_send_raw, load_abi

ADD = json.load(open('../deployed/addresses.json'))
REG = w3.eth.contract(address=Web3.to_checksum_address(ADD['registry']), abi=load_abi('../deployed/MRVRegistry.json'))

def estimate_biomass(avg_ndvi, area_ha):
    factor = max(0.1, min(10.0, avg_ndvi * 10))
    return int(factor * area_ha)

def pin_simulate(payload):
    s = json.dumps(payload, sort_keys=True).encode()
    h = hashlib.sha256(s).hexdigest()
    return "sha256:" + h

def process_and_submit(drone_json_path):
    with open(drone_json_path) as f:
        data = json.load(f)
    avg_ndvi = data.get('avg_ndvi', 0.5)
    area = data.get('area_ha', 1.0)
    biomass = estimate_biomass(avg_ndvi, area)
    metadata = {
        "source": "drone",
        "avg_ndvi": avg_ndvi,
        "area_ha": area,
        "estimated_biomass_tons": biomass,
        "images": data.get('images', [])
    }
    uri = pin_simulate(metadata)
    print("metadata_uri:", uri, "biomass:", biomass)
    tx = REG.functions.submitProject(uri, biomass).build_transaction({'from': get_account()})
    r = sign_and_send_raw(tx)
    print("submitted tx:", r.transactionHash.hex())
    return r

if __name__ == '__main__':
    sample = {"avg_ndvi": 0.6, "area_ha": 2.5, "images": ["img1.jpg"]}
    with open("sample_drone.json", "w") as fh:
        json.dump(sample, fh)
    process_and_submit("sample_drone.json")
