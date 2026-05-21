/**
 * Web Utility Toolbox - JSON Formatter Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('json-input');
    const jsonOutput = document.getElementById('json-output');
    const jsonSpacing = document.getElementById('json-spacing');
    const btnFormatJson = document.getElementById('btn-format-json');
    const btnMinifyJson = document.getElementById('btn-minify-json');
    const btnClearJson = document.getElementById('btn-clear-json');
    const btnSampleJson = document.getElementById('btn-sample-json');
    const jsonStatus = document.getElementById('json-status');
    const jsonStats = document.getElementById('json-stats');

    // Tree View Elements
    const btnJsonTabRaw = document.getElementById('btn-json-tab-raw');
    const btnJsonTabTree = document.getElementById('btn-json-tab-tree');
    const jsonRawContainer = document.getElementById('json-raw-container');
    const jsonTreeContainer = document.getElementById('json-tree-container');
    const btnJsonTreeExpand = document.getElementById('btn-json-tree-expand');
    const btnJsonTreeCollapse = document.getElementById('btn-json-tree-collapse');
    const jsonTreeOutput = document.getElementById('json-tree-output');

    // Fullscreen elements
    const btnJsonInputFullscreen = document.getElementById('btn-json-input-fullscreen');
    const btnJsonOutputFullscreen = document.getElementById('btn-json-output-fullscreen');
    const jsonInputCard = document.getElementById('json-input-card');
    const jsonOutputCard = document.getElementById('json-output-card');

    const fullscreenSvgIcon = `
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
        </svg>
    `;
    const minimizeSvgIcon = `
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 14h6v6m10-10h-6V4m0 6l7-7M10 14l-7 7"></path>
        </svg>
    `;

    function toggleFullscreen(card, button) {
        if (!card) return;
        const isFullscreen = card.classList.toggle('fullscreen');
        document.body.classList.toggle('fullscreen-active', isFullscreen);

        // Identify sibling card and hide/show it to prevent overlap
        const siblingCard = card.id === 'json-input-card' ? jsonOutputCard : jsonInputCard;
        if (siblingCard) {
            siblingCard.style.display = isFullscreen ? 'none' : '';
        }

        if (button) {
            button.innerHTML = isFullscreen ? minimizeSvgIcon : fullscreenSvgIcon;
            button.title = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
        }

        // Inject / remove a prominent floating close button
        const existingClose = document.getElementById('json-fullscreen-close-btn');
        if (existingClose) existingClose.remove();

        if (isFullscreen) {
            const closeBtn = document.createElement('button');
            closeBtn.id = 'json-fullscreen-close-btn';
            closeBtn.title = 'Exit Fullscreen (Esc)';
            closeBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 14h6v6m10-10h-6V4m0 6l7-7M10 14l-7 7"></path>
                </svg>
                <span>Exit</span>
                <kbd>Esc</kbd>
            `;
            closeBtn.addEventListener('click', () => toggleFullscreen(card, button));
            card.appendChild(closeBtn);
        }
    }

    if (btnJsonInputFullscreen) {
        btnJsonInputFullscreen.addEventListener('click', () => {
            toggleFullscreen(jsonInputCard, btnJsonInputFullscreen);
        });
    }

    if (btnJsonOutputFullscreen) {
        btnJsonOutputFullscreen.addEventListener('click', () => {
            toggleFullscreen(jsonOutputCard, btnJsonOutputFullscreen);
        });
    }

    // Handle Esc key to close fullscreen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeFullscreenCard = document.querySelector('.card.fullscreen');
            if (activeFullscreenCard) {
                const isInputCard = activeFullscreenCard.id === 'json-input-card';
                const btn = isInputCard ? btnJsonInputFullscreen : btnJsonOutputFullscreen;
                toggleFullscreen(activeFullscreenCard, btn);
            }
        }
    });

    function processJson(minify = false) {
        const input = jsonInput.value;
        const spacing = minify ? '0' : jsonSpacing.value;
        const res = Tools.formatJson(input, spacing);
        
        if (res.success) {
            jsonOutput.value = res.formatted;
            jsonStatus.style.display = input.trim() ? 'flex' : 'none';
            jsonStatus.className = 'status-indicator success';
            jsonStatus.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Valid JSON`;
            
            if (res.stats) {
                jsonStats.textContent = `Flattened Keys: ${res.stats.keys} | Size: ${(res.stats.size / 1024).toFixed(2)} KB`;
            } else {
                jsonStats.textContent = '';
            }

            // Render interactive tree view
            try {
                if (input.trim() === '') {
                    jsonTreeOutput.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding-top:60px;">Formatted JSON tree view appears here...</div>';
                } else {
                    const parsed = JSON.parse(input);
                    jsonTreeOutput.innerHTML = Tools.jsonToHtmlTree(parsed);
                }
            } catch (e) {
                jsonTreeOutput.innerHTML = `<div style="color:var(--danger); padding: 16px;">Error rendering tree: ${e.message}</div>`;
            }
        } else {
            jsonStatus.style.display = 'flex';
            jsonStatus.className = 'status-indicator error';
            jsonStatus.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                ${res.error}`;
            jsonStats.textContent = '';
            jsonTreeOutput.innerHTML = `<div style="color:var(--danger); padding: 16px;">Invalid JSON: ${res.error}</div>`;
        }
    }

    if (btnJsonTabRaw) {
        btnJsonTabRaw.addEventListener('click', () => {
            btnJsonTabRaw.classList.add('active');
            btnJsonTabRaw.style.borderBottom = '2px solid var(--accent)';
            btnJsonTabTree.classList.remove('active');
            btnJsonTabTree.style.borderBottom = 'none';
            jsonRawContainer.style.display = 'block';
            jsonTreeContainer.style.display = 'none';
        });
    }

    if (btnJsonTabTree) {
        btnJsonTabTree.addEventListener('click', () => {
            btnJsonTabTree.classList.add('active');
            btnJsonTabTree.style.borderBottom = '2px solid var(--accent)';
            btnJsonTabRaw.classList.remove('active');
            btnJsonTabRaw.style.borderBottom = 'none';
            jsonRawContainer.style.display = 'none';
            jsonTreeContainer.style.display = 'flex';
        });
    }

    if (btnJsonTreeExpand) {
        btnJsonTreeExpand.addEventListener('click', () => {
            document.querySelectorAll('#json-tree-output details').forEach(d => d.open = true);
        });
    }

    if (btnJsonTreeCollapse) {
        btnJsonTreeCollapse.addEventListener('click', () => {
            document.querySelectorAll('#json-tree-output details').forEach(d => d.open = false);
        });
    }

    if (btnFormatJson) btnFormatJson.addEventListener('click', () => processJson(false));
    if (btnMinifyJson) btnMinifyJson.addEventListener('click', () => processJson(true));
    if (jsonSpacing) jsonSpacing.addEventListener('change', () => processJson(false));
    if (jsonInput) jsonInput.addEventListener('input', () => {
        if (jsonInput.value.trim() === '') {
            jsonStatus.style.display = 'none';
            jsonOutput.value = '';
            jsonStats.textContent = '';
            jsonTreeOutput.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding-top:60px;">Formatted JSON tree view appears here...</div>';
        } else {
            processJson(false);
        }
    });
    if (btnClearJson) btnClearJson.addEventListener('click', () => {
        jsonInput.value = '';
        jsonOutput.value = '';
        jsonStatus.style.display = 'none';
        jsonStats.textContent = '';
        jsonTreeOutput.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding-top:60px;">Formatted JSON tree view appears here...</div>';
        if (window.App && window.App.showToast) window.App.showToast('JSON workspace cleared.');
    });
    if (btnSampleJson) btnSampleJson.addEventListener('click', () => {
        const sample = {
            appName: "Web Utility Toolbox",
            version: "1.0.0",
            developer: "Antigravity Pair",
            offlineCapable: true,
            features: [
                "JSON Formatter",
                "Base64 Encoder",
                "Markdown Live Preview",
                "DP Diff Comparison",
                "Secure Generator",
                "JWT Claim Decoder"
            ],
            designTokens: {
                theme: "dark/light",
                aesthetics: "glassmorphism",
                primaryColor: "Indigo"
            }
        };
        jsonInput.value = JSON.stringify(sample, null, 2);
        processJson(false);
    });
});
