/**
 * Web Utility Toolbox - Representation Converter Utility Logic
 */

Tools.parseBigInt = function(str, base) {
    let cleaned = str.trim().replace(/\s/g, '');
    if (!cleaned) {
        throw new Error("Input is empty");
    }

    let isNegative = false;
    if (cleaned.startsWith('-')) {
        isNegative = true;
        cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }

    // Strip common prefixes
    if (base === 16 && cleaned.toLowerCase().startsWith('0x')) {
        cleaned = cleaned.substring(2);
    } else if (base === 8 && cleaned.toLowerCase().startsWith('0o')) {
        cleaned = cleaned.substring(2);
    } else if (base === 2 && cleaned.toLowerCase().startsWith('0b')) {
        cleaned = cleaned.substring(2);
    }

    if (!cleaned) {
        throw new Error("Input contains only prefix");
    }

    // Validate characters
    let regex;
    if (base === 2) regex = /^[01]+$/;
    else if (base === 8) regex = /^[0-7]+$/;
    else if (base === 10) regex = /^[0-9]+$/;
    else if (base === 16) regex = /^[0-9a-fA-F]+$/;
    else throw new Error("Unsupported base: " + base);

    if (!regex.test(cleaned)) {
        throw new Error(`Invalid characters for Base ${base} representation`);
    }

    // Parse natively using prefixes
    let prefix = '';
    if (base === 16) prefix = '0x';
    else if (base === 8) prefix = '0o';
    else if (base === 2) prefix = '0b';

    let bigintVal;
    try {
        bigintVal = BigInt(prefix + cleaned);
    } catch (e) {
        throw new Error("Failed to parse BigInt: " + e.message);
    }

    if (isNegative) {
        bigintVal = -bigintVal;
    }
    return bigintVal;
};

Tools.formatBigInt = function(bigint, base) {
    if (typeof bigint !== 'bigint') {
        throw new Error("Value must be a BigInt");
    }
    
    // bigint.toString() supports bases 2 to 36 natively
    let formatted = bigint.toString(base);
    
    // Hex: keep lowercase (or default)
    if (base === 16) {
        formatted = formatted.toLowerCase();
    }
    return formatted;
};

// Byte Stream Conversions
Tools.stringToBytes = function(str) {
    return new TextEncoder().encode(str);
};

Tools.bytesToString = function(bytes) {
    return new TextDecoder().decode(bytes);
};

Tools.bytesToHex = function(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
};

Tools.bytesToBinary = function(bytes) {
    return Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join(' ');
};

Tools.bytesToOctal = function(bytes) {
    return Array.from(bytes).map(b => b.toString(8).padStart(3, '0')).join(' ');
};

Tools.bytesToDecimal = function(bytes) {
    return Array.from(bytes).map(b => b.toString(10)).join(' ');
};

Tools.hexToBytes = function(hexStr) {
    let cleaned = hexStr.replace(/[\s,:]/g, '');
    if (cleaned.length === 0) return new Uint8Array(0);
    
    // If odd length, pad the last character with a leading 0 for seamless typing
    if (cleaned.length % 2 !== 0) {
        cleaned = cleaned.substring(0, cleaned.length - 1) + '0' + cleaned.substring(cleaned.length - 1);
    }
    
    if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
        throw new Error("Invalid characters in Hexadecimal input");
    }
    
    const bytes = new Uint8Array(cleaned.length / 2);
    for (let i = 0; i < cleaned.length; i += 2) {
        bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
    }
    return bytes;
};

Tools.binaryToBytes = function(binStr) {
    const parts = binStr.trim().split(/\s+/).filter(x => x.length > 0);
    if (parts.length === 0) return new Uint8Array(0);
    
    const bytes = new Uint8Array(parts.length);
    for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (!/^[01]+$/.test(p)) {
            throw new Error(`Invalid binary segment at index ${i + 1}: "${p}"`);
        }
        const val = parseInt(p, 2);
        if (val > 255) {
            throw new Error(`Binary byte value at index ${i + 1} exceeds 255: "${p}"`);
        }
        bytes[i] = val;
    }
    return bytes;
};

Tools.octalToBytes = function(octStr) {
    const parts = octStr.trim().split(/\s+/).filter(x => x.length > 0);
    if (parts.length === 0) return new Uint8Array(0);
    
    const bytes = new Uint8Array(parts.length);
    for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (!/^[0-7]+$/.test(p)) {
            throw new Error(`Invalid octal segment at index ${i + 1}: "${p}"`);
        }
        const val = parseInt(p, 8);
        if (val > 255) {
            throw new Error(`Octal byte value at index ${i + 1} exceeds 255: "${p}"`);
        }
        bytes[i] = val;
    }
    return bytes;
};

Tools.decimalToBytes = function(decStr) {
    const parts = decStr.trim().split(/\s+/).filter(x => x.length > 0);
    if (parts.length === 0) return new Uint8Array(0);
    
    const bytes = new Uint8Array(parts.length);
    for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (!/^[0-9]+$/.test(p)) {
            throw new Error(`Invalid decimal segment at index ${i + 1}: "${p}"`);
        }
        const val = parseInt(p, 10);
        if (val > 255) {
            throw new Error(`Decimal byte value at index ${i + 1} exceeds 255: "${p}"`);
        }
        bytes[i] = val;
    }
    return bytes;
};
