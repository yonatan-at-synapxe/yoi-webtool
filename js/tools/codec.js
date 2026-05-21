/**
 * Web Utility Toolbox - Base64 & URL Encoder/Decoder Utility Logic
 */

Tools.utf8ToBase64 = function(str) {
    try {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    } catch (e) {
        throw new Error("Failed to encode to Base64: " + e.message);
    }
};

Tools.base64ToUtf8 = function(str) {
    try {
        // Clean whitespace
        str = str.replace(/\s/g, '');
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch (e) {
        throw new Error("Invalid Base64 format: " + e.message);
    }
};

Tools.urlEncode = function(str) {
    return encodeURIComponent(str);
};

Tools.urlDecode = function(str) {
    try {
        return decodeURIComponent(str);
    } catch (e) {
        throw new Error("Invalid URL encoding: " + e.message);
    }
};

Tools.jsonEscape = function(str) {
    try {
        // Parse to validate it's valid JSON, then re-stringify as an escaped string
        JSON.parse(str);
        return JSON.stringify(str);
    } catch (e) {
        // Not valid JSON object/array — treat as plain string and escape it
        return JSON.stringify(str);
    }
};

Tools.jsonUnescape = function(str) {
    // Try parsing as-is first (handles input with surrounding quotes)
    try {
        const parsed = JSON.parse(str);
        if (typeof parsed === 'string') return parsed;
        return JSON.stringify(parsed, null, 2);
    } catch (e) { /* fall through */ }

    // If input has no surrounding quotes, wrap and retry (handles bare escaped content)
    try {
        const parsed = JSON.parse('"' + str + '"');
        return parsed;
    } catch (e) { /* fall through */ }

    // Last attempt: manually replace common JSON escape sequences
    try {
        return str
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t');
    } catch (e) {
        throw new Error("Invalid JSON escaped string: " + e.message);
    }
};
