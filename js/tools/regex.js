/**
 * Web Utility Toolbox - Regex Sandbox Utility Logic
 */

/**
 * Validates a regex pattern and collects matches from a test string.
 * @param {string} pattern - The regex pattern (without slashes)
 * @param {string} flags   - Regex flags string (e.g. "gi")
 * @param {string} testStr - The string to test against
 * @returns {{ valid: boolean, matches: Array, error?: string }}
 */
Tools.regexTest = function(pattern, flags, testStr) {
    var re;
    try {
        re = new RegExp(pattern, flags);
    } catch (e) {
        return { valid: false, error: e.message, matches: [] };
    }

    var matches = [];
    if (testStr) {
        try {
            if (flags.indexOf('g') !== -1) {
                var allMatches = Array.from(testStr.matchAll(new RegExp(pattern, flags)));
                allMatches.forEach(function(m) {
                    if (m[0].length > 0) {
                        matches.push({ index: m.index, length: m[0].length, value: m[0] });
                    }
                });
            } else {
                var m = re.exec(testStr);
                if (m && m[0].length > 0) {
                    matches.push({ index: m.index, length: m[0].length, value: m[0] });
                }
            }
        } catch (e) {
            return { valid: false, error: 'Runtime error: ' + e.message, matches: [] };
        }
    }

    return { valid: true, matches: matches };
};

/**
 * Builds an HTML string from testStr with matched ranges wrapped in <mark> tags.
 * HTML-special characters are escaped to prevent injection.
 * @param {string} testStr - The original test string
 * @param {Array}  matches - Array of {index, length} match objects (sorted by index)
 * @returns {string} Safe HTML string with highlights
 */
