// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MRVRegistry is Ownable {
    enum Status { None, Submitted, UnderReview, Approved, Tokenized,Rejected }

    struct Project {
        uint256 id;
        address submitter;
        string metadataURI;
        uint256 claimedTons;
        uint256 approvedTons;
        Status status;
        uint256 submittedAt;
        uint256 updatedAt;
    }

    uint256 public nextProjectId = 1;
    mapping(uint256 => Project) public projects;
    mapping(address => bool) public verifiers;

    event ProjectSubmitted(uint256 indexed projectId, address indexed submitter, uint256 claimedTons, string metadataURI);
    event ProjectStatusChanged(uint256 indexed projectId, Status status, address indexed changer, uint256 approvedTons);
    event VerifierAdded(address verifier);
    event VerifierRemoved(address verifier);

    function addVerifier(address v) external onlyOwner {
        verifiers[v] = true;
        emit VerifierAdded(v);
    }

    function removeVerifier(address v) external onlyOwner {
        verifiers[v] = false;
        emit VerifierRemoved(v);
    }

    function isVerifier(address v) external view returns (bool) {
        return verifiers[v];
    }

    function submitProject(string calldata metadataURI, uint256 claimedTons) external returns (uint256) {
        require(claimedTons > 0, "claimedTons must be > 0");
        
        uint256 pid = nextProjectId++;
        projects[pid] = Project({
            id: pid,
            submitter: msg.sender,
            metadataURI: metadataURI,
            claimedTons: claimedTons,
            approvedTons: 0,
            status: Status.Submitted,
            submittedAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit ProjectSubmitted(pid, msg.sender, claimedTons, metadataURI);
        return pid;
    }

    function setUnderReview(uint256 projectId) external {
        require(verifiers[msg.sender], "not verifier");
        Project storage p = projects[projectId];
        require(p.id != 0, "not found");

        p.status = Status.UnderReview;
        p.updatedAt = block.timestamp;

        emit ProjectStatusChanged(projectId, p.status, msg.sender, p.approvedTons);
    }

    function approveProject(uint256 projectId, uint256 approvedTons) external {
        require(verifiers[msg.sender], "not verifier");
        Project storage p = projects[projectId];
        require(p.id != 0, "not found");
        require(approvedTons > 0 && approvedTons <= p.claimedTons, "invalid tons");

        p.approvedTons = approvedTons;
        p.status = Status.Approved;
        p.updatedAt = block.timestamp;

        emit ProjectStatusChanged(projectId, p.status, msg.sender, approvedTons);
    }

    function rejectProject(uint256 projectId) external {
        require(verifiers[msg.sender], "not verifier");
        Project storage p = projects[projectId];
        require(p.id != 0, "not found");

        p.approvedTons = 0;
        p.status = Status.Rejected;
        p.updatedAt = block.timestamp;

        emit ProjectStatusChanged(projectId, p.status, msg.sender, 0);
    }

    function markTokenized(uint256 projectId) external onlyOwner {
        Project storage p = projects[projectId];
        require(p.id != 0, "not found");

        p.status = Status.Tokenized;
        p.updatedAt = block.timestamp;

        emit ProjectStatusChanged(projectId, p.status, msg.sender, p.approvedTons);
    }
}
