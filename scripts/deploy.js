const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying from:", deployer.address);

    // 1. Deploy token
    const Token = await hre.ethers.getContractFactory("CarbonCreditToken");
    const token = await Token.deploy("BlueCarbon", "BCT", deployer.address);
    await token.deployed();
    console.log("Token deployed:", token.address);

    // 2. Deploy registry
    const Registry = await hre.ethers.getContractFactory("MRVRegistry");
    const registry = await Registry.deploy();
    await registry.deployed();
    console.log("Registry deployed:", registry.address);

    // 3. Deploy VM
    const VM = await hre.ethers.getContractFactory("VerificationManager");
    const vm = await VM.deploy(token.address, registry.address);
    await vm.deployed();
    console.log("VerificationManager deployed:", vm.address);

    // 4. Grant MINTER_ROLE (use contract getter for safety)
    const MINTER_ROLE = await token.MINTER_ROLE();
    const tx = await token.grantRole(MINTER_ROLE, vm.address);
    await tx.wait();
    console.log("Granted MINTER_ROLE to VM");

    // ------ SAVE OUTPUTS ------
    const outDir = path.join(__dirname, "..", "deployed");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const addresses = {
        token: token.address,
        registry: registry.address,
        verificationManager: vm.address
    };

    fs.writeFileSync(
        path.join(outDir, "addresses.json"),
        JSON.stringify(addresses, null, 2)
    );

    fs.writeFileSync(
        path.join(outDir, "CarbonCreditToken.json"),
        JSON.stringify(await hre.artifacts.readArtifact("CarbonCreditToken"), null, 2)
    );

    fs.writeFileSync(
        path.join(outDir, "MRVRegistry.json"),
        JSON.stringify(await hre.artifacts.readArtifact("MRVRegistry"), null, 2)
    );

    fs.writeFileSync(
        path.join(outDir, "VerificationManager.json"),
        JSON.stringify(await hre.artifacts.readArtifact("VerificationManager"), null, 2)
    );

    console.log("\nSaved artifacts + addresses → /deployed\n");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
