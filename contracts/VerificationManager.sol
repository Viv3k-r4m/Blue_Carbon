// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CarbonCreditToken.sol";
import "./MRVRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VerificationManager is Ownable {
    CarbonCreditToken public token;
    MRVRegistry public registry;

    event CreditsIssued(uint256 indexed projectId, address indexed recipient, uint256 amount);

    constructor(address tokenAddr, address registryAddr) {
        token = CarbonCreditToken(tokenAddr);
        registry = MRVRegistry(registryAddr);
    }

    function issueCredits(uint256 projectId, address recipient) external {
        // Allow owner or verifier
        require(
            msg.sender == owner() || registry.isVerifier(msg.sender),
            "not permitted"
        );

        (
            uint256 id,
            address submitter,
            string memory metadataURI,
            uint256 claimedTons,
            uint256 approvedTons,
            MRVRegistry.Status status,
            uint256 submittedAt,
            uint256 updatedAt
        ) = registry.projects(projectId);

        require(id != 0, "project not found");
        require(status == MRVRegistry.Status.Approved, "project not approved");
        require(approvedTons > 0, "no approved tons");

        uint256 amount = approvedTons * 1e18;

        // MINT FIRST (prevents revert)
        token.mint(recipient, amount);

        // Update registry
        registry.markTokenized(projectId);

        emit CreditsIssued(projectId, recipient, amount);
    }
}
