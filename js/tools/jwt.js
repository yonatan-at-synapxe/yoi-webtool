/**
 * Web Utility Toolbox - JWT Parser & Decoder Utility Logic
 */

Tools.parseJwt = function(token) {
    if (!token) return { success: false, error: 'Token is empty' };
    
    // Remove all whitespace, newlines, and carriage returns
    const cleanToken = token.replace(/\s+/g, '');
    const parts = cleanToken.split('.');

    if (parts.length === 5) {
        try {
            const headerDecoded = Tools.base64UrlDecode(parts[0]);
            const headerObj = JSON.parse(headerDecoded);
            return {
                success: true,
                isJwe: true,
                header: headerObj,
                parts: parts
            };
        } catch (e) {
            return {
                success: false,
                error: 'Failed to decode JWE header: ' + e.message
            };
        }
    }

    if (parts.length !== 3) {
        return {
            success: false,
            error: `Invalid JWT format: A valid JWT/JWE must contain 3 or 5 dot-separated segments. Found ${parts.length} segments.`
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

// Safely define key conversions if not already loaded from client_assertion.js
if (!Tools.pemToDer) {
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
}

if (!Tools.pkcs1ToPkcs8) {
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
}

/**
 * Base64URL decodes a string to a raw Uint8Array byte buffer.
 * @param {string} str 
 * @returns {Uint8Array}
 */
Tools.base64UrlDecodeToBytes = function(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

/**
 * Extracts SubjectPublicKeyInfo (SPKI) bytes from a DER encoded X.509 Certificate.
 * @param {ArrayBuffer} certDer 
 * @returns {ArrayBuffer}
 */
Tools.extractSpkiFromCert = function(certDer) {
    function parseDerTLV(der, startOffset) {
        const view = new DataView(der);
        let offset = startOffset;
        const tag = view.getUint8(offset++);
        let len = view.getUint8(offset++);
        if (len & 0x80) {
            const numOctets = len & 0x7f;
            len = 0;
            for (let i = 0; i < numOctets; i++) {
                len = (len << 8) | view.getUint8(offset++);
            }
        }
        const valStart = offset;
        offset += len;
        return {
            tag: tag,
            headerLength: valStart - startOffset,
            length: len,
            valueStart: valStart,
            valueEnd: offset,
            totalLength: offset - startOffset
        };
    }

    try {
        // Parse Certificate SEQUENCE
        const cert = parseDerTLV(certDer, 0);
        if (cert.tag !== 0x30) throw new Error("Outer tag is not SEQUENCE");

        // Parse TBSCertificate SEQUENCE
        const tbs = parseDerTLV(certDer, cert.valueStart);
        if (tbs.tag !== 0x30) throw new Error("TBSCertificate is not SEQUENCE");

        let offset = tbs.valueStart;
        
        // 1. Version (optional, [0] tag which is 0xa0)
        let current = parseDerTLV(certDer, offset);
        if (current.tag === 0xa0) {
            offset += current.totalLength;
            current = parseDerTLV(certDer, offset);
        }
        
        // 2. Serial Number (INTEGER, tag 0x02)
        if (current.tag !== 0x02) throw new Error("Serial Number is not INTEGER");
        offset += current.totalLength;
        
        // 3. Signature Algorithm (SEQUENCE, tag 0x30)
        current = parseDerTLV(certDer, offset);
        if (current.tag !== 0x30) throw new Error("Signature Algorithm is not SEQUENCE");
        offset += current.totalLength;
        
        // 4. Issuer (SEQUENCE, tag 0x30)
        current = parseDerTLV(certDer, offset);
        if (current.tag !== 0x30) throw new Error("Issuer is not SEQUENCE");
        offset += current.totalLength;
        
        // 5. Validity (SEQUENCE, tag 0x30)
        current = parseDerTLV(certDer, offset);
        if (current.tag !== 0x30) throw new Error("Validity is not SEQUENCE");
        offset += current.totalLength;
        
        // 6. Subject (SEQUENCE, tag 0x30)
        current = parseDerTLV(certDer, offset);
        if (current.tag !== 0x30) throw new Error("Subject is not SEQUENCE");
        offset += current.totalLength;
        
        // 7. SubjectPublicKeyInfo (SEQUENCE, tag 0x30)
        current = parseDerTLV(certDer, offset);
        if (current.tag !== 0x30) throw new Error("SubjectPublicKeyInfo is not SEQUENCE");
        
        // Return SPKI bytes (including SEQUENCE header)
        return certDer.slice(offset, offset + current.totalLength);
    } catch (e) {
        throw new Error("Failed to extract public key from certificate: " + e.message);
    }
};

/**
 * Verifies JWT signature using Web Crypto API.
 * @param {string} token 
 * @param {string} keyStr 
 * @returns {Promise<boolean>}
 */
Tools.verifyJwtSignature = async function(token, keyStr) {
    if (!token) throw new Error("Token is empty");
    if (!keyStr) throw new Error("Key/Secret is empty");

    const cleanToken = token.replace(/\s+/g, '');
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
        throw new Error("Invalid JWT format: must contain exactly 3 segments.");
    }

    let headerObj;
    try {
        headerObj = JSON.parse(Tools.base64UrlDecode(parts[0]));
    } catch (e) {
        throw new Error("Failed to parse header: " + e.message);
    }

    const alg = headerObj.alg;
    if (!alg) throw new Error("Algorithm (alg) is missing in JWT header.");

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(`${parts[0]}.${parts[1]}`);
    const signatureBuffer = Tools.base64UrlDecodeToBytes(parts[2]);

    // HMAC verification
    if (alg.startsWith("HS")) {
        let hashName;
        if (alg === "HS256") hashName = "SHA-256";
        else if (alg === "HS384") hashName = "SHA-384";
        else if (alg === "HS512") hashName = "SHA-512";
        else throw new Error(`Unsupported HMAC algorithm: ${alg}`);

        const hmacKey = await crypto.subtle.importKey(
            "raw",
            encoder.encode(keyStr),
            { name: "HMAC", hash: { name: hashName } },
            false,
            ["verify"]
        );

        return await crypto.subtle.verify(
            "HMAC",
            hmacKey,
            signatureBuffer,
            dataBuffer
        );
    }

    // RSASSA-PKCS1-v1_5 verification
    if (alg.startsWith("RS")) {
        let hashName;
        if (alg === "RS256") hashName = "SHA-256";
        else if (alg === "RS384") hashName = "SHA-384";
        else if (alg === "RS512") hashName = "SHA-512";
        else throw new Error(`Unsupported RSA algorithm: ${alg}`);

        let keyDer;
        const pem = keyStr.trim();
        if (pem.includes("BEGIN CERTIFICATE")) {
            const certDer = Tools.pemToDer(pem);
            keyDer = Tools.extractSpkiFromCert(certDer);
        } else if (pem.includes("BEGIN PUBLIC KEY")) {
            keyDer = Tools.pemToDer(pem);
        } else {
            throw new Error("Invalid key format: RSA verification requires a public key PEM or X.509 certificate PEM.");
        }

        const publicKey = await crypto.subtle.importKey(
            "spki",
            keyDer,
            { name: "RSASSA-PKCS1-v1_5", hash: { name: hashName } },
            false,
            ["verify"]
        );

        return await crypto.subtle.verify(
            "RSASSA-PKCS1-v1_5",
            publicKey,
            signatureBuffer,
            dataBuffer
        );
    }

    // ECDSA verification
    if (alg.startsWith("ES")) {
        let hashName, curveName;
        if (alg === "ES256") {
            hashName = "SHA-256";
            curveName = "P-256";
        } else if (alg === "ES384") {
            hashName = "SHA-384";
            curveName = "P-384";
        } else if (alg === "ES512") {
            hashName = "SHA-512";
            curveName = "P-521";
        } else {
            throw new Error(`Unsupported ECDSA algorithm: ${alg}`);
        }

        let keyDer;
        const pem = keyStr.trim();
        if (pem.includes("BEGIN CERTIFICATE")) {
            const certDer = Tools.pemToDer(pem);
            keyDer = Tools.extractSpkiFromCert(certDer);
        } else if (pem.includes("BEGIN PUBLIC KEY")) {
            keyDer = Tools.pemToDer(pem);
        } else {
            throw new Error("Invalid key format: ECDSA verification requires a public key PEM or X.509 certificate PEM.");
        }

        const publicKey = await crypto.subtle.importKey(
            "spki",
            keyDer,
            { name: "ECDSA", namedCurve: curveName },
            false,
            ["verify"]
        );

        return await crypto.subtle.verify(
            { name: "ECDSA", hash: { name: hashName } },
            publicKey,
            signatureBuffer,
            dataBuffer
        );
    }

    throw new Error(`Unsupported signature algorithm: ${alg}`);
};

/**
 * Decrypts a JWE token using RSA private key PEM.
 * @param {string} token 
 * @param {string} privateKeyPem 
 * @returns {Promise<string>}
 */
Tools.decryptJwe = async function(token, privateKeyPem) {
    const cleanToken = token.replace(/\s+/g, '');
    const parts = cleanToken.split('.');
    if (parts.length !== 5) {
        throw new Error("Invalid JWE format: must contain exactly 5 segments.");
    }

    let headerObj;
    try {
        const headerDecoded = Tools.base64UrlDecode(parts[0]);
        headerObj = JSON.parse(headerDecoded);
    } catch (e) {
        throw new Error("Failed to parse JWE header: " + e.message);
    }

    const alg = headerObj.alg;
    const enc = headerObj.enc;

    if (!alg) throw new Error("JWE header is missing 'alg' parameter.");
    if (!enc) throw new Error("JWE header is missing 'enc' parameter.");

    let privateKeyDer = Tools.pemToDer(privateKeyPem);
    const isPkcs1 = privateKeyPem.includes("BEGIN RSA PRIVATE KEY");
    if (isPkcs1) {
        privateKeyDer = Tools.pkcs1ToPkcs8(privateKeyDer);
    }

    let hashAlg = "SHA-1";
    if (alg === "RSA-OAEP-256") {
        hashAlg = "SHA-256";
    } else if (alg !== "RSA-OAEP" && alg !== "RSA1_5") {
        throw new Error(`Unsupported JWE key management algorithm: ${alg}`);
    }

    let privateKey;
    try {
        privateKey = await crypto.subtle.importKey(
            "pkcs8",
            privateKeyDer,
            {
                name: "RSA-OAEP",
                hash: { name: hashAlg }
            },
            false,
            ["decrypt"]
        );
    } catch (e) {
        throw new Error("Failed to import JWE private key: " + e.message);
    }

    const encryptedKeyBytes = Tools.base64UrlDecodeToBytes(parts[1]);
    let cek;
    try {
        cek = await crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedKeyBytes
        );
    } catch (e) {
        throw new Error("CEK decryption failed. Check private key compatibility: " + e.message);
    }

    const ivBytes = Tools.base64UrlDecodeToBytes(parts[2]);
    const ciphertextBytes = Tools.base64UrlDecodeToBytes(parts[3]);
    const tagBytes = Tools.base64UrlDecodeToBytes(parts[4]);

    let decryptedBuffer;
    if (enc === "A128GCM" || enc === "A256GCM") {
        const aesKey = await crypto.subtle.importKey(
            "raw",
            cek,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        const dataToDecrypt = new Uint8Array(ciphertextBytes.byteLength + tagBytes.byteLength);
        dataToDecrypt.set(new Uint8Array(ciphertextBytes), 0);
        dataToDecrypt.set(new Uint8Array(tagBytes), ciphertextBytes.byteLength);

        try {
            decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: ivBytes,
                    additionalData: new TextEncoder().encode(parts[0]),
                    tagLength: 128
                },
                aesKey,
                dataToDecrypt
            );
        } catch (e) {
            throw new Error("AES-GCM decryption failed: " + e.message);
        }
    } else if (enc === "A128CBC-HS256" || enc === "A256CBC-HS512") {
        const cekBytes = new Uint8Array(cek);
        let macKeyLength, aesKeyLength, hmacHash;
        if (enc === "A128CBC-HS256") {
            macKeyLength = 16;
            aesKeyLength = 16;
            hmacHash = "SHA-256";
        } else {
            macKeyLength = 32;
            aesKeyLength = 32;
            hmacHash = "SHA-512";
        }

        if (cekBytes.length !== macKeyLength + aesKeyLength) {
            throw new Error(`Invalid CEK length for ${enc}`);
        }

        const macKeyBytes = cekBytes.slice(0, macKeyLength);
        const aesKeyBytes = cekBytes.slice(macKeyLength);

        const aBytes = new TextEncoder().encode(parts[0]);
        const alBytes = new Uint8Array(8);
        let temp = aBytes.length * 8;
        for (let i = 7; i >= 0; i--) {
            alBytes[i] = temp & 0xff;
            temp = Math.floor(temp / 256);
        }

        const hmacInput = new Uint8Array(aBytes.length + ivBytes.length + ciphertextBytes.length + 8);
        hmacInput.set(aBytes, 0);
        hmacInput.set(ivBytes, aBytes.length);
        hmacInput.set(ciphertextBytes, aBytes.length + ivBytes.length);
        hmacInput.set(alBytes, aBytes.length + ivBytes.length + ciphertextBytes.length);

        const macKeyObj = await crypto.subtle.importKey(
            "raw",
            macKeyBytes,
            {
                name: "HMAC",
                hash: { name: hmacHash }
            },
            false,
            ["sign"]
        );

        const computedHmac = await crypto.subtle.sign(
            "HMAC",
            macKeyObj,
            hmacInput
        );

        const computedTagBytes = new Uint8Array(computedHmac).slice(0, macKeyLength);

        if (computedTagBytes.length !== tagBytes.length) {
            throw new Error("HMAC validation failed: size mismatch.");
        }
        let tagMatches = true;
        for (let i = 0; i < computedTagBytes.length; i++) {
            if (computedTagBytes[i] !== tagBytes[i]) {
                tagMatches = false;
            }
        }
        if (!tagMatches) {
            throw new Error("HMAC integrity check validation failed.");
        }

        const aesKey = await crypto.subtle.importKey(
            "raw",
            aesKeyBytes,
            { name: "AES-CBC" },
            false,
            ["decrypt"]
        );

        try {
            decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: "AES-CBC",
                    iv: ivBytes
                },
                aesKey,
                ciphertextBytes
            );
        } catch (e) {
            throw new Error("AES-CBC decryption failed: " + e.message);
        }
    } else {
        throw new Error(`Unsupported content encryption: ${enc}`);
    }

    return new TextDecoder().decode(decryptedBuffer);
};

