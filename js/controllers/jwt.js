/**
 * Web Utility Toolbox - JWT Parser & Decoder Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    const jwtInput = document.getElementById('jwt-input');
    const jwtStatus = document.getElementById('jwt-status');
    const jwtHeader = document.getElementById('jwt-header');
    const jwtPayload = document.getElementById('jwt-payload');
    const jwtSignature = document.getElementById('jwt-signature');
    const jwtClaims = document.getElementById('jwt-claims-list');
    const btnClearJwt = document.getElementById('btn-clear-jwt');
    const jwtOutputWrapper = document.getElementById('jwt-output-wrapper');

    // Verification & Decryption elements
    const jwtVerificationKey = document.getElementById('jwt-verification-key');
    const jwtDecryptionKey = document.getElementById('jwt-decryption-key');
    const jwtVerificationKeyDrop = document.getElementById('jwt-verification-key-drop');
    const jwtDecryptionKeyDrop = document.getElementById('jwt-decryption-key-drop');
    const jwtSigStatus = document.getElementById('jwt-sig-status');

    function updateClaimsList(headerObj, payloadClaims) {
        if (!jwtClaims) return;
        
        let claims = [];
        
        // Add header metadata
        if (headerObj) {
            if (headerObj.alg) claims.push({ label: 'Algorithm (alg)', val: headerObj.alg });
            if (headerObj.enc) claims.push({ label: 'Encryption (enc)', val: headerObj.enc });
            if (headerObj.kid) claims.push({ label: 'Key ID (kid)', val: headerObj.kid });
            if (headerObj.typ) claims.push({ label: 'Type (typ)', val: headerObj.typ });
            if (headerObj.cty) claims.push({ label: 'Content Type (cty)', val: headerObj.cty });
        }
        
        // Add payload claims
        if (payloadClaims && payloadClaims.length > 0) {
            payloadClaims.forEach(c => {
                claims.push({ label: c.label, val: c.val });
            });
        }
        
        if (claims.length > 0) {
            let claimsHtml = '';
            claims.forEach(claim => {
                claimsHtml += `
                    <div class="jwt-key-val">
                        <span class="jwt-key">${claim.label}</span>
                        <span class="jwt-val">${claim.val}</span>
                    </div>`;
            });
            jwtClaims.innerHTML = claimsHtml;
        } else {
            jwtClaims.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding: 10px 0;">No standard claims detected.</div>';
        }
    }

    async function processJwt() {
        if (!jwtInput) return;

        const token = jwtInput.value.replace(/\s+/g, '');
        if (!token || token.trim() === '') {
            if (jwtStatus) jwtStatus.style.display = 'none';
            if (jwtSigStatus) jwtSigStatus.style.display = 'none';
            if (jwtOutputWrapper) jwtOutputWrapper.style.display = 'none';
            return;
        }

        const res = Tools.parseJwt(token);

        if (res.success) {
            if (jwtOutputWrapper) jwtOutputWrapper.style.display = 'grid';
            
            // Format segments (Header)
            if (jwtHeader) jwtHeader.value = JSON.stringify(res.header, null, 2);
            
            if (res.isJwe) {
                // JWE structure
                if (jwtSignature) jwtSignature.textContent = "N/A (JWE - Encrypted Token)";
                if (jwtSigStatus) jwtSigStatus.style.display = 'none';
                
                const decryptionKey = jwtDecryptionKey ? jwtDecryptionKey.value.trim() : '';
                
                if (!decryptionKey) {
                    // Decryption key required
                    if (jwtStatus) {
                        jwtStatus.style.display = 'flex';
                        jwtStatus.className = 'status-indicator warning';
                        jwtStatus.innerHTML = `
                            <span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                            </span>
                            <span>JWE detected. Provide Private Key to decrypt.</span>`;
                    }
                    if (jwtPayload) {
                        jwtPayload.value = "Decryption key required. Please enter or drop your RSA private key (PEM) in the Decryption Key field above.";
                    }
                    
                    updateClaimsList(res.header, null);
                } else {
                    // Decrypt token
                    if (jwtStatus) {
                        jwtStatus.style.display = 'flex';
                        jwtStatus.className = 'status-indicator info';
                        jwtStatus.innerHTML = `<span>Decrypting JWE...</span>`;
                    }
                    
                    try {
                        const decryptedPayload = await Tools.decryptJwe(token, decryptionKey);
                        
                        let payloadObj;
                        let isJson = false;
                        try {
                            payloadObj = JSON.parse(decryptedPayload);
                            isJson = true;
                        } catch (e) {
                            if (jwtPayload) jwtPayload.value = decryptedPayload;
                        }
                        
                        if (isJson) {
                            if (jwtPayload) jwtPayload.value = JSON.stringify(payloadObj, null, 2);
                            
                            // Parse claims and expiry from the decrypted payload
                            const claims = [];
                            let expInfo = { status: 'none', message: 'No expiration date set' };
                            if (payloadObj.exp) {
                                const expTimestamp = payloadObj.exp * 1000;
                                const expDate = new Date(expTimestamp);
                                const now = Date.now();
                                const diffMs = expTimestamp - now;

                                if (diffMs < 0) {
                                    expInfo = {
                                        status: 'expired',
                                        message: `Expired on ${expDate.toLocaleString()} (${Tools.formatTimeDifference(Math.abs(diffMs))} ago)`
                                    };
                                } else {
                                    expInfo = {
                                        status: 'active',
                                        message: `Expires on ${expDate.toLocaleString()} (valid for another ${Tools.formatTimeDifference(diffMs)})`
                                    };
                                }
                                claims.push({ key: 'exp', label: 'Expiration Time', val: `${payloadObj.exp} (${expDate.toLocaleString()})` });
                            }

                            if (payloadObj.iss) claims.push({ key: 'iss', label: 'Issuer (iss)', val: payloadObj.iss });
                            if (payloadObj.sub) claims.push({ key: 'sub', label: 'Subject (sub)', val: payloadObj.sub });
                            if (payloadObj.aud) claims.push({ key: 'aud', label: 'Audience (aud)', val: Array.isArray(payloadObj.aud) ? payloadObj.aud.join(', ') : payloadObj.aud });
                            if (payloadObj.iat) {
                                const iatDate = new Date(payloadObj.iat * 1000);
                                claims.push({ key: 'iat', label: 'Issued At (iat)', val: `${payloadObj.iat} (${iatDate.toLocaleString()})` });
                            }
                            if (payloadObj.nbf) {
                                const nbfDate = new Date(payloadObj.nbf * 1000);
                                claims.push({ key: 'nbf', label: 'Not Before (nbf)', val: `${payloadObj.nbf} (${nbfDate.toLocaleString()})` });
                            }
                            if (payloadObj.jti) claims.push({ key: 'jti', label: 'JWT ID (jti)', val: payloadObj.jti });
                            
                            if (jwtStatus) {
                                jwtStatus.className = `status-indicator ${expInfo.status === 'expired' ? 'error' : 'success'}`;
                                jwtStatus.innerHTML = `
                                    <span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </span>
                                    <span>Decryption successful. ${expInfo.message}</span>`;
                            }
                            
                            updateClaimsList(res.header, claims);
                        } else {
                            if (jwtStatus) {
                                jwtStatus.className = 'status-indicator success';
                                jwtStatus.innerHTML = `
                                    <span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
                                    </span>
                                    <span>Decryption successful (Non-JSON payload).</span>`;
                            }
                            
                            updateClaimsList(res.header, []);
                        }
                    } catch (err) {
                        if (jwtStatus) {
                            jwtStatus.className = 'status-indicator error';
                            jwtStatus.innerHTML = `
                                <span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                </span>
                                <span>Decryption failed: ${err.message}</span>`;
                        }
                        if (jwtPayload) jwtPayload.value = `Decryption failed: ${err.message}`;
                        updateClaimsList(res.header, null);
                    }
                }
            } else {
                // JWS structure (Standard Signed JWT)
                if (jwtPayload) jwtPayload.value = JSON.stringify(res.payload, null, 2);
                if (jwtSignature) jwtSignature.textContent = res.signatureRaw;
                
                if (jwtStatus) {
                    jwtStatus.style.display = 'flex';
                    jwtStatus.className = `status-indicator ${res.expInfo.status === 'expired' ? 'error' : 'success'}`;
                    jwtStatus.innerHTML = `
                        <span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </span>
                        <span>${res.expInfo.message}</span>`;
                }

                updateClaimsList(res.header, res.claims);

                // Signature verification
                const verificationKey = jwtVerificationKey ? jwtVerificationKey.value.trim() : '';
                if (!verificationKey) {
                    if (jwtSigStatus) {
                        jwtSigStatus.style.display = 'inline-flex';
                        jwtSigStatus.style.backgroundColor = 'var(--bg-input)';
                        jwtSigStatus.style.border = '1px solid var(--border-color)';
                        jwtSigStatus.style.color = 'var(--text-secondary)';
                        jwtSigStatus.textContent = 'Unverified (Provide public key or HMAC secret)';
                    }
                } else {
                    if (jwtSigStatus) {
                        jwtSigStatus.style.display = 'inline-flex';
                        jwtSigStatus.style.backgroundColor = 'var(--bg-input)';
                        jwtSigStatus.style.border = '1px solid var(--border-color)';
                        jwtSigStatus.style.color = 'var(--text-secondary)';
                        jwtSigStatus.textContent = 'Verifying...';
                    }
                    
                    try {
                        const isValid = await Tools.verifyJwtSignature(token, verificationKey);
                        if (isValid) {
                            if (jwtSigStatus) {
                                jwtSigStatus.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                                jwtSigStatus.style.border = '1px solid rgb(16, 185, 129)';
                                jwtSigStatus.style.color = 'rgb(16, 185, 129)';
                                jwtSigStatus.textContent = 'Signature Verified';
                            }
                        } else {
                            if (jwtSigStatus) {
                                jwtSigStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                jwtSigStatus.style.border = '1px solid rgb(239, 68, 68)';
                                jwtSigStatus.style.color = 'rgb(239, 68, 68)';
                                jwtSigStatus.textContent = 'Signature Invalid';
                            }
                        }
                    } catch (err) {
                        if (jwtSigStatus) {
                            jwtSigStatus.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                            jwtSigStatus.style.border = '1px solid rgb(239, 68, 68)';
                            jwtSigStatus.style.color = 'rgb(239, 68, 68)';
                            jwtSigStatus.textContent = `Verification Error: ${err.message}`;
                        }
                    }
                }
            }
        } else {
            if (jwtOutputWrapper) jwtOutputWrapper.style.display = 'none';
            if (jwtSigStatus) jwtSigStatus.style.display = 'none';
            if (jwtStatus) {
                jwtStatus.style.display = 'flex';
                jwtStatus.className = 'status-indicator error';
                jwtStatus.innerHTML = `
                    <span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </span>
                    <span>${res.error}</span>`;
            }
        }
    }

    // Event Listeners
    if (jwtInput) jwtInput.addEventListener('input', processJwt);
    if (jwtVerificationKey) jwtVerificationKey.addEventListener('input', processJwt);
    if (jwtDecryptionKey) jwtDecryptionKey.addEventListener('input', processJwt);

    if (btnClearJwt) {
        btnClearJwt.addEventListener('click', () => {
            if (jwtInput) jwtInput.value = '';
            if (jwtVerificationKey) jwtVerificationKey.value = '';
            if (jwtDecryptionKey) jwtDecryptionKey.value = '';
            if (jwtStatus) jwtStatus.style.display = 'none';
            if (jwtSigStatus) jwtSigStatus.style.display = 'none';
            if (jwtOutputWrapper) jwtOutputWrapper.style.display = 'none';
            if (window.App && window.App.showToast) window.App.showToast('JWT workspace cleared.');
        });
    }

    // Drag & Drop Handling
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

    setupDragAndDrop(jwtVerificationKeyDrop, jwtVerificationKey);
    setupDragAndDrop(jwtDecryptionKeyDrop, jwtDecryptionKey);
});
