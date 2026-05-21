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

    function processJwt() {
        if (!jwtInput) return;

        const token = jwtInput.value;
        if (!token || token.trim() === '') {
            jwtStatus.style.display = 'none';
            jwtOutputWrapper.style.display = 'none';
            return;
        }

        const res = Tools.parseJwt(token);

        if (res.success) {
            jwtOutputWrapper.style.display = 'grid';
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
            
            // Format segments
            jwtHeader.value = JSON.stringify(res.header, null, 2);
            jwtPayload.value = JSON.stringify(res.payload, null, 2);
            
            // Signature info
            jwtSignature.textContent = res.signatureRaw;

            // Claims list
            if (res.claims && res.claims.length > 0) {
                let claimsHtml = '';
                res.claims.forEach(claim => {
                    claimsHtml += `
                        <div class="jwt-key-val">
                            <span class="jwt-key">${claim.label}</span>
                            <span class="jwt-val">${claim.val}</span>
                        </div>`;
                });
                jwtClaims.innerHTML = claimsHtml;
            } else {
                jwtClaims.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding: 10px 0;">No standard claims detected in payload.</div>';
            }
        } else {
            jwtOutputWrapper.style.display = 'none';
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

    if (jwtInput) {
        jwtInput.addEventListener('input', processJwt);
    }
    if (btnClearJwt) {
        btnClearJwt.addEventListener('click', () => {
            jwtInput.value = '';
            jwtStatus.style.display = 'none';
            jwtOutputWrapper.style.display = 'none';
            if (window.App && window.App.showToast) window.App.showToast('JWT workspace cleared.');
        });
    }
});
