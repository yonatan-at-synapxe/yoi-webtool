/**
 * Web Utility Toolbox - Microsoft Entra ID Client Assertion Generator Utility Logic
 */

// Establish namespace safety
if (typeof Tools === 'undefined') {
    window.Tools = {};
}

/**
 * Base64URL encodes an ArrayBuffer.
 * @param {ArrayBuffer} arrayBuffer 
 * @returns {string}
 */
Tools.base64UrlEncode = function(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

/**
 * Converts a PEM string into an ArrayBuffer of its DER bytes.
 * Handles carriage returns, spaces, headers, and footers.
 * @param {string} pem 
 * @returns {ArrayBuffer}
 */
Tools.pemToDer = function(pem) {
    const lines = pem.trim().split('\n');
    const filtered = lines.filter(line => !line.startsWith('-----'));
    const cleaned = filtered.join('').replace(/\s+/g, '');
    
    try {
        const binaryStr = atob(cleaned);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        return bytes.buffer;
    } catch (e) {
        throw new Error("Invalid Base64 format inside PEM content. Ensure no corrupted characters.");
    }
};

/**
 * Programmatically wraps a PKCS#1 RSA private key in a PKCS#8 ASN.1 structure.
 * This is required for browser Web Crypto import compatibility.
 * @param {ArrayBuffer} pkcs1Der 
 * @returns {ArrayBuffer}
 */
Tools.pkcs1ToPkcs8 = function(pkcs1Der) {
    const rsaOid = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
    const pkcs1Length = pkcs1Der.byteLength;
    
    function encodeLength(len) {
        if (len < 128) {
            return [len];
        }
        const bytes = [];
        let temp = len;
        while (temp > 0) {
            bytes.unshift(temp & 0xFF);
            temp = temp >> 8;
        }
        bytes.unshift(0x80 | bytes.length);
        return bytes;
    }
    
    const octetStringLengthBytes = encodeLength(pkcs1Length);
    const octetStringHeader = [0x04].concat(octetStringLengthBytes);
    
    const innerBytes = [0x02, 0x01, 0x00] // Version 0
        .concat(rsaOid)
        .concat(octetStringHeader);
        
    const outerLengthBytes = encodeLength(innerBytes.length + pkcs1Length);
    const outerHeader = [0x30].concat(outerLengthBytes);
    
    const pkcs8Der = new Uint8Array(outerHeader.length + innerBytes.length + pkcs1Length);
    pkcs8Der.set(outerHeader, 0);
    pkcs8Der.set(innerBytes, outerHeader.length);
    pkcs8Der.set(new Uint8Array(pkcs1Der), outerHeader.length + innerBytes.length);
    
    return pkcs8Der.buffer;
};

/**
 * Computes the SHA-1 Certificate Thumbprint (x5t) from a PEM certificate string.
 * @param {string} certPem 
 * @returns {Promise<string>}
 */
Tools.computeCertThumbprint = async function(certPem) {
    if (!certPem || certPem.trim() === '') {
        throw new Error("Certificate PEM content is empty.");
    }
    const certDer = Tools.pemToDer(certPem);
    const hashBuffer = await crypto.subtle.digest("SHA-1", certDer);
    return Tools.base64UrlEncode(hashBuffer);
};

/**
 * Generates an unsigned Header and Payload JSON structures for previewing.
 * @param {string} clientId 
 * @param {string} tenantId 
 * @param {string} thumbprint 
 * @param {string} audUrl 
 * @param {number} lifetimeSeconds 
 * @returns {{header: object, payload: object}}
 */
Tools.buildClientAssertionClaims = function(clientId, tenantId, thumbprint, audUrl, lifetimeSeconds) {
    const cleanClientId = (clientId || '').trim();
    const cleanTenantId = (tenantId || '').trim();
    const cleanAudUrl = (audUrl || '').trim() || `https://login.microsoftonline.com/${cleanTenantId || '{tenant_id}'}/oauth2/token`;
    
    const now = Math.floor(Date.now() / 1000);
    const exp = now + Number(lifetimeSeconds || 3600);
    
    const header = {
        alg: "RS256",
        typ: "JWT",
        x5t: thumbprint || "{certificate_thumbprint}"
    };
    
    const payload = {
        aud: cleanAudUrl,
        exp: exp,
        iss: cleanClientId || "{client_id}",
        jti: crypto.randomUUID ? crypto.randomUUID() : 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6', // Fallback UUID if randomUUID not in context
        nbf: now,
        sub: cleanClientId || "{client_id}"
    };
    
    return { header, payload };
};

/**
 * Generates and signs the full Entra ID Client Assertion JWT.
 * @param {string} clientId 
 * @param {string} tenantId 
 * @param {string} privateKeyPem 
 * @param {string} certPem 
 * @param {string} audUrl 
 * @param {number} lifetimeSeconds 
 * @returns {Promise<string>}
 */
Tools.generateClientAssertion = async function(clientId, tenantId, privateKeyPem, certPem, audUrl, lifetimeSeconds) {
    if (!clientId || clientId.trim() === '') {
        throw new Error("Client ID is required.");
    }
    if (!tenantId || tenantId.trim() === '') {
        throw new Error("Tenant ID is required.");
    }
    if (!privateKeyPem || privateKeyPem.trim() === '') {
        throw new Error("Private Key PEM content is required.");
    }
    if (!certPem || certPem.trim() === '') {
        throw new Error("Certificate PEM content is required.");
    }

    // 1. Compute Certificate Thumbprint (x5t)
    const thumbprint = await Tools.computeCertThumbprint(certPem);
    
    // 2. Prepare Private Key DER Buffer
    let privateKeyDer = Tools.pemToDer(privateKeyPem);
    const isPkcs1 = privateKeyPem.includes("BEGIN RSA PRIVATE KEY");
    if (isPkcs1) {
        privateKeyDer = Tools.pkcs1ToPkcs8(privateKeyDer);
    }
    
    // 3. Import Private Key
    let privateKey;
    try {
        privateKey = await crypto.subtle.importKey(
            "pkcs8",
            privateKeyDer,
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: { name: "SHA-256" }
            },
            false,
            ["sign"]
        );
    } catch (e) {
        throw new Error("Failed to import private key. Ensure it is a valid, unencrypted RSA Private Key (PKCS#1 or PKCS#8). " + e.message);
    }
    
    // 4. Build Header and Payload Objects
    const { header, payload } = Tools.buildClientAssertionClaims(clientId, tenantId, thumbprint, audUrl, lifetimeSeconds);
    
    // 5. Serialize and Base64URL Encode Header & Payload
    const encoder = new TextEncoder();
    const headerStr = JSON.stringify(header);
    const payloadStr = JSON.stringify(payload);
    
    const headerB64 = Tools.base64UrlEncode(encoder.encode(headerStr));
    const payloadB64 = Tools.base64UrlEncode(encoder.encode(payloadStr));
    
    // 6. Sign Header.Payload
    const signInput = `${headerB64}.${payloadB64}`;
    const signInputBuffer = encoder.encode(signInput);
    
    let signatureBuffer;
    try {
        signatureBuffer = await crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            privateKey,
            signInputBuffer
        );
    } catch (e) {
        throw new Error("Cryptographic signing failed. Ensure the private key matches the key parameters. " + e.message);
    }
    
    const signatureB64 = Tools.base64UrlEncode(signatureBuffer);
    
    return `${headerB64}.${payloadB64}.${signatureB64}`;
};
