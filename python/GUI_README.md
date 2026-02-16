# Blue Carbon Admin GUI

A lightweight Flask-based web interface for managing the Blue Carbon MRV Registry, matching the functionality of the CLI but with a modern, user-friendly UI.

## Features

✨ **Dashboard Management**
- View registry owner information
- Display network connection status

� **Drone Integration**
- Submit drone projects directly from the GUI
- Enter NDVI values and area in hectares
- Automatic biomass estimation
- Real-time metadata URI preview
- Transaction confirmation with receipt

📋 **Project Management**
- View all projects in a searchable table
- See project status (Submitted, Under Review, Approved, Rejected)
- View individual project details by ID
- Set projects under review
- Approve projects with specified tons
- Reject projects

✓ **Verifier Management**
- View list of active verifiers
- Add verifier addresses
- Remove verifier addresses

## Installation

1. Make sure all dependencies are installed:
```bash
pip install -r requirements.txt
```

2. Ensure your `.env` file is configured with:
```
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_private_key
OWNER_ADDRESS=your_owner_address
```

3. Verify deployed contract addresses exist in `../deployed/addresses.json`

## Running the GUI

```bash
python admin_gui.py
```

The GUI will be available at: **http://localhost:5000**
## 🎯 Where to Find Everything

### Dashboard Tab (📊)
- **Registry Owner** - Shows the owner address of the MRV Registry

### Drone Integration Tab (🚁) - *NEW!*
- **Submit Drone Project** - Enter NDVI (0-1) and area (hectares) to submit project
- **Estimation Preview** - Real-time calculation of biomass tons and metadata URI
- **Result Display** - Shows transaction hash and metadata URI after submission

### Projects Tab (📋)
- **All Projects List** - View all projects in a sortable table
  - Shows: ID, Submitter, Claimed Tons, Approved Tons, Status, Submission Date
  - Status badges show: Submitted, Under Review, Approved, Tokenized, Rejected
- **View Project Details** - Enter project ID to see full details
  - Metadata URI, timestamps, all fields
- **Set Project Status** - Move projects to Under Review
- **Approve Projects** - Approve with specified tons
- **Reject Projects** - Reject with reason

### Verifiers Tab (✓)
- **Active Verifiers List** - Shows note about verification (contract limitation)
- **Add Verifier** - Add new verifier address (owner-only)
- **Remove Verifier** - Remove verifier address (owner-only)
## Interface Structure

### Sidebar Navigation
- **📊 Dashboard** - Overview and registry owner info
- **� Drone Integration** - Submit drone projects directly
- **📋 Projects** - View all projects and manage them
- **✓ Verifiers** - Manage verifier addresses

### Key Features
- **Real-time notifications** - Toast messages for all operations
- **Responsive design** - Works on desktop and mobile devices
- **Clean UI** - Modern Bootstrap design with blue carbon theme
- **Transaction feedback** - Shows transaction hash on successful operations
- **Input validation** - Prevents invalid submissions
- **Projects table** - View all projects with status indicators
- **Biomass calculator** - Real-time estimation preview
- **Metadata URI preview** - See generated metadata before submission

## API Endpoints

All endpoints support REST API calls:
- `GET /api/owner` - Get registry owner
- `GET /api/project/<id>` - Get project details
- `GET /api/all-projects` - Get all projects
- `POST /api/submit-project` - Submit drone project
- `POST /api/add-verifier` - Add verifier
- `POST /api/remove-verifier` - Remove verifier
- `POST /api/under-review` - Set project under review
- `POST /api/approve` - Approve project
- `POST /api/reject` - Reject project

## Comparison with CLI

| Feature | CLI | GUI |
|---------|-----|-----|
| Show Owner | `admin_cli owner` | Dashboard |
| Show Project | `admin_cli show <id>` | Projects → View Project |
| Drone Integration | `python drone_integration.py` | 🚁 Drone Integration Tab |
| List All Projects | ❌ Not available | 📋 Projects → All Projects |
| Add Verifier | `admin_cli add-verifier <addr>` | Verifiers → Add Verifier |
| Remove Verifier | `admin_cli remove-verifier <addr>` | Verifiers → Remove Verifier |
| Under Review | `admin_cli under-review <id>` | Projects → Set Project Status |
| Approve | `admin_cli approve <id> <tons>` | Projects → Approve Project |
| Reject | `admin_cli reject <id>` | Projects → Reject Project |

## File Structure

```
python/
├── admin_gui.py          # Flask backend
├── contract_interface.py # Web3 utilities
├── templates/
│   └── dashboard.html    # Main UI template
└── static/
    ├── style.css         # Styling
    └── app.js            # Frontend logic
```

## Technologies Used

- **Flask** - Lightweight web framework
- **Bootstrap 5** - Responsive CSS framework
- **Vanilla JavaScript** - No heavy dependencies
- **Web3.py** - Blockchain interaction

## Notes

- All transactions require proper configuration (RPC, private key, owner address)
- Transaction confirmations are awaited before showing success
- The GUI uses the same contract interfaces as the CLI