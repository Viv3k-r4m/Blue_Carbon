// Helper function to show toast notifications
function showNotification(message, type = 'info') {
    const toast = document.getElementById('notification-toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    
    const titleMap = {
        'success': '✓ Success',
        'error': '✗ Error',
        'info': 'ℹ Info',
        'warning': '⚠ Warning'
    };
    
    toastTitle.textContent = titleMap[type] || 'Notification';
    toastMessage.textContent = message;
    
    // Update toast style
    toast.classList.remove('bg-success', 'bg-danger', 'bg-info', 'bg-warning');
    if (type === 'success') toast.classList.add('bg-success', 'text-white');
    else if (type === 'error') toast.classList.add('bg-danger', 'text-white');
    else if (type === 'warning') toast.classList.add('bg-warning');
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Load registry owner
function loadOwner() {
    const ownerInfo = document.getElementById('owner-info');
    ownerInfo.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    
    fetch('/api/owner')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                ownerInfo.innerHTML = `<code>${data.owner}</code>`;
                showNotification('Owner loaded successfully', 'success');
            } else {
                ownerInfo.innerHTML = `<span class="text-danger">Error: ${data.error}</span>`;
                showNotification(data.error, 'error');
            }
        })
        .catch(error => {
            ownerInfo.innerHTML = `<span class="text-danger">Error: ${error.message}</span>`;
            showNotification(error.message, 'error');
        });
}

// Load network and account info
function loadNetworkInfo() {
    fetch('/api/network-info')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('network-status').textContent = data.network;
                document.getElementById('account-info').textContent = data.account;
            } else {
                document.getElementById('network-status').textContent = '⚠️ Error';
                document.getElementById('account-info').textContent = '—';
            }
        })
        .catch(error => {
            document.getElementById('network-status').textContent = '⚠️ Error';
            document.getElementById('account-info').textContent = '—';
        });
}

// View project details (legacy - kept for backward compatibility)
function viewProject() {
    const projectId = document.getElementById('view-project-id').value;
    
    if (!projectId) {
        showNotification('Please enter a project ID', 'warning');
        return;
    }
    
    // Switch to projects tab and load action center
    document.getElementById('action-project-id').value = projectId;
    loadProjectForAction();
}

// Get status badge
function getStatusBadge(status) {
    const statusMap = {
        '0': '📝 Pending',
        '1': '👀 Under Review',
        '2': '✓ Approved',
        '3': '✗ Rejected'
    };
    return statusMap[status] || `Unknown (${status})`;
}

// Set project under review
function setUnderReview() {
    performAction('under-review');
}

// Approve project
function approveProject() {
    performAction('approve');
}

// Reject project
function rejectProject() {
    performAction('reject');
}

// Add verifier
function addVerifier() {
    const address = document.getElementById('add-verifier-address').value;
    
    if (!address) {
        showNotification('Please enter an address', 'warning');
        return;
    }
    
    submitTransaction(
        '/api/add-verifier',
        { address: address },
        'Adding verifier...',
        'Verifier added successfully'
    );
}

// Remove verifier
function removeVerifier() {
    const address = document.getElementById('remove-verifier-address').value;
    
    if (!address) {
        showNotification('Please enter an address', 'warning');
        return;
    }
    
    submitTransaction(
        '/api/remove-verifier',
        { address: address },
        'Removing verifier...',
        'Verifier removed successfully'
    );
}

// Generic transaction submit handler
function submitTransaction(endpoint, data, loadingMsg, successMsg) {
    showNotification(loadingMsg, 'info');
    
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`${successMsg}\nTx: ${data.tx.substring(0, 10)}...`, 'success');
            // Clear input fields
            document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
                input.value = '';
            });
        } else {
            showNotification(data.error, 'error');
        }
    })
    .catch(error => {
        showNotification(error.message, 'error');
    });
}
// ==================== DRONE INTEGRATION ====================