Tools.regexHighlight = function(testStr, matches) {
    if (!testStr) return '';

    function esc(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    if (!matches || matches.length === 0) {
        return esc(testStr);
    }

    var html = '';
    var pos  = 0;

    for (var i = 0; i < matches.length; i++) {
        var match = matches[i];
        if (match.index > pos) {
            html += esc(testStr.substring(pos, match.index));
        }
        html += '<mark class="regex-match">'
             + esc(testStr.substring(match.index, match.index + match.length))
             + '</mark>';
        pos = match.index + match.length;
    }

    if (pos < testStr.length) {
        html += esc(testStr.substring(pos));
    }

    return html;
};

/**
 * Parses a regex pattern string and returns an array of token explanations.
 * @param {string} pattern - The regex pattern string (no surrounding slashes or flags)
 * @returns {Array<{token: string, description: string}>}
 */
Tools.regexExplain = function(pattern) {
    var tokens = [];
    var i      = 0;
    var len    = pattern.length;

    while (i < len) {
        var ch          = pattern[i];
        var raw         = '';
        var description = '';

        /* ── Escape sequences ─────────────────────────────────────────── */
        if (ch === '\\') {
            if (i + 1 < len) {
                var next = pattern[i + 1];
                raw = '\\' + next;
                if      (next === 'd') { description = 'Any digit [0–9]'; }
                else if (next === 'D') { description = 'Any non-digit character'; }
                else if (next === 'w') { description = 'Any word character [a-zA-Z0-9_]'; }
                else if (next === 'W') { description = 'Any non-word character'; }
                else if (next === 's') { description = 'Any whitespace (space, tab, newline…)'; }
                else if (next === 'S') { description = 'Any non-whitespace character'; }
                else if (next === 'b') { description = 'Word boundary'; }
                else if (next === 'B') { description = 'Non-word boundary'; }
                else if (next === 'n') { description = 'Newline character'; }
                else if (next === 't') { description = 'Tab character'; }
                else if (next === 'r') { description = 'Carriage return'; }
                else if (next === '0') { description = 'Null character'; }
                else if (next === 'f') { description = 'Form feed character'; }
                else if (next === 'v') { description = 'Vertical tab character'; }
                else if (next >= '1' && next <= '9') {
                    description = 'Backreference to capture group ' + next;
                } else if (next === 'u' && i + 5 < len) {
                    raw = pattern.substring(i, i + 6);
                    description = 'Unicode character U+' + pattern.substring(i + 2, i + 6).toUpperCase();
                    i += 4;
                } else if (next === 'x' && i + 3 < len) {
                    raw = pattern.substring(i, i + 4);
                    description = 'Hex character 0x' + pattern.substring(i + 2, i + 4).toUpperCase();
                    i += 2;
                } else {
                    description = 'Escaped literal "' + next + '"';
                }
                i += 2;
            } else {
                /* Trailing backslash — incomplete escape */
                raw = '\\';
                description = 'Trailing backslash (incomplete escape)';
                i++;
            }

        /* ── Character class  [...]  [^...] ──────────────────────────── */
        } else if (ch === '[') {
            var classStart = i;
            i++;
            var negated = (i < len && pattern[i] === '^');
            if (negated) i++;
            /* Scan to closing ] — honour escape sequences inside */
            while (i < len) {
                if (pattern[i] === '\\') { i += 2; continue; }
                if (pattern[i] === ']')  { i++;    break; }
                i++;
            }
            raw         = pattern.substring(classStart, i);
            var inner   = negated ? raw.slice(2, -1) : raw.slice(1, -1);
            description = negated
                ? 'Any character NOT in: ' + (inner || '<empty set>')
                : 'Any character in: '     + (inner || '<empty set>');

        /* ── Groups ───────────────────────────────────────────────────── */
        } else if (ch === '(') {
            if (pattern.substring(i, i + 4) === '(?<=') {
                raw = '(?<='; description = 'Positive lookbehind — preceding text must match'; i += 4;
            } else if (pattern.substring(i, i + 4) === '(?<!') {
                raw = '(?<!'; description = 'Negative lookbehind — preceding text must NOT match'; i += 4;
            } else if (pattern.substring(i, i + 3) === '(?:') {
                raw = '(?:'; description = 'Non-capturing group — groups without saving the match'; i += 3;
            } else if (pattern.substring(i, i + 3) === '(?=') {
                raw = '(?='; description = 'Positive lookahead — following text must match'; i += 3;
            } else if (pattern.substring(i, i + 3) === '(?!') {
                raw = '(?!'; description = 'Negative lookahead — following text must NOT match'; i += 3;
            } else {
                raw = '('; description = 'Start of capture group'; i++;
            }

        } else if (ch === ')') {
            raw = ')'; description = 'End of group'; i++;

        /* ── Anchors ──────────────────────────────────────────────────── */
        } else if (ch === '^') {
            raw = '^'; description = 'Start of string (or line with m flag)'; i++;
        } else if (ch === '$') {
            raw = '$'; description = 'End of string (or line with m flag)'; i++;

        /* ── Wildcard ─────────────────────────────────────────────────── */
        } else if (ch === '.') {
            raw = '.'; description = 'Any single character except newline'; i++;

        /* ── Quantifiers ──────────────────────────────────────────────── */
        } else if (ch === '*') {
            if (pattern[i + 1] === '?') { raw = '*?'; description = 'Zero or more times (lazy — as few as possible)'; i += 2; }
            else                         { raw = '*';  description = 'Zero or more times (greedy)'; i++; }

        } else if (ch === '+') {
            if (pattern[i + 1] === '?') { raw = '+?'; description = 'One or more times (lazy — as few as possible)'; i += 2; }
            else                         { raw = '+';  description = 'One or more times (greedy)'; i++; }

        } else if (ch === '?') {
            if (pattern[i + 1] === '?') { raw = '??'; description = 'Zero or one time (lazy)'; i += 2; }
            else                         { raw = '?';  description = 'Zero or one time (optional)'; i++; }

        } else if (ch === '{') {
            var braceStart = i;
            i++;
            while (i < len && pattern[i] !== '}') i++;
            if (i < len) i++; /* consume '}' */
            raw = pattern.substring(braceStart, i);
            var lazy = (i < len && pattern[i] === '?');
            if (lazy) { raw += '?'; i++; }
            var innerQ = raw.replace(/^\{/, '').replace(/\??\}.*$/, '');
            var parts  = innerQ.split(',');
            if (parts.length === 1) {
                var n = parseInt(parts[0], 10);
                description = 'Exactly ' + parts[0] + ' time' + (n !== 1 ? 's' : '');
            } else if (parts[1].trim() === '') {
                description = 'At least ' + parts[0] + ' times';
            } else {
                description = 'Between ' + parts[0] + ' and ' + parts[1] + ' times';
            }
            if (lazy) description += ' (lazy)';

        /* ── Alternation ──────────────────────────────────────────────── */
        } else if (ch === '|') {
            raw = '|'; description = 'Alternation — match either the left or right side'; i++;

        /* ── Literal character ────────────────────────────────────────── */
        } else {
            raw = ch;
            description = (ch === ' ') ? 'Literal space' : 'Literal character "' + ch + '"';
            i++;
        }

        if (raw) {
            tokens.push({ token: raw, description: description });
        }
    }

    return tokens;
};
