/**
 * Web Utility Toolbox - Microsoft Entra ID Client Assertion Generator Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // UI Elements
    // ==========================================
    const clientIdInput = document.getElementById('assertion-client-id');
    const tenantIdInput = document.getElementById('assertion-tenant-id');
    const certInput = document.getElementById('assertion-cert');
    const privateKeyInput = document.getElementById('assertion-private-key');
    const audInput = document.getElementById('assertion-aud');
    const lifetimeInput = document.getElementById('assertion-lifetime');
    const lifetimeVal = document.getElementById('assertion-lifetime-val');
    
    const certDropZone = document.getElementById('assertion-cert-drop');
    const keyDropZone = document.getElementById('assertion-private-key-drop');
    
    const btnAudV1 = document.getElementById('btn-aud-v1');
    const btnAudV2 = document.getElementById('btn-aud-v2');
    const btnClear = document.getElementById('btn-clear-assertion');
    const btnGenerate = document.getElementById('btn-generate-assertion');
    
    const outputField = document.getElementById('assertion-output');
    const statusIndicator = document.getElementById('assertion-status');
    const headerPreview = document.getElementById('assertion-header-preview');
    const payloadPreview = document.getElementById('assertion-payload-preview');

    // ==========================================
    // Live Updates & Previews
    // ==========================================
    async function updatePreviews() {
        if (!headerPreview || !payloadPreview) return;
        
        const clientId = clientIdInput ? clientIdInput.value.trim() : '';
        const tenantId = tenantIdInput ? tenantIdInput.value.trim() : '';
        const certPem = certInput ? certInput.value.trim() : '';
        const audUrl = audInput ? audInput.value.trim() : '';
        const lifetime = lifetimeInput ? lifetimeInput.value : 3600;

        let thumbprint = '';
        if (certPem) {
            try {
                thumbprint = await Tools.computeCertThumbprint(certPem);
            } catch (e) {
                thumbprint = '{invalid_certificate_pem}';
            }
        }

        const { header, payload } = Tools.buildClientAssertionClaims(clientId, tenantId, thumbprint, audUrl, lifetime);
        
        headerPreview.textContent = JSON.stringify(header, null, 2);
        payloadPreview.textContent = JSON.stringify(payload, null, 2);
    }

    // Bind inputs to update previews in real-time
    const inputElements = [clientIdInput, tenantIdInput, certInput, audInput, lifetimeInput];
    inputElements.forEach(element => {
        if (element) {
            element.addEventListener('input', updatePreviews);
        }
    });

    // Handle range slider updates
    if (lifetimeInput && lifetimeVal) {
        lifetimeInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val >= 3600) {
                const hours = (val / 3600).toFixed(1).replace('.0', '');
                lifetimeVal.textContent = `${hours} hour${hours !== '1' ? 's' : ''} (${val}s)`;
            } else {
                const mins = Math.floor(val / 60);
                lifetimeVal.textContent = `${mins} minute${mins !== 1 ? 's' : ''} (${val}s)`;
            }
        });
    }

    // Dynamic Audience Quick Select
    if (btnAudV1 && audInput) {
        btnAudV1.addEventListener('click', () => {
            const tenantId = tenantIdInput ? tenantIdInput.value.trim() : '';
            const tId = tenantId || '{tenant_id}';
            audInput.value = `https://login.microsoftonline.com/${tId}/oauth2/token`;
            updatePreviews();
            if (window.App && window.App.showToast) {
                window.App.showToast('Audience set to OAuth2 v1 endpoint');
            }
        });
    }

    if (btnAudV2 && audInput) {
        btnAudV2.addEventListener('click', () => {
            const tenantId = tenantIdInput ? tenantIdInput.value.trim() : '';
            const tId = tenantId || '{tenant_id}';
            audInput.value = `https://login.microsoftonline.com/${tId}/oauth2/v2.0/token`;
            updatePreviews();
            if (window.App && window.App.showToast) {
                window.App.showToast('Audience set to OAuth2 v2 endpoint');
            }
        });
    }

    // ==========================================
    // Drag and Drop File Loading
    // ==========================================
    function setupDragAndDrop(dropZone, textArea) {
        if (!dropZone || !textArea) return;

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('drag-over');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                const file = files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    textArea.value = event.target.result;
                    // Trigger input event to update previews
                    textArea.dispatchEvent(new Event('input'));
                    if (window.App && window.App.showToast) {
                        window.App.showToast(`Loaded file: ${file.name}`);
                    }
                };
                reader.readAsText(file);
            }
        }, false);
    }

    setupDragAndDrop(certDropZone, certInput);
    setupDragAndDrop(keyDropZone, privateKeyInput);

    // ==========================================
    // Clear and Generate Actions
    // ==========================================
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (clientIdInput) clientIdInput.value = '';
            if (tenantIdInput) tenantIdInput.value = '';
            if (certInput) certInput.value = '';
            if (privateKeyInput) privateKeyInput.value = '';
            if (audInput) audInput.value = '';
            if (lifetimeInput) {
                lifetimeInput.value = 3600;
                lifetimeInput.dispatchEvent(new Event('input'));
            }
            if (outputField) outputField.value = '';
            if (statusIndicator) statusIndicator.style.display = 'none';
            
            updatePreviews();
            
            if (window.App && window.App.showToast) {
                window.App.showToast('Workspace cleared');
            }
        });
    }

    if (btnGenerate) {
        btnGenerate.addEventListener('click', async () => {
            const clientId = clientIdInput ? clientIdInput.value.trim() : '';
            const tenantId = tenantIdInput ? tenantIdInput.value.trim() : '';
            const certPem = certInput ? certInput.value.trim() : '';
            const privateKeyPem = privateKeyInput ? privateKeyInput.value.trim() : '';
            const audUrl = audInput ? audInput.value.trim() : '';
            const lifetime = lifetimeInput ? lifetimeInput.value : 3600;

            if (!statusIndicator || !outputField) return;

            // Simple field validations
            if (!clientId) {
                showError("Client ID (Application ID) is required.");
                return;
            }
            if (!tenantId) {
                showError("Tenant ID (Directory ID) is required.");
                return;
            }
            if (!certPem) {
                showError("Certificate PEM content is required to build the thumbprint.");
                return;
            }
            if (!privateKeyPem) {
                showError("Private Key PEM content is required to sign the token.");
                return;
            }

            // UUID format checks
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(clientId)) {
                if (window.App && window.App.showToast) {
                    window.App.showToast("Warning: Client ID does not look like a standard UUID.", "warning");
                }
            }
            if (!uuidRegex.test(tenantId)) {
                if (window.App && window.App.showToast) {
                    window.App.showToast("Warning: Tenant ID does not look like a standard UUID.", "warning");
                }
            }

            // Show loading status
            statusIndicator.style.display = 'flex';
            statusIndicator.className = 'status-indicator warning';
            statusIndicator.innerHTML = `
                <span>
                    <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10"></circle>
                    </svg>
                </span>
                <span>Generating and signing client assertion...</span>`;

            try {
                // Determine audience url
                const targetAud = audUrl || `https://login.microsoftonline.com/${tenantId}/oauth2/token`;
                
                // Perform generation
                const jwt = await Tools.generateClientAssertion(
                    clientId, 
                    tenantId, 
                    privateKeyPem, 
                    certPem, 
                    targetAud, 
                    lifetime
                );
                
                outputField.value = jwt;
                
                // Success indicator
                statusIndicator.className = 'status-indicator success';
                statusIndicator.innerHTML = `
                    <span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </span>
                    <span>Client assertion generated successfully!</span>`;
                
                if (window.App && window.App.showToast) {
                    window.App.showToast("JWT Assertion generated!", "success");
                }
            } catch (err) {
                outputField.value = '';
                showError(err.message);
            }
        });
    }

    function showError(msg) {
        if (!statusIndicator) return;
        statusIndicator.style.display = 'flex';
        statusIndicator.className = 'status-indicator error';
        statusIndicator.innerHTML = `
            <span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </span>
            <span>Error: ${msg}</span>`;
            
        if (window.App && window.App.showToast) {
            window.App.showToast(msg, "error");
        }
    }

    // Initialize Previews on DOM Load
    updatePreviews();
});