function submitDroneProject() {
    const ndvi = parseFloat(document.getElementById('drone-ndvi').value);
    const area = parseFloat(document.getElementById('drone-area').value);
    const imagesInput = document.getElementById('drone-images').value;
    const images = imagesInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    if (!ndvi || !area) {
        showNotification('Please fill in NDVI and area', 'warning');
        return;
    }
    
    if (ndvi < 0 || ndvi > 1) {
        showNotification('NDVI must be between 0 and 1', 'warning');
        return;
    }
    
    if (area <= 0) {
        showNotification('Area must be greater than 0', 'warning');
        return;
    }
    
    showNotification('Submitting drone project...', 'info');
    
    fetch('/api/submit-project', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            avg_ndvi: ndvi,
            area_ha: area,
            images: images
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(`Project submitted! Biomass: ${data.biomass} tons\nTx: ${data.tx.substring(0, 10)}...`, 'success');
            document.getElementById('drone-result').innerHTML = `
                <div class="alert alert-success">
                    <strong>✓ Project Submitted Successfully</strong>
                    <p><strong>Transaction:</strong> <code>${data.tx}</code></p>
                    <p><strong>Estimated Biomass:</strong> ${data.biomass} tons</p>
                    <p><strong>Metadata URI:</strong> <code>${data.metadata_uri}</code></p>
                </div>
            `;
            // Clear form
            document.getElementById('drone-ndvi').value = '0.5';
            document.getElementById('drone-area').value = '1.0';
            document.getElementById('drone-images').value = '';
        } else {
            showNotification(data.error, 'error');
        }
    })
    .catch(error => {
        showNotification(error.message, 'error');
    });
}

function updateEstimate() {
    const ndvi = parseFloat(document.getElementById('drone-ndvi').value) || 0.5;
    const area = parseFloat(document.getElementById('drone-area').value) || 1.0;
    
    // Calculate biomass (same formula as Python)
    const factor = Math.max(0.1, Math.min(10.0, ndvi * 10));
    const biomass = Math.floor(factor * area);
    
    // Calculate metadata URI (SHA256 hash is simplified here)
    const metadata = {
        source: "drone",
        avg_ndvi: ndvi,
        area_ha: area,
        estimated_biomass_tons: biomass
    };
    const metaStr = JSON.stringify(metadata, Object.keys(metadata).sort());
    
    document.getElementById('biomass-preview').textContent = biomass + ' tons';
    document.getElementById('uri-preview').textContent = 'sha256:' + metaStr.substring(0, 20) + '...';
}

// ==================== PROJECTS LIST ====================

function loadAllProjects() {
    const projectsList = document.getElementById('projects-list');
    projectsList.innerHTML = '<div class="text-center"><span class="spinner-border spinner-border-sm"></span> Loading projects...</div>';
    
    fetch('/api/all-projects')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.projects.length === 0) {
                    projectsList.innerHTML = '<div class="alert alert-info">No projects found</div>';
                    return;
                }
                
                let html = `<table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Submitter</th>
                            <th>Claimed Tons</th>
                            <th>Approved Tons</th>
                            <th>Status</th>
                            <th>Submitted</th>
                        </tr>
                    </thead>
                    <tbody>`;
                
                data.projects.forEach(p => {
                    const statusBadges = {
                        0: '<span class="badge bg-secondary">⚪ None</span>',
                        1: '<span class="badge bg-secondary">📝 Submitted</span>',
                        2: '<span class="badge bg-warning">👀 Review</span>',
                        3: '<span class="badge bg-success">✓ Approved</span>',
                        4: '<span class="badge bg-info">💫 Tokenized</span>',
                        5: '<span class="badge bg-danger">✗ Rejected</span>'
                    };
                    
                    html += `<tr onclick="selectProjectFromTable(${p.id})">
                        <td><strong>#${p.id}</strong></td>
                        <td><code>${p.submitter.substring(0, 10)}...</code></td>
                        <td>${p.claimedTons}</td>
                        <td>${p.approvedTons}</td>
                        <td>${statusBadges[p.statusCode] || p.status}</td>
                        <td>${new Date(p.submittedAt * 1000).toLocaleDateString()}</td>
                    </tr>`;
                });
                
                html += `</tbody></table>`;
                projectsList.innerHTML = html;
                showNotification(`Loaded ${data.projects.length} projects`, 'success');
            } else {
                projectsList.innerHTML = `<div class="alert alert-danger">Error: ${data.error}</div>`;
                showNotification(data.error, 'error');
            }
        })
        .catch(error => {
            projectsList.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            showNotification(error.message, 'error');
        });
}

// ==================== UNIFIED ACTION CENTER ====================

const statusNames = {
    0: 'None',
    1: 'Submitted',
    2: 'Under Review',
    3: 'Approved',
    4: 'Tokenized',
    5: 'Rejected'
};

function selectProjectFromTable(projectId) {
    document.getElementById('action-project-id').value = projectId;
    loadProjectForAction();
    // Scroll to action center
    document.querySelector('[href="#projects"]').click();
}

