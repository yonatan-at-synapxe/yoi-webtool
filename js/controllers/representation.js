/**
 * Web Utility Toolbox - Representation Converter Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // Mode toggling
    const btnModeInteger = document.getElementById('btn-rep-mode-integer');
    const btnModeText = document.getElementById('btn-rep-mode-text');
    const integerSection = document.getElementById('rep-integer-section');
    const textSection = document.getElementById('rep-text-section');

    if (btnModeInteger && btnModeText && integerSection && textSection) {
        btnModeInteger.addEventListener('click', () => {
            btnModeInteger.classList.replace('btn-secondary', 'btn-primary');
            btnModeText.classList.replace('btn-primary', 'btn-secondary');
            integerSection.style.display = 'block';
            textSection.style.display = 'none';
        });

        btnModeText.addEventListener('click', () => {
            btnModeText.classList.replace('btn-secondary', 'btn-primary');
            btnModeInteger.classList.replace('btn-primary', 'btn-secondary');
            integerSection.style.display = 'none';
            textSection.style.display = 'block';
        });
    }

    // ==========================================
    // Integer Mode Controller
    // ==========================================
    const intFields = [
        { id: 'rep-int-dec', base: 10, errorId: 'rep-int-dec-error' },
        { id: 'rep-int-hex', base: 16, errorId: 'rep-int-hex-error' },
        { id: 'rep-int-oct', base: 8, errorId: 'rep-int-oct-error' },
        { id: 'rep-int-bin', base: 2, errorId: 'rep-int-bin-error' }
    ];

    let isUpdating = false;

    function handleIntegerInput(sourceField, base) {
        if (isUpdating) return;
        isUpdating = true;

        const val = sourceField.value;
        const errorEl = document.getElementById(sourceField.id + '-error');

        // Clear error on this field first
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }

        if (!val.trim()) {
            intFields.forEach(f => {
                if (f.id !== sourceField.id) {
                    const el = document.getElementById(f.id);
                    if (el) el.value = '';
                }
                const err = document.getElementById(f.errorId);
                if (err) {
                    err.style.display = 'none';
                    err.textContent = '';
                }
            });
            isUpdating = false;
            return;
        }

        const valClean = val.trim().toLowerCase();
        // Allow partial typing for negative/positive signs or prefix starters
        if (valClean === '-' || valClean === '+' || valClean === '0x' || valClean === '0o' || valClean === '0b' || valClean === '-0x' || valClean === '-0o' || valClean === '-0b') {
            isUpdating = false;
            return;
        }

        try {
            const bigintVal = Tools.parseBigInt(val, base);
            
            intFields.forEach(f => {
                if (f.id !== sourceField.id) {
                    const el = document.getElementById(f.id);
                    if (el) {
                        el.value = Tools.formatBigInt(bigintVal, f.base);
                    }
                }
                const err = document.getElementById(f.errorId);
                if (err) {
                    err.style.display = 'none';
                    err.textContent = '';
                }
            });
        } catch (e) {
            if (errorEl) {
                errorEl.textContent = e.message;
                errorEl.style.display = 'flex';
            }
            intFields.forEach(f => {
                if (f.id !== sourceField.id) {
                    const el = document.getElementById(f.id);
                    if (el) el.value = '';
                }
            });
        }

        isUpdating = false;
    }

    intFields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) {
            el.addEventListener('input', () => handleIntegerInput(el, field.base));
        }
    });

    const btnClearInteger = document.getElementById('btn-rep-integer-clear');
    if (btnClearInteger) {
        btnClearInteger.addEventListener('click', () => {
            intFields.forEach(f => {
                const el = document.getElementById(f.id);
                if (el) el.value = '';
                const err = document.getElementById(f.errorId);
                if (err) {
                    err.style.display = 'none';
                    err.textContent = '';
                }
            });
            if (window.App && window.App.showToast) {
                window.App.showToast('Integer inputs cleared.', 'success');
            }
        });
    }

    // ==========================================
    // Text & Bytes Mode Controller
    // ==========================================
    const textFields = [
        { id: 'rep-text-utf8', type: 'utf8' },
        { id: 'rep-text-hex', type: 'hex', errorId: 'rep-text-hex-error' },
        { id: 'rep-text-dec', type: 'dec', errorId: 'rep-text-dec-error' },
        { id: 'rep-text-oct', type: 'oct', errorId: 'rep-text-oct-error' },
        { id: 'rep-text-bin', type: 'bin', errorId: 'rep-text-bin-error' }
    ];

    let isTextUpdating = false;

    function handleTextInput(sourceField, type) {
        if (isTextUpdating) return;
        isTextUpdating = true;

        const val = sourceField.value;
        const errorEl = sourceField.id !== 'rep-text-utf8' ? document.getElementById(sourceField.id + '-error') : null;

        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }

        if (!val.trim()) {
            textFields.forEach(f => {
                if (f.id !== sourceField.id) {
                    const el = document.getElementById(f.id);
                    if (el) el.value = '';
                }
                if (f.errorId) {
                    const err = document.getElementById(f.errorId);
                    if (err) {
                        err.style.display = 'none';
                        err.textContent = '';
                    }
                }
            });
            isTextUpdating = false;
            return;
        }

        try {
            let bytes;
            if (type === 'utf8') {
                bytes = Tools.stringToBytes(val);
            } else if (type === 'hex') {
                bytes = Tools.hexToBytes(val);
            } else if (type === 'dec') {
                bytes = Tools.decimalToBytes(val);
            } else if (type === 'oct') {
                bytes = Tools.octalToBytes(val);
            } else if (type === 'bin') {
                bytes = Tools.binaryToBytes(val);
            }

            textFields.forEach(f => {
                if (f.id !== sourceField.id) {
                    const el = document.getElementById(f.id);
                    if (el) {
                        if (f.type === 'utf8') {
                            el.value = Tools.bytesToString(bytes);
                        } else if (f.type === 'hex') {
                            el.value = Tools.bytesToHex(bytes);
                        } else if (f.type === 'dec') {
                            el.value = Tools.bytesToDecimal(bytes);
                        } else if (f.type === 'oct') {
                            el.value = Tools.bytesToOctal(bytes);
                        } else if (f.type === 'bin') {
                            el.value = Tools.bytesToBinary(bytes);
                        }
                    }
                }
                if (f.errorId) {
                    const err = document.getElementById(f.errorId);
                    if (err) {
                        err.style.display = 'none';
                        err.textContent = '';
                    }
                }
            });
        } catch (e) {
            if (errorEl) {
                errorEl.textContent = e.message;
                errorEl.style.display = 'flex';
            }
            textFields.forEach(f => {
                if (f.id !== sourceField.id) {
                    const el = document.getElementById(f.id);
                    if (el) el.value = '';
                }
            });
        }

        isTextUpdating = false;
    }

    textFields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) {
            el.addEventListener('input', () => handleTextInput(el, field.type));
        }
    });

    const btnClearText = document.getElementById('btn-rep-text-clear');
    if (btnClearText) {
        btnClearText.addEventListener('click', () => {
            textFields.forEach(f => {
                const el = document.getElementById(f.id);
                if (el) el.value = '';
                if (f.errorId) {
                    const err = document.getElementById(f.errorId);
                    if (err) {
                        err.style.display = 'none';
                        err.textContent = '';
                    }
                }
            });
            if (window.App && window.App.showToast) {
                window.App.showToast('Text and byte inputs cleared.', 'success');
            }
        });
    }
});
