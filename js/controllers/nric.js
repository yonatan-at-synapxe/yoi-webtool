/**
 * Web Utility Toolbox - Singapore NRIC / FIN Generator Controller
 * Handles all DOM event bindings for the NRIC Generator panel.
 */

document.addEventListener('DOMContentLoaded', () => {
    const prefixSelect    = document.getElementById('nric-prefix');
    const digitsInput     = document.getElementById('nric-digits');
    const suffixOutput    = document.getElementById('nric-suffix');
    const fullOutput      = document.getElementById('nric-full-output');
    const btnGenerate     = document.getElementById('btn-generate-nric');
    const btnClear        = document.getElementById('btn-clear-nric');
    const validBadge      = document.getElementById('nric-valid-badge');
    const chipPrefix      = document.getElementById('nric-display-prefix');
    const chipDigits      = document.getElementById('nric-display-digits');
    const chipSuffix      = document.getElementById('nric-display-suffix');

    if (!prefixSelect || !digitsInput || !btnGenerate) return; // Panel not present

    // ── Helpers ────────────────────────────────────────────────────────────────

    function resetOutputs() {
        suffixOutput.value = '';
        fullOutput.value   = '';
        if (chipPrefix) chipPrefix.textContent = '—';
        if (chipDigits) chipDigits.textContent = '——— ————';
        if (chipSuffix) chipSuffix.textContent = '—';
        if (validBadge) {
            validBadge.style.display = 'none';
            validBadge.textContent   = '';
        }
    }

    function showBadge(isValid) {
        if (!validBadge) return;
        validBadge.style.display = 'inline-flex';
        if (isValid) {
            validBadge.textContent = '✓ Valid NRIC';
            validBadge.className   = 'status-indicator status-success';
        } else {
            validBadge.textContent = '✗ Invalid';
            validBadge.className   = 'status-indicator status-error';
        }
    }

    // ── Core Generate Action ───────────────────────────────────────────────────

    function generate() {
        const prefix = prefixSelect.value.trim();
        const digits = digitsInput.value.trim();

        if (!digits) {
            if (window.App && window.App.showToast) {
                window.App.showToast('Please enter the 7-digit number.', 'warning');
            }
            return;
        }
        if (!/^\d{7}$/.test(digits)) {
            if (window.App && window.App.showToast) {
                window.App.showToast('Digits must be exactly 7 numeric characters (0–9).', 'error');
            }
            resetOutputs();
            return;
        }

        try {
            const result = Tools.computeNricSuffix(prefix, digits);
            suffixOutput.value = result.suffix;
            fullOutput.value   = result.fullNric;

            // Update visual breakdown chips
            if (chipPrefix) chipPrefix.textContent = prefix;
            if (chipDigits) chipDigits.textContent = digits.slice(0, 3) + ' ' + digits.slice(3);
            if (chipSuffix) chipSuffix.textContent = result.suffix;

            showBadge(true);

            if (window.App && window.App.showToast) {
                window.App.showToast('NRIC generated: ' + result.fullNric, 'success');
            }
        } catch (err) {
            resetOutputs();
            if (window.App && window.App.showToast) {
                window.App.showToast(err.message, 'error');
            }
        }
    }

    // ── Live re-compute on input change ───────────────────────────────────────

    function liveUpdate() {
        const digits = digitsInput.value.trim();
        if (digits.length === 7 && /^\d{7}$/.test(digits)) {
            generate();
        } else {
            resetOutputs();
        }
    }

    digitsInput.addEventListener('input', liveUpdate);
    prefixSelect.addEventListener('change', liveUpdate);

    // ── Restrict input to digits only ─────────────────────────────────────────

    digitsInput.addEventListener('keypress', (e) => {
        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
            e.preventDefault();
        }
    });

    // Enforce max length via paste
    digitsInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        const cleaned = pasted.replace(/\D/g, '').slice(0, 7);
        digitsInput.value = cleaned;
        liveUpdate();
    });

    // ── Buttons ────────────────────────────────────────────────────────────────

    btnGenerate.addEventListener('click', generate);

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            prefixSelect.value = 'S';
            digitsInput.value  = '';
            resetOutputs();
            digitsInput.focus();
        });
    }
});
