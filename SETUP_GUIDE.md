# Blue Carbon - Complete Setup Guide

## Prerequisites
- Node.js installed
- Python 3.8+ installed
- `.env` file configured with:
  ```
  RPC_URL=http://127.0.0.1:8545
  PRIVATE_KEY=<your_private_key>
  OWNER_ADDRESS=<your_owner_address>
  ```

## Step-by-Step Setup (Required Order)

```
npm install - install all dependencies
```

### Step 1: Start Local Blockchain Node
```bash
npx hardhat node
```

**What this does:**
- Starts a local Hardhat blockchain on `http://127.0.0.1:8545`
- Provides test accounts with ETH
- **Keep this terminal running** in the background

**Output should show:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0x... (10000 ETH)
Account #1: 0x... (10000 ETH)
...
```

---

### Step 2: Deploy Smart Contracts
In a **new terminal**, run:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

**What this does:**
- Deploys 3 smart contracts:
  - `CarbonCreditToken` (BCT token)
  - `MRVRegistry` (Project registry)
  - `VerificationManager` (Verification logic)
- Creates `deployed/` folder with:
  - `addresses.json` - Contract addresses
  - `CarbonCreditToken.json`, `MRVRegistry.json`, `VerificationManager.json` - ABIs
- Grants MINTER_ROLE to VerificationManager

**Output should show:**
```
Deploying from: 0x...
Token deployed: 0x...
Registry deployed: 0x...
VerificationManager deployed: 0x...
```

---

### Step 3: Initialize Drone Data (Optional - For Testing)
In a **new terminal**, run:
```bash
cd python
python drone_integration.py
```

**What this does:**
- Processes simulated drone data
- Creates metadata URIs (for testing with GUI)
- Submits projects to the registry

**Output should show:**
```
Processing drone_project_1.json...
Metadata URI: sha256:...
Project 1 submitted!
```

---

### Step 4: Start the GUI
In a **new terminal**, run:
```bash
cd python
python admin_gui.py
```

**Or use the startup script:**
- **Windows:** `python/run_gui.bat`
- **Linux/Mac:** `python/run_gui.sh`

**Output should show:**
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

Then open your browser to: **http://localhost:5000**

---

## Terminal Setup Overview

You'll need **4 terminals running simultaneously:**

| Terminal | Command | Keep Running |
|----------|---------|--------------|
| 1 | `npx hardhat node` | ✓ Yes |
| 2 | `npx hardhat run scripts/deploy.js --network localhost` | ✗ No (one-time) |
| 3 | `python drone_integration.py` | ✗ No (optional) |
| 4 | `python admin_gui.py` | ✓ Yes |

---

## Common Issues

### Port 5000 Already in Use
```bash
# Change Flask port in admin_gui.py
app.run(debug=True, port=5001)  # Use 5001 instead
```

### Port 8545 Already in Use
```bash
# Hardhat node on different port
npx hardhat node --port 8546
# Update RPC_URL in .env
```

### "Cannot connect to RPC"
- Ensure `npx hardhat node` is still running (Terminal 1)
- Verify `RPC_URL=http://127.0.0.1:8545` in `.env`

### "addresses.json not found"
- Ensure deploy.js was run successfully (Terminal 2)
- Check that `deployed/` folder exists with all JSON files

### Transactions Failing
- Verify `PRIVATE_KEY` and `OWNER_ADDRESS` in `.env`
- Ensure account has ETH (hardhat node provides 10000 ETH per account)

---

## What Each Step Does

```
┌─────────────────────────────────────────────┐
│  Step 1: npx hardhat node                   │
│  ├─ Starts blockchain on :8545              │
│  └─ Provides test accounts                  │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Step 2: npx hardhat run deploy.js          │
│  ├─ Deploys CarbonCreditToken               │
│  ├─ Deploys MRVRegistry                     │
│  ├─ Deploys VerificationManager             │
│  └─ Saves addresses.json & ABIs             │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Step 3: python drone_integration.py        │
│  ├─ Creates test projects                   │
│  └─ Populates metadata URIs                 │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Step 4: python admin_gui.py                │
│  ├─ Connects to blockchain                  │
│  ├─ Loads contract ABIs                     │
│  └─ Serves GUI on :5000                     │
└─────────────────────────────────────────────┘
```

---

## Ready to Use GUI

Once all steps complete, you can:
- ✓ View registry owner
- ✓ Inspect projects
- ✓ Set projects under review
- ✓ Approve/reject projects
- ✓ Manage verifiers
- ✓ All transactions are signed and sent on-chain

---

## CLI Alternative

If you prefer the command-line interface:
```bash
cd python
python admin_cli.py --help
```

Same functionality, different interface!
