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
        const headers = [];
        curlHeadersList.querySelectorAll('.curl-param-row').forEach(row => {
            const key = row.querySelector('.curl-row-key').value.trim();
            const value = row.querySelector('.curl-row-value').value;
            const enabled = row.querySelector('.curl-row-enable').checked;
            if (key) {
                headers.push({ key, value, enabled });
            }
        });
        
        const queryParams = [];
        curlQueryList.querySelectorAll('.curl-param-row').forEach(row => {
            const key = row.querySelector('.curl-row-key').value.trim();
            const value = row.querySelector('.curl-row-value').value;
            const enabled = row.querySelector('.curl-row-enable').checked;
            if (key) {
                queryParams.push({ key, value, enabled });
            }
        });
        
        const urlVal = curlUrl.value.trim();
        const parsed = Tools.parseUrlQueryParams(urlVal);
        
        const options = {
            method: curlMethod.value,
            url: parsed.baseUrl,
            verbose: curlOptVerbose.checked,
            insecure: curlOptInsecure.checked,
            headers: headers,
            queryParams: queryParams,
            bodyType: curlBodyType.value,
            body: curlBodyText.value,
            shell: curlShellFormat.value
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
        initWorkspace();
        if (window.App && window.App.showToast) {
            window.App.showToast('Curl workspace reset.');
        }
    });

    // Initial setup
    initWorkspace();
});
