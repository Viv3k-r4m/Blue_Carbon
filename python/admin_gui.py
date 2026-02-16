from flask import Flask, render_template, request, jsonify
from web3 import Web3
from contract_interface import w3, load_abi, load_addresses, sign_and_send_raw, get_account
import json
import os
import hashlib

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Load deployed contract addresses
ADD = load_addresses("../deployed/addresses.json")

REG = w3.eth.contract(
    address=Web3.to_checksum_address(ADD["registry"]),
    abi=load_abi("../deployed/MRVRegistry.json")
)

VM = w3.eth.contract(
    address=Web3.to_checksum_address(ADD["verificationManager"]),
    abi=load_abi("../deployed/VerificationManager.json")
)

TOKEN = w3.eth.contract(
    address=Web3.to_checksum_address(ADD["token"]),
    abi=load_abi("../deployed/CarbonCreditToken.json")
)

# ---------------------- ROUTES --------------------------

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('dashboard.html')

@app.route('/api/owner')
def get_owner():
    """Get registry owner"""
    try:
        owner_addr = REG.functions.owner().call()
        return jsonify({'success': True, 'owner': owner_addr})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/network-info')
def get_network_info():
    """Get network and account info"""
    try:
        is_connected = w3.is_connected()
        account = get_account()
        chain_id = w3.eth.chain_id if is_connected else 0
        
        return jsonify({
            'success': True,
            'connected': is_connected,
            'network': 'Hardhat Local' if chain_id == 31337 else f'Chain ID: {chain_id}',
            'account': account
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/project/<int:project_id>')
def get_project(project_id):
    """Get project details"""
    try:
        p = REG.functions.projects(project_id).call()
        project = {
            'id': p[0],
            'submitter': p[1],
            'metadataUri': p[2],
            'claimedTons': p[3],
            'approvedTons': p[4],
            'status': p[5],
            'submittedAt': p[6],
            'updatedAt': p[7]
        }
        return jsonify({'success': True, 'project': project})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/add-verifier', methods=['POST'])
def add_verifier():
    """Add a verifier address"""
    try:
        data = request.json
        address = data.get('address')
        if not address:
            return jsonify({'success': False, 'error': 'Address required'}), 400
        
        tx = REG.functions.addVerifier(address).build_transaction({"from": get_account()})
        receipt = sign_and_send_raw(tx)
        return jsonify({'success': True, 'tx': receipt.transactionHash.hex()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/remove-verifier', methods=['POST'])
def remove_verifier():
    """Remove a verifier address"""
    try:
        data = request.json
        address = data.get('address')
        if not address:
            return jsonify({'success': False, 'error': 'Address required'}), 400
        
        tx = REG.functions.removeVerifier(address).build_transaction({"from": get_account()})
        receipt = sign_and_send_raw(tx)
        return jsonify({'success': True, 'tx': receipt.transactionHash.hex()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/under-review', methods=['POST'])
def set_under_review():
    """Set project status to under review"""
    try:
        data = request.json
        project_id = data.get('project_id')
        if project_id is None:
            return jsonify({'success': False, 'error': 'Project ID required'}), 400
        
        tx = REG.functions.setUnderReview(project_id).build_transaction({"from": get_account()})
        receipt = sign_and_send_raw(tx)
        return jsonify({'success': True, 'tx': receipt.transactionHash.hex()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/approve', methods=['POST'])
def approve_project():
    """Approve a project"""
    try:
        data = request.json
        project_id = data.get('project_id')
        tons = data.get('tons')
        
        if project_id is None or tons is None:
            return jsonify({'success': False, 'error': 'Project ID and tons required'}), 400
        
        tx = REG.functions.approveProject(project_id, tons).build_transaction({"from": get_account()})
        receipt = sign_and_send_raw(tx)
        return jsonify({'success': True, 'tx': receipt.transactionHash.hex()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/reject', methods=['POST'])
def reject_project():
    """Reject a project"""
    try:
        data = request.json
        project_id = data.get('project_id')
        if project_id is None:
            return jsonify({'success': False, 'error': 'Project ID required'}), 400
        
        tx = REG.functions.rejectProject(project_id).build_transaction({"from": get_account()})
        receipt = sign_and_send_raw(tx)
        return jsonify({'success': True, 'tx': receipt.transactionHash.hex()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/issue-credits', methods=['POST'])
def issue_credits():
    """Issue carbon credits (tokenize approved project)"""
    try:
        data = request.json
        project_id = data.get('project_id')
        recipient = data.get('recipient')
        
        if project_id is None or not recipient:
            return jsonify({'success': False, 'error': 'Project ID and recipient address required'}), 400
        
        # Validate recipient is a valid address
        try:
            recipient = Web3.to_checksum_address(recipient)
        except:
            return jsonify({'success': False, 'error': 'Invalid recipient address'}), 400
        
        tx = VM.functions.issueCredits(project_id, recipient).build_transaction({"from": get_account()})
        receipt = sign_and_send_raw(tx)
        return jsonify({'success': True, 'tx': receipt.transactionHash.hex()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# ---------------------- DRONE INTEGRATION ----------------------

def estimate_biomass(avg_ndvi, area_ha):
    """Estimate biomass based on NDVI and area"""
    factor = max(0.1, min(10.0, avg_ndvi * 10))
    return int(factor * area_ha)

def create_metadata_uri(avg_ndvi, area_ha, images=None):
    """Create metadata URI from drone data"""
    metadata = {
        "source": "drone",
        "avg_ndvi": avg_ndvi,
        "area_ha": area_ha,
        "estimated_biomass_tons": estimate_biomass(avg_ndvi, area_ha),
        "images": images or []
    }
    s = json.dumps(metadata, sort_keys=True).encode()
    h = hashlib.sha256(s).hexdigest()
    return "sha256:" + h

@app.route('/api/submit-project', methods=['POST'])
def submit_project():
    """Submit a drone project"""
    try:
        data = request.json
        avg_ndvi = float(data.get('avg_ndvi', 0.5))
        area_ha = float(data.get('area_ha', 1.0))
        images = data.get('images', [])
        
        if avg_ndvi < 0 or avg_ndvi > 1:
            return jsonify({'success': False, 'error': 'NDVI must be between 0 and 1'}), 400
        if area_ha <= 0:
            return jsonify({'success': False, 'error': 'Area must be greater than 0'}), 400
        
        # Create metadata URI and calculate biomass
        uri = create_metadata_uri(avg_ndvi, area_ha, images)
        biomass = estimate_biomass(avg_ndvi, area_ha)
        
        # Submit to blockchain
        tx = REG.functions.submitProject(uri, biomass).build_transaction({"from": get_account()})
        receipt = sign_and_send_raw(tx)
        
        return jsonify({
            'success': True,
            'tx': receipt.transactionHash.hex(),
            'metadata_uri': uri,
            'biomass': biomass
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/all-projects')
def get_all_projects():
    """Get all projects"""
    try:
        # Get next project ID to know how many exist
        next_id = REG.functions.nextProjectId().call()
        projects = []
        
        for pid in range(1, next_id):
            try:
                p = REG.functions.projects(pid).call()
                status_map = {0: 'Submitted', 1: 'UnderReview', 2: 'Approved', 3: 'Tokenized', 4: 'Rejected'}
                projects.append({
                    'id': p[0],
                    'submitter': p[1],
                    'metadataUri': p[2],
                    'claimedTons': p[3],
                    'approvedTons': p[4],
                    'status': status_map.get(p[5], str(p[5])),
                    'statusCode': p[5],
                    'submittedAt': p[6],
                    'updatedAt': p[7]
                })
            except:
                pass
        
        return jsonify({'success': True, 'projects': projects, 'total': len(projects)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# ---------------------- BLOCKCHAIN EXPLORER ----------------------

@app.route('/api/explorer/contracts')
def get_contract_addresses():
    """Get contract addresses"""
    try:
        return jsonify({
            'success': True,
            'registry': ADD['registry'],
            'token': ADD['token'],
            'verificationManager': ADD['verificationManager'],
            'owner': get_account()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/explorer/stats')
def get_blockchain_stats():
    """Get blockchain statistics"""
    try:
        next_id = REG.functions.nextProjectId().call()
        total_projects = next_id - 1
        
        total_biomass = 0
        total_approved = 0
        
        for pid in range(1, next_id):
            try:
                p = REG.functions.projects(pid).call()
                total_biomass += p[3]  # claimedTons
                total_approved += p[4]  # approvedTons
            except:
                pass
        
        return jsonify({
            'success': True,
            'total_projects': total_projects,
            'total_biomass_tons': total_biomass,
            'total_approved_tons': total_approved
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/explorer/records')
def get_blockchain_records():
    """Get all blockchain records (projects + events)"""
    try:
        next_id = REG.functions.nextProjectId().call()
        records = []
        
        for pid in range(1, next_id):
            try:
                p = REG.functions.projects(pid).call()
                status_map = {0: 'None', 1: 'Submitted', 2: 'UnderReview', 3: 'Approved', 4: 'Tokenized', 5: 'Rejected'}
                records.append({
                    'type': 'Project',
                    'id': p[0],
                    'submitter': p[1],
                    'claimedTons': p[3],
                    'approvedTons': p[4],
                    'status': status_map.get(p[5], str(p[5])),
                    'timestamp': p[6]
                })
            except:
                pass
        
        # Sort by timestamp descending
        records.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
        
        return jsonify({
            'success': True,
            'records': records,
            'total': len(records)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
