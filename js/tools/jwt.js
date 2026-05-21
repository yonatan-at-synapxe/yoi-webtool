/**
 * Web Utility Toolbox - JWT Parser & Decoder Utility Logic
 */

Tools.parseJwt = function(token) {
    if (!token) return { success: false, error: 'Token is empty' };
    
    // Remove all whitespace, newlines, and carriage returns
    const cleanToken = token.replace(/\s+/g, '');
    const parts = cleanToken.split('.');

    if (parts.length !== 3) {
        return {
            success: false,
            error: `Invalid JWT format: A valid JWT must contain exactly 3 dot-separated segments. Found ${parts.length} segments.`
        };
    }

    try {
        const headerDecoded = Tools.base64UrlDecode(parts[0]);
        const payloadDecoded = Tools.base64UrlDecode(parts[1]);
        
        const headerObj = JSON.parse(headerDecoded);
        const payloadObj = JSON.parse(payloadDecoded);

        // Compute claims and stats
        const claims = [];
        
        // Expiry calculation
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

        // Other standard claims mapping
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

        return {
            success: true,
            header: headerObj,
            payload: payloadObj,
            signatureRaw: parts[2],
            claims: claims,
            expInfo: expInfo
        };
    } catch (e) {
        return {
            success: false,
            error: 'Failed to decode token segments: ' + e.message
        };
    }
};

Tools.base64UrlDecode = function(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if missing
    while (base64.length % 4) {
        base64 += '=';
    }
    return Tools.base64ToUtf8(base64);
};

Tools.formatTimeDifference = function(ms) {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${secs % 60}s`;
    return `${secs}s`;
};