function loadProjectForAction() {
    const projectId = document.getElementById('action-project-id').value;
    const statusDiv = document.getElementById('current-status');
    const actionButtons = document.getElementById('action-buttons');
    const detailsDiv = document.getElementById('project-details-full');
    const issueCreditsSection = document.getElementById('issue-credits-section');
    
    if (!projectId) {
        statusDiv.textContent = '— Enter ID above to check status';
        statusDiv.classList.add('text-muted');
        statusDiv.classList.remove('badge', 'bg-warning', 'bg-success', 'bg-danger');
        actionButtons.style.display = 'none';
        issueCreditsSection.style.display = 'none';
        detailsDiv.innerHTML = '<p class="text-muted">Select a project ID above to view full details here.</p>';
        return;
    }
    
    fetch(`/api/project/${projectId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const p = data.project;
                const status = p.status;
                const statusName = statusNames[status] || 'Unknown';
                
                // Update status display
                const statusColors = {
                    0: 'secondary',
                    1: 'secondary',
                    2: 'warning',
                    3: 'success',
                    4: 'info',
                    5: 'danger'
                };
                statusDiv.textContent = statusName;
                statusDiv.classList.remove('text-muted');
                statusDiv.classList.add('badge', 'bg-' + statusColors[status]);
                
                // Show action buttons conditionally based on status
                actionButtons.style.display = 'block';
                
                // Get button elements
                const underReviewBtn = document.querySelector('button[onclick="performAction(\'under-review\')"]');
                const approveBtn = document.querySelector('button[onclick="performAction(\'approve\')"]');
                const rejectBtn = document.querySelector('button[onclick="performAction(\'reject\')"]');
                const issueCreditsSection = document.getElementById('issue-credits-section');
                const finalizedNotice = document.getElementById('finalized-notice');
                
                // Hide all buttons and notices first
                if (underReviewBtn) underReviewBtn.style.display = 'none';
                if (approveBtn) approveBtn.closest('.row').style.display = 'none';
                if (rejectBtn) rejectBtn.style.display = 'none';
                issueCreditsSection.style.display = 'none';
                finalizedNotice.style.display = 'none';
                
                // Show appropriate UI based on current status
                if (status === 1) { // Submitted
                    // Can move to under review
                    if (underReviewBtn) underReviewBtn.style.display = 'block';
                } else if (status === 2) { // Under Review
                    // Can approve or reject
                    if (approveBtn) approveBtn.closest('.row').style.display = 'block';
                    if (rejectBtn) rejectBtn.style.display = 'block';
                } else if (status === 3) { // Approved
                    // Can issue credits
                    issueCreditsSection.style.display = 'block';
                } else if (status === 4 || status === 5) { // Tokenized or Rejected
                    // Project is finalized - show notice
                    finalizedNotice.style.display = 'block';
                }
                
                // Update full details
                detailsDiv.innerHTML = `
                    <div class="project-info">
                        <p><strong>ID:</strong> #${p.id}</p>
                        <p><strong>Submitter:</strong> <code>${p.submitter}</code></p>
                        <p><strong>Status:</strong> <span class="badge bg-${statusColors[status]}">${statusName}</span></p>
                        <p><strong>Claimed Tons:</strong> ${p.claimedTons}</p>
                        <p><strong>Approved Tons:</strong> ${p.approvedTons}</p>
                        <p><strong>Metadata URI:</strong> <code>${p.metadataUri}</code></p>
                        <p><strong>Submitted At:</strong> ${new Date(p.submittedAt * 1000).toLocaleString()}</p>
                        <p><strong>Updated At:</strong> ${new Date(p.updatedAt * 1000).toLocaleString()}</p>
                    </div>
                `;
            } else {
                statusDiv.textContent = '⚠️ Project not found';
                statusDiv.classList.add('text-danger');
                actionButtons.style.display = 'none';
                issueCreditsSection.style.display = 'none';
                detailsDiv.innerHTML = `<div class="alert alert-danger">Project #${projectId} not found</div>`;
                showNotification(data.error, 'error');
            }
        })
        .catch(error => {
            statusDiv.textContent = '✗ Error loading';
            statusDiv.classList.add('text-danger');
            actionButtons.style.display = 'none';
            issueCreditsSection.style.display = 'none';
            detailsDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            showNotification(error.message, 'error');
        });
}

