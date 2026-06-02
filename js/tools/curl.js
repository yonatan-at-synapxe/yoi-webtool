/**
 * Web Utility Toolbox - Curl Command Builder Utility Logic
 */

/**
 * Builds the final URL with query parameters appended.
 * @param {string} baseUrl 
 * @param {Array<{key: string, value: string, enabled: boolean}>} queryParams 
 * @returns {string}
 */
Tools.buildUrl = function(baseUrl, queryParams) {
    if (!baseUrl) return '';
    
    // Filter active params
    const activeParams = (queryParams || []).filter(p => p.enabled && p.key);
    if (activeParams.length === 0) return baseUrl;
    
    try {
        // Try parsing as absolute URL
        const urlObj = new URL(baseUrl);
        activeParams.forEach(p => {
            urlObj.searchParams.append(p.key, p.value);
        });
        return urlObj.toString();
    } catch (e) {
        // Fallback for relative paths or invalid URL formats
        let finalUrl = baseUrl;
        let searchParamsStr = '';
        activeParams.forEach(p => {
            searchParamsStr += (searchParamsStr ? '&' : '') + encodeURIComponent(p.key) + '=' + encodeURIComponent(p.value);
        });
        if (searchParamsStr) {
            finalUrl += (baseUrl.includes('?') ? '&' : '?') + searchParamsStr;
        }
        return finalUrl;
    }
};

/**
 * Parses query parameters from a URL.
 * @param {string} urlVal 
 * @returns {{baseUrl: string, queryParams: Array<{key: string, value: string, enabled: boolean}>}}
 */
Tools.parseUrlQueryParams = function(urlVal) {
    if (!urlVal) return { baseUrl: '', queryParams: [] };
    
    let baseUrl = urlVal;
    let queryParams = [];
    
    try {
        const urlObj = new URL(urlVal);
        baseUrl = urlObj.origin + urlObj.pathname;
        urlObj.searchParams.forEach((value, key) => {
            queryParams.push({ key, value, enabled: true });
        });
    } catch (e) {
        // Manual parsing if URL doesn't have an origin (relative URL)
        const qIndex = urlVal.indexOf('?');
        if (qIndex !== -1) {
            baseUrl = urlVal.substring(0, qIndex);
            const queryStr = urlVal.substring(qIndex + 1);
            if (queryStr) {
                const parts = queryStr.split('&');
                parts.forEach(part => {
                    if (part) {
                        const eqIndex = part.indexOf('=');
                        if (eqIndex !== -1) {
                            const key = decodeURIComponent(part.substring(0, eqIndex));
                            const value = decodeURIComponent(part.substring(eqIndex + 1));
                            queryParams.push({ key, value, enabled: true });
                        } else {
                            const key = decodeURIComponent(part);
                            queryParams.push({ key, value: '', enabled: true });
                        }
                    }
                });
            }
        }
    }
    return { baseUrl, queryParams };
};

/**
 * Escapes a string to be used as a shell argument.
 * @param {string} str 
 * @param {string} shell ('bash', 'cmd', 'powershell')
 * @returns {string}
 */
Tools.escapeShellArg = function(str, shell) {
    if (!str) return shell === 'cmd' ? '""' : "''";
    
    if (shell === 'cmd') {
        // CMD double quote escaping: wrap in double quotes, escape internal double quotes with \
        return '"' + str.replace(/"/g, '\\"') + '"';
    } else if (shell === 'powershell') {
        // PowerShell single quote escaping: wrap in single quotes, double up internal single quotes
        return "'" + str.replace(/'/g, "''") + "'";
    } else {
        // Bash/POSIX single quote escaping: wrap in single quotes, escape internal single quotes with '\''
        return "'" + str.replace(/'/g, "'\\''") + "'";
    }
};

/**
 * Collapses or formats request body content to be safe for a single-line command.
 * @param {string} body 
 * @param {string} bodyType 
 * @returns {string}
 */
Tools.formatBodyForSingleLine = function(body, bodyType) {
    if (!body) return '';
    if (bodyType === 'json') {
        try {
            // Attempt to parse and minify JSON to remove newlines and extra spacing
            return JSON.stringify(JSON.parse(body));
        } catch (e) {
            // If invalid JSON, just strip newlines
            return body.replace(/\r?\n/g, '').trim();
        }
    } else if (bodyType === 'urlencoded') {
        // Strip newlines and spaces
        return body.replace(/\r?\n/g, '').trim();
    } else {
        // For plain text, escape newlines as literal \n characters
        return body.replace(/\r?\n/g, '\\n');
    }
};

/**
 * Generates the single-line curl command based on options.
 * @param {Object} options 
 * @returns {string}
 */
Tools.generateCurl = function(options) {
    const {
        method = 'GET',
        url = '',
        verbose = false,
        insecure = false,
        headers = [],
        queryParams = [],
        bodyType = 'none',
        body = '',
        shell = 'bash'
    } = options;
    
    const parts = [];
    
    // 1. Executable name
    if (shell === 'powershell') {
        parts.push('curl.exe');
    } else {
        parts.push('curl');
    }
    
    // 2. Verbose flag
    if (verbose) {
        parts.push('-v');
    }
    
    // 3. Skip SSL (insecure) flag
    if (insecure) {
        parts.push('-k');
    }
    
    // 4. Method
    parts.push('-X');
    parts.push(method);
    
    // 5. URL
    const finalUrl = Tools.buildUrl(url, queryParams);
    parts.push(Tools.escapeShellArg(finalUrl || 'http://localhost', shell));
    
    // 6. Headers
    const activeHeaders = headers.filter(h => h.enabled && h.key);
    activeHeaders.forEach(h => {
        const headerStr = `${h.key}: ${h.value}`;
        parts.push('-H');
        parts.push(Tools.escapeShellArg(headerStr, shell));
    });
    
    // 7. Body payload
    if (bodyType !== 'none' && body && body.trim() !== '') {
        const formattedBody = Tools.formatBodyForSingleLine(body, bodyType);
        parts.push('-d');
        parts.push(Tools.escapeShellArg(formattedBody, shell));
    }
    
    return parts.join(' ');
};
