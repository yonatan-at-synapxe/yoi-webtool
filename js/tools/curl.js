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
        shell = 'bash',
        useProxy = false,
        proxyAddr = ''
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
    
    // 3.5 Proxy option
    if (useProxy && proxyAddr && proxyAddr.trim() !== '') {
        parts.push('-x');
        parts.push(Tools.escapeShellArg(proxyAddr.trim(), shell));
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

/**
 * Parses a Postman collection JSON structure and returns its name, flattened requests, and collection variables.
 * @param {string|Object} collectionJson 
 * @returns {{name: string, requests: Array, variables: Array}}
 */
Tools.parsePostmanCollection = function(collectionJson) {
    let collection;
    try {
        collection = typeof collectionJson === 'string' ? JSON.parse(collectionJson) : collectionJson;
    } catch (e) {
        throw new Error('Failed to parse collection JSON: ' + e.message);
    }
    
    const requests = [];
    
    function traverse(itemArray, parentPath = '') {
        if (!Array.isArray(itemArray)) return;
        
        itemArray.forEach(item => {
            const currentPath = parentPath ? `${parentPath} / ${item.name}` : item.name;
            
            if (item.item && Array.isArray(item.item)) {
                traverse(item.item, currentPath);
            } else if (item.request) {
                requests.push({
                    id: Math.random().toString(36).substring(2, 9),
                    name: item.name,
                    path: currentPath,
                    request: item.request
                });
            }
        });
    }
    
    if (collection.item) {
        traverse(collection.item);
    }
    
    const collectionVariables = [];
    if (Array.isArray(collection.variable)) {
        collection.variable.forEach(v => {
            if (v.key) {
                collectionVariables.push({
                    key: v.key,
                    value: v.value !== undefined ? String(v.value) : ''
                });
            }
        });
    }
    
    return {
        name: (collection.info && collection.info.name) || 'Imported Collection',
        requests,
        variables: collectionVariables
    };
};

/**
 * Normalizes a Postman request structure into our tool's format.
 * @param {Object} postmanReq 
 * @returns {Object}
 */
Tools.normalizePostmanRequest = function(postmanReq) {
    const method = postmanReq.method || 'GET';
    
    let url = '';
    if (typeof postmanReq.url === 'string') {
        url = postmanReq.url;
    } else if (postmanReq.url && typeof postmanReq.url === 'object') {
        url = postmanReq.url.raw || '';
    }
    
    const headers = [];
    if (Array.isArray(postmanReq.header)) {
        postmanReq.header.forEach(h => {
            if (h.key) {
                headers.push({
                    key: h.key,
                    value: h.value || '',
                    enabled: h.disabled !== true
                });
            }
        });
    }
    
    const queryParams = [];
    if (postmanReq.url && Array.isArray(postmanReq.url.query)) {
        postmanReq.url.query.forEach(q => {
            if (q.key) {
                queryParams.push({
                    key: q.key,
                    value: q.value || '',
                    enabled: q.disabled !== true
                });
            }
        });
    }
    
    let bodyType = 'none';
    let body = '';
    
    if (postmanReq.body) {
        const mode = postmanReq.body.mode;
        if (mode === 'raw') {
            body = postmanReq.body.raw || '';
            const isJson = (postmanReq.body.options && postmanReq.body.options.raw && postmanReq.body.options.raw.language === 'json') ||
                           headers.some(h => h.key.toLowerCase() === 'content-type' && h.value.toLowerCase().includes('json'));
            bodyType = isJson ? 'json' : 'text';
        } else if (mode === 'urlencoded') {
            bodyType = 'urlencoded';
            if (Array.isArray(postmanReq.body.urlencoded)) {
                body = postmanReq.body.urlencoded
                    .filter(param => param.disabled !== true)
                    .map(param => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value || '')}`)
                    .join('&');
            }
        } else if (mode === 'formdata') {
            bodyType = 'multipart';
            if (Array.isArray(postmanReq.body.formdata)) {
                body = postmanReq.body.formdata
                    .filter(param => param.disabled !== true)
                    .map(param => `${param.key}=${param.value || ''}`)
                    .join('\n');
            }
        }
    }
    
    return {
        method,
        url,
        headers,
        queryParams,
        bodyType,
        body
    };
};

/**
 * Finds all variable placeholders like {{variable_name}} inside a text.
 * @param {string} text 
 * @returns {Array<string>}
 */
Tools.findVariables = function(text) {
    if (!text || typeof text !== 'string') return [];
    const regex = /\{\{([a-zA-Z0-9_\-\.]+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (!matches.includes(match[1])) {
            matches.push(match[1]);
        }
    }
    return matches;
};

/**
 * Replaces all occurrences of {{variable}} in text with values from variablesMap.
 * @param {string} text 
 * @param {Object} variablesMap 
 * @returns {string}
 */
Tools.resolveVariables = function(text, variablesMap) {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/\{\{([a-zA-Z0-9_\-\.]+)\}\}/g, (match, key) => {
        return variablesMap[key] !== undefined ? variablesMap[key] : match;
    });
};

/**
 * Scans a normalized request structure for variable placeholders.
 * @param {Object} normalizedReq 
 * @returns {Array<string>}
 */
Tools.scanRequestForVariables = function(normalizedReq) {
    const vars = new Set();
    
    Tools.findVariables(normalizedReq.url).forEach(v => vars.add(v));
    
    normalizedReq.headers.forEach(h => {
        Tools.findVariables(h.key).forEach(v => vars.add(v));
        Tools.findVariables(h.value).forEach(v => vars.add(v));
    });
    
    normalizedReq.queryParams.forEach(q => {
        Tools.findVariables(q.key).forEach(v => vars.add(v));
        Tools.findVariables(q.value).forEach(v => vars.add(v));
    });
    
    if (normalizedReq.body) {
        Tools.findVariables(normalizedReq.body).forEach(v => vars.add(v));
    }
    
    return Array.from(vars);
};