function performAction(action) {
    const projectId = document.getElementById('action-project-id').value;
    
    if (!projectId) {
        showNotification('Please select a project ID first', 'warning');
        return;
    }
    
    let endpoint, data, successMsg, loadingMsg;
    
    switch(action) {
        case 'under-review':
            endpoint = '/api/under-review';
            data = { project_id: parseInt(projectId) };
            loadingMsg = 'Moving project to under review...';
            successMsg = 'Project moved to under review';
            break;
            
        case 'approve':
            const tons = document.getElementById('action-tons').value;
            if (!tons) {
                showNotification('Please enter tons to approve', 'warning');
                return;
            }
            endpoint = '/api/approve';
            data = { project_id: parseInt(projectId), tons: parseInt(tons) };
            loadingMsg = 'Approving project...';
            successMsg = 'Project approved successfully';
            break;
            
        case 'reject':
            endpoint = '/api/reject';
            data = { project_id: parseInt(projectId) };
            loadingMsg = 'Rejecting project...';
            successMsg = 'Project rejected';
            break;
            
        case 'issue-credits':
            const recipient = document.getElementById('action-recipient').value;
            if (!recipient) {
                showNotification('Please enter recipient address', 'warning');
                return;
            }
            endpoint = '/api/issue-credits';
            data = { project_id: parseInt(projectId), recipient: recipient };
            loadingMsg = 'Issuing credits and tokenizing...';
            successMsg = 'Credits issued and project tokenized';
            break;
            
        default:
            showNotification('Unknown action', 'error');
            return;
    }
    
    submitTransaction(endpoint, data, loadingMsg, successMsg);
    
    // Reload project after action
    setTimeout(() => {
        loadProjectForAction();
        loadAllProjects();
    }, 2000);
}

// ==================== VERIFIERS LIST ====================

function loadAllVerifiers() {
    const verifiersList = document.getElementById('verifiers-list');
    verifiersList.innerHTML = '<div class="alert alert-info">ℹ️ Note: Smart contract does not provide verifier enumeration function. Verifiers are stored but cannot be queried directly. You can:<ul><li>View verifiers that you add/remove through GUI logs</li><li>Check individual addresses using contract if needed</li><li>Contact admin for full verifier list</li></ul></div>';
}

// ==================== BLOCKCHAIN EXPLORER ====================

function loadBlockchainExplorer() {
    loadContractAddresses();
    loadBlockchainStats();
    loadBlockchainRecords();
}

function loadContractAddresses() {
    fetch('/api/explorer/contracts')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('explorer-registry-addr').textContent = data.registry;
                document.getElementById('explorer-owner-addr').textContent = data.owner;
                document.getElementById('explorer-token-addr').textContent = data.token;
                document.getElementById('explorer-vm-addr').textContent = data.verificationManager;
            } else {
                showNotification(data.error, 'error');
            }
        })
        .catch(error => showNotification(error.message, 'error'));
}

function loadBlockchainStats() {
    fetch('/api/explorer/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('explorer-total-projects').textContent = data.total_projects;
                document.getElementById('explorer-total-biomass').textContent = data.total_biomass_tons;
                document.getElementById('explorer-total-approved').textContent = data.total_approved_tons;
            } else {
                showNotification(data.error, 'error');
            }
        })
        .catch(error => showNotification(error.message, 'error'));
}

function loadBlockchainRecords() {
    const recordsDiv = document.getElementById('explorer-records');
    recordsDiv.innerHTML = '<div class="text-center"><span class="spinner-border spinner-border-sm"></span> Loading records...</div>';
    
    fetch('/api/explorer/records')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.records.length === 0) {
                    recordsDiv.innerHTML = '<div class="alert alert-info">No records found</div>';
                    return;
                }
                
                let html = `<div class="table-responsive"><table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Project ID</th>
                            <th>Submitter</th>
                            <th>Claimed</th>
                            <th>Approved</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>`;
                
                data.records.forEach(r => {
                    const statusColors = {
                        'None': 'secondary',
                        'Submitted': 'secondary',
                        'UnderReview': 'warning',
                        'Approved': 'success',
                        'Tokenized': 'info',
                        'Rejected': 'danger'
                    };
                    
                    html += `<tr>
                        <td><span class="badge bg-primary">${r.type}</span></td>
                        <td><strong>#${r.id}</strong></td>
                        <td><code>${r.submitter.substring(0, 10)}...</code></td>
                        <td>${r.claimedTons}</td>
                        <td>${r.approvedTons}</td>
                        <td><span class="badge bg-${statusColors[r.status] || 'secondary'}">${r.status}</span></td>
                        <td>${new Date(r.timestamp * 1000).toLocaleString()}</td>
                    </tr>`;
                });
                
                html += `</tbody></table></div>`;
                recordsDiv.innerHTML = html;
                showNotification(`Loaded ${data.total} records`, 'success');
            } else {
                recordsDiv.innerHTML = `<div class="alert alert-danger">Error: ${data.error}</div>`;
                showNotification(data.error, 'error');
            }
        })
        .catch(error => {
            recordsDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            showNotification(error.message, 'error');
        });
}