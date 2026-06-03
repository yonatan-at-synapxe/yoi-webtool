/**
 * Web Utility Toolbox - Curl Command Builder Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const curlMethod = document.getElementById('curl-method');
    const curlUrl = document.getElementById('curl-url');
    const curlOptVerbose = document.getElementById('curl-opt-verbose');
    const curlOptInsecure = document.getElementById('curl-opt-insecure');
    const curlShellFormat = document.getElementById('curl-shell-format');
    const curlOptProxy = document.getElementById('curl-opt-proxy');
    const curlProxyAddr = document.getElementById('curl-proxy-addr');
    
    // Postman Elements
    const curlPostmanDrop = document.getElementById('curl-postman-drop');
    const curlPostmanFile = document.getElementById('curl-postman-file');
    const curlPostmanLabel = document.getElementById('curl-postman-label');
    const curlPostmanControls = document.getElementById('curl-postman-controls');
    const curlPostmanInfo = document.getElementById('curl-postman-info');
    const curlPostmanRequests = document.getElementById('curl-postman-requests');
    const curlPostmanResetBtn = document.getElementById('curl-postman-reset-btn');
    const curlPostmanVarsCard = document.getElementById('curl-postman-vars-card');
    const curlPostmanVarsList = document.getElementById('curl-postman-vars-list');

    let importedRequests = [];
    let collectionVariables = [];
    let activePostmanRequest = null;
    
    // Tabs
    const curlTabHeaders = document.getElementById('curl-tab-headers');
    const curlTabQuery = document.getElementById('curl-tab-query');
    const curlTabBody = document.getElementById('curl-tab-body');
    
    // Sections
    const curlSectionHeaders = document.getElementById('curl-section-headers');
    const curlSectionQuery = document.getElementById('curl-section-query');
    const curlSectionBody = document.getElementById('curl-section-body');
    
    // Lists & Dynamic Add buttons
    const curlHeadersList = document.getElementById('curl-headers-list');
    const curlQueryList = document.getElementById('curl-query-list');
    const curlAddHeaderBtn = document.getElementById('curl-add-header-btn');
    const curlAddQueryBtn = document.getElementById('curl-add-query-btn');
    
    // Body configurations
    const curlBodyType = document.getElementById('curl-body-type');
    const curlFormatBodyBtn = document.getElementById('curl-format-body-btn');
    const curlBodyContainer = document.getElementById('curl-body-container');
    const curlBodyText = document.getElementById('curl-body-text');
    
    // Actions & Outputs
    const curlClearBtn = document.getElementById('curl-clear-btn');
    const curlCommandOutput = document.getElementById('curl-command-output');
    
    let isSyncingUrl = false;

    // Helper: Add a row in Headers list
    function addHeaderRow(key = '', value = '', enabled = true) {
        const row = document.createElement('div');
        row.className = 'flex-row-center curl-param-row';
        row.style.gap = '8px';
        row.style.width = '100%';
        
        row.innerHTML = `
            <input type="checkbox" class="checkbox-input curl-row-enable" ${enabled ? 'checked' : ''}>
            <input type="text" class="input-text curl-row-key" placeholder="Header Name" value="${key}" style="flex: 1; font-family: var(--font-mono); font-size: 0.85rem;">
            <input type="text" class="input-text curl-row-value" placeholder="Value" value="${value}" style="flex: 2; font-family: var(--font-mono); font-size: 0.85rem;">
            <button class="btn btn-danger btn-icon-only curl-row-delete" style="padding: 10px; border-radius: 8px;">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        
        // Listeners for values change
        row.querySelector('.curl-row-enable').addEventListener('change', updateOutput);
        row.querySelector('.curl-row-key').addEventListener('input', updateOutput);
        row.querySelector('.curl-row-value').addEventListener('input', updateOutput);
        
        // Delete button listener
        row.querySelector('.curl-row-delete').addEventListener('click', () => {
            row.remove();
            updateOutput();
        });
        
        curlHeadersList.appendChild(row);
        updateOutput();
    }

    // Helper: Add a row in Query parameters list
    function addQueryRow(key = '', value = '', enabled = true, preventUrlSync = false) {
        const row = document.createElement('div');
        row.className = 'flex-row-center curl-param-row';
        row.style.gap = '8px';
        row.style.width = '100%';
        
        row.innerHTML = `
            <input type="checkbox" class="checkbox-input curl-row-enable" ${enabled ? 'checked' : ''}>
            <input type="text" class="input-text curl-row-key" placeholder="Param Name" value="${key}" style="flex: 1; font-family: var(--font-mono); font-size: 0.85rem;">
            <input type="text" class="input-text curl-row-value" placeholder="Value" value="${value}" style="flex: 2; font-family: var(--font-mono); font-size: 0.85rem;">
            <button class="btn btn-danger btn-icon-only curl-row-delete" style="padding: 10px; border-radius: 8px;">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        
        const triggerSync = () => {
            if (!isSyncingUrl) {
                syncQueryParamsToUrl();
            }
            updateOutput();
        };

        row.querySelector('.curl-row-enable').addEventListener('change', triggerSync);
        row.querySelector('.curl-row-key').addEventListener('input', triggerSync);
        row.querySelector('.curl-row-value').addEventListener('input', triggerSync);
        
        row.querySelector('.curl-row-delete').addEventListener('click', () => {
            row.remove();
            triggerSync();
        });
        
        curlQueryList.appendChild(row);
        
        if (!preventUrlSync && !isSyncingUrl) {
            syncQueryParamsToUrl();
        }
        updateOutput();
    }

    // Sync UI parameters -> URL Query String
    function syncQueryParamsToUrl() {
        if (isSyncingUrl) return;
        isSyncingUrl = true;
        
        const rows = curlQueryList.querySelectorAll('.curl-param-row');
        const queryParams = [];
        rows.forEach(row => {
            const key = row.querySelector('.curl-row-key').value.trim();
            const value = row.querySelector('.curl-row-value').value;
            const enabled = row.querySelector('.curl-row-enable').checked;
            if (key) {
                queryParams.push({ key, value, enabled });
            }
        });
        
        const urlVal = curlUrl.value.trim();
        const parsed = Tools.parseUrlQueryParams(urlVal);
        const newUrl = Tools.buildUrl(parsed.baseUrl, queryParams);
        
        curlUrl.value = newUrl;
        isSyncingUrl = false;
    }

    // Sync URL Query String -> UI parameters
    function syncUrlToQueryParams() {
        if (isSyncingUrl) return;
        isSyncingUrl = true;
        
        const urlVal = curlUrl.value.trim();
        const parsed = Tools.parseUrlQueryParams(urlVal);
        
        curlQueryList.innerHTML = '';
        if (parsed.queryParams.length > 0) {
            parsed.queryParams.forEach(p => {
                addQueryRow(p.key, p.value, p.enabled, true);
            });
        } else {
            // Keep one empty row if no params
            addQueryRow('', '', true, true);
        }
        
        isSyncingUrl = false;
        updateOutput();
    }

    // Header Content-Type auto updater
    function setContentTypeHeader(value) {
        const rows = curlHeadersList.querySelectorAll('.curl-param-row');
        let found = false;
        rows.forEach(row => {
            const keyInput = row.querySelector('.curl-row-key');
            if (keyInput.value.trim().toLowerCase() === 'content-type') {
                const valInput = row.querySelector('.curl-row-value');
                valInput.value = value;
                row.querySelector('.curl-row-enable').checked = true;
                found = true;
            }
        });
        
        if (!found) {
            // If the first row is empty, use it instead of appending
            const firstRow = curlHeadersList.querySelector('.curl-param-row');
            if (firstRow && firstRow.querySelector('.curl-row-key').value.trim() === '') {
                firstRow.querySelector('.curl-row-key').value = 'Content-Type';
                firstRow.querySelector('.curl-row-value').value = value;
                firstRow.querySelector('.curl-row-enable').checked = true;
            } else {
                addHeaderRow('Content-Type', value, true);
            }
        }
    }

    function disableContentTypeHeader() {
        const rows = curlHeadersList.querySelectorAll('.curl-param-row');
        rows.forEach(row => {
            const keyInput = row.querySelector('.curl-row-key');
            if (keyInput.value.trim().toLowerCase() === 'content-type') {
                row.querySelector('.curl-row-enable').checked = false;
            }
        });
    }

    // Tabs navigation
    function switchTab(tabName) {
        curlSectionHeaders.style.display = 'none';
        curlSectionQuery.style.display = 'none';
        curlSectionBody.style.display = 'none';
        
        curlTabHeaders.className = 'btn btn-secondary';
        curlTabQuery.className = 'btn btn-secondary';
        curlTabBody.className = 'btn btn-secondary';
        
        if (tabName === 'headers') {
            curlSectionHeaders.style.display = 'flex';
            curlTabHeaders.className = 'btn btn-primary active';
        } else if (tabName === 'query') {
            curlSectionQuery.style.display = 'flex';
            curlTabQuery.className = 'btn btn-primary active';
        } else if (tabName === 'body') {
            curlSectionBody.style.display = 'flex';
            curlTabBody.className = 'btn btn-primary active';
        }
    }

    // Real-time generator trigger
    function updateOutput() {
        // Gather variables map
        const variablesMap = {};
        if (curlPostmanVarsCard && curlPostmanVarsCard.style.display !== 'none') {
            curlPostmanVarsList.querySelectorAll('.curl-postman-var-val').forEach(input => {
                const key = input.getAttribute('data-var-key');
                const val = input.value;
                variablesMap[key] = val;
            });
        }

        const headers = [];
        curlHeadersList.querySelectorAll('.curl-param-row').forEach(row => {
            let key = row.querySelector('.curl-row-key').value.trim();
            let value = row.querySelector('.curl-row-value').value;
            const enabled = row.querySelector('.curl-row-enable').checked;
            
            // Resolve variables
            key = Tools.resolveVariables(key, variablesMap);
            value = Tools.resolveVariables(value, variablesMap);
            
            if (key) {
                headers.push({ key, value, enabled });
            }
        });
        
        const queryParams = [];
        curlQueryList.querySelectorAll('.curl-param-row').forEach(row => {
            let key = row.querySelector('.curl-row-key').value.trim();
            let value = row.querySelector('.curl-row-value').value;
            const enabled = row.querySelector('.curl-row-enable').checked;
            
            // Resolve variables
            key = Tools.resolveVariables(key, variablesMap);
            value = Tools.resolveVariables(value, variablesMap);
            
            if (key) {
                queryParams.push({ key, value, enabled });
            }
        });
        
        let urlVal = curlUrl.value.trim();
        // Resolve variables in URL
        urlVal = Tools.resolveVariables(urlVal, variablesMap);
        
        const parsed = Tools.parseUrlQueryParams(urlVal);
        
        let bodyVal = curlBodyText.value;
        if (curlBodyType.value !== 'none') {
            bodyVal = Tools.resolveVariables(bodyVal, variablesMap);
        }
        
        const options = {
            method: curlMethod.value,
            url: parsed.baseUrl,
            verbose: curlOptVerbose.checked,
            insecure: curlOptInsecure.checked,
            headers: headers,
            queryParams: queryParams,
            bodyType: curlBodyType.value,
            body: bodyVal,
            shell: curlShellFormat.value,
            useProxy: curlOptProxy.checked,
            proxyAddr: curlProxyAddr.value
        };
        
        const command = Tools.generateCurl(options);
        curlCommandOutput.value = command;
    }

    // Initialize Workspace Defaults
    function initWorkspace() {
        curlMethod.value = 'GET';
        curlUrl.value = '';
        curlOptVerbose.checked = false;
        curlOptInsecure.checked = false;
        curlShellFormat.value = 'bash';
        curlOptProxy.checked = false;
        curlProxyAddr.value = '';
        curlProxyAddr.disabled = true;
        curlBodyType.value = 'none';
        curlBodyText.value = '';
        curlBodyContainer.style.display = 'none';
        curlFormatBodyBtn.style.display = 'none';
        
        curlHeadersList.innerHTML = '';
        curlQueryList.innerHTML = '';
        
        addHeaderRow('', '', true);
        addQueryRow('', '', true, true);
        
        switchTab('headers');
        updateOutput();
    }

    // Bind Core Elements Listeners
    curlMethod.addEventListener('change', updateOutput);
    curlUrl.addEventListener('input', () => {
        syncUrlToQueryParams();
        updateOutput();
    });
    curlOptVerbose.addEventListener('change', updateOutput);
    curlOptInsecure.addEventListener('change', updateOutput);
    curlShellFormat.addEventListener('change', updateOutput);
    curlOptProxy.addEventListener('change', () => {
        curlProxyAddr.disabled = !curlOptProxy.checked;
        updateOutput();
    });
    curlProxyAddr.addEventListener('input', updateOutput);
    
    // Bind Tab Switching Listeners
    curlTabHeaders.addEventListener('click', () => switchTab('headers'));
    curlTabQuery.addEventListener('click', () => switchTab('query'));
    curlTabBody.addEventListener('click', () => switchTab('body'));
    
    // Bind Parameter additions
    curlAddHeaderBtn.addEventListener('click', () => addHeaderRow('', '', true));
    curlAddQueryBtn.addEventListener('click', () => addQueryRow('', '', true, false));
    
    // Bind Body Options
    curlBodyType.addEventListener('change', () => {
        const type = curlBodyType.value;
        if (type === 'none') {
            curlBodyContainer.style.display = 'none';
            curlFormatBodyBtn.style.display = 'none';
            disableContentTypeHeader();
        } else {
            curlBodyContainer.style.display = 'block';
            if (type === 'json') {
                curlFormatBodyBtn.style.display = 'inline-flex';
                setContentTypeHeader('application/json');
                curlBodyText.placeholder = '{\n  "key": "value"\n}';
            } else if (type === 'urlencoded') {
                curlFormatBodyBtn.style.display = 'none';
                setContentTypeHeader('application/x-www-form-urlencoded');
                curlBodyText.placeholder = 'key1=value1&key2=value2';
            } else if (type === 'multipart') {
                curlFormatBodyBtn.style.display = 'none';
                setContentTypeHeader('multipart/form-data');
                curlBodyText.placeholder = 'name="value"\nfile=@path/to/file';
            } else if (type === 'text') {
                curlFormatBodyBtn.style.display = 'none';
                setContentTypeHeader('text/plain');
                curlBodyText.placeholder = 'Enter plain text body...';
            }
        }
        updateOutput();
    });

    curlBodyText.addEventListener('input', updateOutput);
    
    // JSON Formatter Button
    curlFormatBodyBtn.addEventListener('click', () => {
        const val = curlBodyText.value.trim();
        if (!val) return;
        try {
            const formatted = JSON.stringify(JSON.parse(val), null, 2);
            curlBodyText.value = formatted;
            if (window.App && window.App.showToast) {
                window.App.showToast('JSON formatted successfully!');
            }
            updateOutput();
        } catch (e) {
            if (window.App && window.App.showToast) {
                window.App.showToast('Invalid JSON: ' + e.message, 'error');
            }
        }
    });

    // Clear and reset workspaces
    curlClearBtn.addEventListener('click', () => {
        resetPostmanFile();
        initWorkspace();
        if (window.App && window.App.showToast) {
            window.App.showToast('Curl workspace reset.');
        }
    });

    // Postman File Upload & Drop Bindings
    curlPostmanDrop.addEventListener('click', (e) => {
        if (e.target.id === 'curl-postman-reset-btn' || e.target.closest('#curl-postman-controls')) {
            return;
        }
        curlPostmanFile.click();
    });

    curlPostmanDrop.addEventListener('dragover', (e) => {
        e.preventDefault();
        curlPostmanDrop.style.borderColor = 'var(--accent)';
    });

    curlPostmanDrop.addEventListener('dragleave', () => {
        curlPostmanDrop.style.borderColor = 'var(--border-color)';
    });

    curlPostmanDrop.addEventListener('drop', (e) => {
        e.preventDefault();
        curlPostmanDrop.style.borderColor = 'var(--border-color)';
        if (e.dataTransfer.files.length > 0) {
            handlePostmanFile(e.dataTransfer.files[0]);
        }
    });

    curlPostmanFile.addEventListener('change', () => {
        if (curlPostmanFile.files.length > 0) {
            handlePostmanFile(curlPostmanFile.files[0]);
        }
    });

    curlPostmanResetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetPostmanFile();
        initWorkspace();
    });

    // Request Selection Binding
    curlPostmanRequests.addEventListener('change', () => {
        const id = curlPostmanRequests.value;
        if (!id) {
            activePostmanRequest = null;
            curlPostmanVarsCard.style.display = 'none';
            curlPostmanVarsList.innerHTML = '';
            updateOutput();
            return;
        }

        const found = importedRequests.find(r => r.id === id);
        if (found) {
            const normalized = Tools.normalizePostmanRequest(found.request);
            activePostmanRequest = normalized;
            
            curlMethod.value = normalized.method;
            curlUrl.value = normalized.url;
            
            // Headers
            curlHeadersList.innerHTML = '';
            if (normalized.headers.length > 0) {
                normalized.headers.forEach(h => {
                    addHeaderRow(h.key, h.value, h.enabled);
                });
            } else {
                addHeaderRow('', '', true);
            }
            
            // Query Params
            curlQueryList.innerHTML = '';
            if (normalized.queryParams.length > 0) {
                normalized.queryParams.forEach(q => {
                    addQueryRow(q.key, q.value, q.enabled, true);
                });
            } else {
                addQueryRow('', '', true, true);
            }
            
            // Body
            curlBodyType.value = normalized.bodyType;
            curlBodyText.value = normalized.body;
            curlBodyType.dispatchEvent(new Event('change'));
            
            // Variables
            renderVariablesForRequest(normalized);
            
            updateOutput();
        }
    });

    // Helper: Handle file loading
    function handlePostmanFile(file) {
        if (!file.name.endsWith('.json')) {
            if (window.App && window.App.showToast) {
                window.App.showToast('Please upload a JSON file', 'error');
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsedCollection = Tools.parsePostmanCollection(e.target.result);
                
                importedRequests = parsedCollection.requests;
                collectionVariables = parsedCollection.variables;
                
                if (importedRequests.length === 0) {
                    if (window.App && window.App.showToast) {
                        window.App.showToast('No requests found in this collection', 'warning');
                    }
                    return;
                }

                curlPostmanInfo.textContent = `Loaded: ${parsedCollection.name} (${importedRequests.length} requests)`;
                curlPostmanLabel.innerHTML = `<strong>Collection Loaded</strong><br>${file.name}`;
                curlPostmanControls.style.display = 'flex';
                
                curlPostmanRequests.innerHTML = '<option value="">-- Choose request --</option>';
                importedRequests.forEach(req => {
                    const opt = document.createElement('option');
                    opt.value = req.id;
                    opt.textContent = `${req.request.method || 'GET'} - ${req.path}`;
                    curlPostmanRequests.appendChild(opt);
                });

                if (window.App && window.App.showToast) {
                    window.App.showToast(`Imported ${importedRequests.length} requests!`);
                }
            } catch (err) {
                if (window.App && window.App.showToast) {
                    window.App.showToast('Failed to parse collection: ' + err.message, 'error');
                }
            }
        };
        reader.readAsText(file);
    }

    // Helper: Render variables list inputs
    function renderVariablesForRequest(normalized) {
        const requestVars = Tools.scanRequestForVariables(normalized);
        
        if (requestVars.length === 0) {
            curlPostmanVarsCard.style.display = 'none';
            curlPostmanVarsList.innerHTML = '';
            return;
        }

        curlPostmanVarsCard.style.display = 'block';
        curlPostmanVarsList.innerHTML = '';
        
        requestVars.forEach(vKey => {
            const defaultVarObj = collectionVariables.find(cv => cv.key === vKey);
            const defaultVal = defaultVarObj ? defaultVarObj.value : '';
            
            const row = document.createElement('div');
            row.className = 'flex-row-center';
            row.style.gap = '8px';
            row.style.width = '100%';
            
            row.innerHTML = `
                <span style="font-family: var(--font-mono); font-size: 0.8rem; flex: 1; color: var(--accent); font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${vKey}">
                    {{${vKey}}}
                </span>
                <input type="text" class="input-text curl-postman-var-val" data-var-key="${vKey}" placeholder="value" value="${defaultVal}" style="flex: 2; font-family: var(--font-mono); font-size: 0.85rem; padding: 6px 12px;">
            `;
            
            row.querySelector('.curl-postman-var-val').addEventListener('input', updateOutput);
            curlPostmanVarsList.appendChild(row);
        });
    }

    // Helper: Reset postman states
    function resetPostmanFile() {
        curlPostmanFile.value = '';
        curlPostmanLabel.innerHTML = `<strong>Drag & Drop</strong> Postman collection file (.json) here or <strong>click to browse</strong>`;
        curlPostmanControls.style.display = 'none';
        curlPostmanRequests.innerHTML = '<option value="">-- Choose request --</option>';
        curlPostmanVarsCard.style.display = 'none';
        curlPostmanVarsList.innerHTML = '';
        
        importedRequests = [];
        collectionVariables = [];
        activePostmanRequest = null;
    }

    // Initial setup
    initWorkspace();
});
