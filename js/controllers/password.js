/**
 * Web Utility Toolbox - Password & Token Generator Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    const passLength = document.getElementById('pass-length');
    const passLengthVal = document.getElementById('pass-length-val');
    const chkLower = document.getElementById('pass-lower');
    const chkUpper = document.getElementById('pass-upper');
    const chkNumber = document.getElementById('pass-number');
    const chkSymbol = document.getElementById('pass-symbol');
    const btnGeneratePass = document.getElementById('btn-generate-pass');
    const passOutput = document.getElementById('pass-output');
    const passIndicator = document.getElementById('pass-indicator');
    const passIndicatorLabel = document.getElementById('pass-indicator-label');

    function runPasswordGeneration() {
        if (!passLength || !passOutput) return;

        const len = parseInt(passLength.value, 10);
        const opts = {
            lowercase: chkLower.checked,
            uppercase: chkUpper.checked,
            numbers: chkNumber.checked,
            symbols: chkSymbol.checked
        };

        const res = Tools.generatePassword(len, opts);
        
        passOutput.value = res.password;

        if (res.password) {
            passIndicator.style.display = 'flex';
            passIndicator.className = `status-indicator ${res.statusClass}`;
            passIndicatorLabel.textContent = `Strength: ${res.status}`;
            
            // Adjust indicator icons
            if (res.statusClass === 'success') {
                passIndicator.querySelector('span').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            } else {
                passIndicator.querySelector('span').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
            }
        } else {
            passIndicator.style.display = 'none';
            if (window.App && window.App.showToast) window.App.showToast(res.status, 'error');
        }
    }

    if (passLength) {
        passLength.addEventListener('input', (e) => {
            passLengthVal.textContent = e.target.value;
        });
    }

    if (btnGeneratePass) btnGeneratePass.addEventListener('click', runPasswordGeneration);
    
    // Auto-generate a password on initial load
    const passPanel = document.getElementById('password-gen');
    if (passPanel) {
        runPasswordGeneration();
    }
});
