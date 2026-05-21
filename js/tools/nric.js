/**
 * Web Utility Toolbox - Singapore NRIC / FIN Generator Utility Logic
 *
 * Algorithm Reference:
 *   https://en.wikipedia.org/wiki/National_Registration_Identity_Card
 *
 * Prefix groups:
 *   S – Singapore Citizens born before 2000   → weight set 1
 *   T – Singapore Citizens born from 2000      → weight set 2
 *   F – Foreigners issued before 2000          → weight set 1
 *   G – Foreigners issued from 2000            → weight set 2
 */

/**
 * Calculate the check digit (suffix) for a Singapore NRIC / FIN number.
 *
 * @param {string} prefix - One of 'S', 'T', 'F', 'G'
 * @param {string} digits - Exactly 7 numeric digits
 * @returns {{ suffix: string, fullNric: string }} The computed suffix and the assembled NRIC
 */
Tools.computeNricSuffix = function (prefix, digits) {
    // Validate inputs
    prefix = prefix.toUpperCase();
    if (!['S', 'T', 'F', 'G'].includes(prefix)) {
        throw new Error('Prefix must be one of S, T, F, or G.');
    }
    if (!/^\d{7}$/.test(digits)) {
        throw new Error('Digits must be exactly 7 numeric characters.');
    }

    // Weights applied to each of the 7 digit positions
    const WEIGHTS = [2, 7, 6, 5, 4, 3, 2];

    // Compute weighted sum
    let weightedSum = 0;
    for (let i = 0; i < 7; i++) {
        weightedSum += parseInt(digits[i], 10) * WEIGHTS[i];
    }

    // T and G prefixes add an offset of 4 to the weighted sum
    if (prefix === 'T' || prefix === 'G') {
        weightedSum += 4;
    }

    const remainder = weightedSum % 11;

    // Suffix lookup tables
    const ST_SUFFIX = ['J', 'Z', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
    const FG_SUFFIX = ['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'M', 'L', 'K'];

    let suffix;
    if (prefix === 'S' || prefix === 'T') {
        suffix = ST_SUFFIX[remainder];
    } else {
        suffix = FG_SUFFIX[remainder];
    }

    return {
        suffix: suffix,
        fullNric: prefix + digits + suffix,
    };
};

/**
 * Validate a complete NRIC / FIN string.
 *
 * @param {string} nric - Full 9-character NRIC (e.g. "S1234567D")
 * @returns {boolean} True if valid
 */
Tools.validateNric = function (nric) {
    if (!nric || nric.length !== 9) return false;
    const prefix = nric[0].toUpperCase();
    const digits = nric.slice(1, 8);
    const suffix = nric[8].toUpperCase();

    try {
        const result = Tools.computeNricSuffix(prefix, digits);
        return result.suffix === suffix;
    } catch {
        return false;
    }
};
