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
