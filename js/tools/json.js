/**
 * Web Utility Toolbox - JSON Formatter Utility Logic
 */

Tools.formatJson = function(rawText, space) {
    if (!rawText || rawText.trim() === '') {
        return { success: true, formatted: '', info: 'Empty input' };
    }
    try {
        const parsed = JSON.parse(rawText);
        const indent = space === 'tab' ? '\t' : parseInt(space, 10);
        const formatted = JSON.stringify(parsed, null, indent);
        return {
            success: true,
            formatted: formatted,
            stats: {
                keys: Object.keys(Tools.flattenObject(parsed)).length,
                size: new Blob([formatted]).size
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Helper to count JSON keys recursively
Tools.flattenObject = function(ob) {
    let toReturn = {};
    for (let i in ob) {
        if (!ob.hasOwnProperty(i)) continue;
        if ((typeof ob[i]) === 'object' && ob[i] !== null) {
            let flatObject = Tools.flattenObject(ob[i]);
            for (let x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;
                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
};

Tools.escapeHtml = function(text) {
    if (typeof text !== 'string') return text;
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

Tools.jsonToHtmlTree = function(val, key = null) {
    const keySpan = key !== null ? `<span class="json-tree-key">"${key}": </span>` : '';
    
    if (val === null) {
        return `<div class="json-tree-row">${keySpan}<span class="json-tree-val json-null">null</span></div>`;
    }
    
    const type = typeof val;
    if (type === 'string') {
        return `<div class="json-tree-row">${keySpan}<span class="json-tree-val json-string">"${Tools.escapeHtml(val)}"</span></div>`;
    }
    if (type === 'number') {
        return `<div class="json-tree-row">${keySpan}<span class="json-tree-val json-number">${val}</span></div>`;
    }
    if (type === 'boolean') {
        return `<div class="json-tree-row">${keySpan}<span class="json-tree-val json-boolean">${val}</span></div>`;
    }
    
    // Arrays
    if (Array.isArray(val)) {
        if (val.length === 0) {
            return `<div class="json-tree-row">${keySpan}<span class="json-tree-bracket">[ ]</span></div>`;
        }
        
        let html = `<details open class="json-tree-node">`;
        html += `<summary class="json-tree-summary">${keySpan}<span class="json-tree-bracket">[</span> <span class="json-tree-size">${val.length} items</span> <span class="json-tree-bracket">]</span></summary>`;
        html += `<div class="json-tree-children">`;
        
        for (let i = 0; i < val.length; i++) {
            html += Tools.jsonToHtmlTree(val[i], i);
        }
        
        html += `</div>`;
        html += `</details>`;
        return html;
    }
    
    // Objects
    if (type === 'object') {
        const keys = Object.keys(val);
        if (keys.length === 0) {
            return `<div class="json-tree-row">${keySpan}<span class="json-tree-bracket">{ }</span></div>`;
        }
        
        let html = `<details open class="json-tree-node">`;
        html += `<summary class="json-tree-summary">${keySpan}<span class="json-tree-bracket">{</span> <span class="json-tree-size">${keys.length} keys</span> <span class="json-tree-bracket">}</span></summary>`;
        html += `<div class="json-tree-children">`;
        
        for (let i = 0; i < keys.length; i++) {
            html += Tools.jsonToHtmlTree(val[keys[i]], keys[i]);
        }
        
        html += `</div>`;
        html += `</details>`;
        return html;
    }
    
    return '';
};
